// Exhibit-branded showing scheduler — the same two-step flow as AppFolio's
// hosted "Schedule a Showing" page (contact info → live time slots), booked
// through our api-server proxies so the appointment lands in AppFolio's
// showing scheduler exactly as if the prospect used the hosted page.
//
// Designed fallback (mandatory): if anything AppFolio-side fails — slot
// fetch, guest card, booking, or an identity-verification gate we can't
// proxy — the page captures the prospect as a normal tour lead through
// POST /leads (guest card + emails) and hands them the real AppFolio
// showings URL for the unit, so there is never a dead end.
import { useEffect, useRef, useState } from 'react';
import { Link, useSearch } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarCheck, CalendarClock, ExternalLink } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { Seo } from '../components/Seo';
import { useAvailability } from '../hooks/use-availability';
import { useCreateLead } from '../hooks/use-create-lead';
import { useUnsavedChangesWarning } from '../hooks/use-unsaved-changes';
import { useOnlineStatus } from '../hooks/use-online-status';
import {
  formatSlotDate,
  formatSlotTime,
  useBookShowing,
  useShowingContact,
  useShowingSlots,
  ShowingApiError,
  type ShowingContactResponse,
  type ShowingSlot,
} from '../hooks/use-showings';
import { tourUrlForListing } from '../components/floor-plans/UnitGalleryLightbox';
import { trackLead, trackOutboundClick } from '../lib/analytics';
import { HoneypotField, useBotGuard } from '../components/BotGuard';

const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .refine((v) => {
      const digits = v.replace(/\D/g, '');
      return digits.length >= 10 && digits.length <= 15;
    }, 'Enter a valid phone number'),
});

type ContactFormData = z.infer<typeof contactSchema>;

const inputClass =
  'w-full px-4 py-2 border border-border bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30';

interface BookedInfo {
  slot: ShowingSlot;
  fullAddress: string | null;
}

export function ScheduleShowing() {
  const search = useSearch();
  const unit = new URLSearchParams(search).get('unit') ?? '';
  const { data: availability } = useAvailability();
  const unitInfo = availability?.units.find((u) => u.unit === unit);
  const isOnline = useOnlineStatus();

  const botGuard = useBotGuard();
  const contact = useShowingContact();
  const book = useBookShowing();
  const createLead = useCreateLead();

  const [credentials, setCredentials] = useState<ShowingContactResponse | null>(null);
  const [contactData, setContactData] = useState<ContactFormData | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ShowingSlot | null>(null);
  const [booked, setBooked] = useState<BookedInfo | null>(null);
  const [slotTakenNotice, setSlotTakenNotice] = useState(false);
  const [fallback, setFallback] = useState<{ hostedUrl: string | null } | null>(null);
  // The unit dropped out of the availability feed mid-visit (rented / pulled):
  // the server answers `unit_not_listed`. Not a failure — show a clear
  // "no longer available" message instead of the lead-capture fallback.
  const [unitGone, setUnitGone] = useState(false);
  // Server rejected the contact submission itself (validation / bot guard).
  // Terminal for this attempt — no fallback lead is created.
  const [contactRejected, setContactRejected] = useState(false);
  const leadSubmittedRef = useRef(false);

  // Screen-reader focus management: when a failure banner appears mid-flow
  // (slot taken, fallback, unit gone) move focus onto it so the change of
  // state is announced and the keyboard user is standing on the next action.
  const slotTakenRef = useRef<HTMLDivElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);
  const unitGoneRef = useRef<HTMLDivElement>(null);

  const slots = useShowingSlots(unit || null, !!credentials && !fallback && !booked && !unitGone);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ContactFormData>({ resolver: zodResolver(contactSchema) });

  useUnsavedChangesWarning(isDirty && !booked && !fallback && !credentials && !unitGone);

  useEffect(() => {
    if (slotTakenNotice) slotTakenRef.current?.focus();
  }, [slotTakenNotice]);
  useEffect(() => {
    if (fallback) fallbackRef.current?.focus();
  }, [fallback]);
  useEffect(() => {
    if (unitGone) unitGoneRef.current?.focus();
  }, [unitGone]);

  const isUnitNotListed = (err: unknown): boolean =>
    err instanceof ShowingApiError && err.code === 'unit_not_listed';

  const hostedUrlFallback =
    credentials?.hostedUrl ??
    (unitInfo?.listingUrl ? tourUrlForListing(unitInfo.listingUrl) : null);

  /**
   * The mandatory no-dead-end path: capture the prospect as a standard tour
   * lead (emails + guest card via the existing pipeline) and offer the real
   * AppFolio scheduling page. Submitted at most once per visit.
   */
  const activateFallback = (data: ContactFormData | null, hostedUrl?: string | null) => {
    const target = hostedUrl ?? hostedUrlFallback;
    setFallback({ hostedUrl: target });
    if (data && !leadSubmittedRef.current) {
      leadSubmittedRef.current = true;
      createLead.mutate(
        {
          ...botGuard.collect(),
          type: 'tour',
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          unit: unit || undefined,
          message: `Apartment: ${unit}\nSubmitted via the online showing scheduler; automatic booking was unavailable, please reach out to arrange a time.`,
        },
        { onSuccess: () => trackLead('tour', { floorPlanPreference: 'showing_fallback' }) },
      );
    }
  };

  // Slot fetch failed after contact succeeded → fallback (prospect is typed
  // in already; never make them re-enter anything).
  useEffect(() => {
    if (slots.isError && credentials && !fallback && !booked && !unitGone) {
      if (isUnitNotListed(slots.error)) {
        setUnitGone(true);
        return;
      }
      activateFallback(contactData, credentials.hostedUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots.isError]);

  const onContactSubmit = (data: ContactFormData) => {
    if (contact.isPending) return;
    setContactRejected(false);
    setContactData(data);
    contact.mutate(
      { ...data, unit, ...botGuard.collect() },
      {
        onSuccess: (res) => {
          setCredentials(res);
          trackLead('tour', { floorPlanPreference: 'showing_step1' });
        },
        onError: (err) => {
          if (isUnitNotListed(err)) {
            setUnitGone(true);
            return;
          }
          // A validation/bot rejection (400) is terminal — routing it into
          // the lead-capture fallback would let a bot the server just
          // rejected re-enter the pipeline as a standard tour lead.
          if (err instanceof ShowingApiError && err.code === 'invalid_submission') {
            setContactRejected(true);
            return;
          }
          activateFallback(data, err.hostedUrl);
        },
      },
    );
  };

  const onConfirmSlot = () => {
    if (!credentials || !selectedSlot || book.isPending) return;
    setSlotTakenNotice(false);
    book.mutate(
      {
        unit,
        guestCardId: credentials.guestCardId,
        jwt: credentials.jwt,
        slotTime: selectedSlot.time,
        agentId: selectedSlot.agentId,
      },
      {
        onSuccess: (res) => {
          setBooked({ slot: selectedSlot, fullAddress: res.fullAddress });
          trackLead('tour', { floorPlanPreference: 'showing_booked' });
        },
        onError: (err) => {
          if (err.code === 'slot_taken') {
            // Someone grabbed it — refresh the slots and let them re-pick.
            setSelectedSlot(null);
            setSlotTakenNotice(true);
            void slots.refetch();
            return;
          }
          if (isUnitNotListed(err)) {
            setUnitGone(true);
            return;
          }
          activateFallback(contactData, err.hostedUrl);
        },
      },
    );
  };

  const step = booked ? 3 : fallback || unitGone ? -1 : credentials ? 2 : 1;

  return (
    <>
      <Seo
        path="/schedule-showing"
        // `?unit=` deep links get a distinct title/description so crawlers
        // don't flag the parameterized variants as duplicates of each other
        // (canonical still points at /schedule-showing).
        title={unit ? `Book a Showing for Apt ${unit} | Exhibit On Superior` : undefined}
        description={
          unit
            ? `Pick a time to see apartment ${unit} in person at Exhibit On Superior in River North, Chicago. Real-time showing slots from our leasing calendar.`
            : undefined
        }
      />
      <div>
        <PageHero
          image="/images/image-087-012417-5548-ocwsdh.jpg"
          alt="Schedule a Showing | Exhibit On Superior in Chicago, Illinois"
          titleScript="Pick Your Time"
          title={unit ? `Tour Apartment ${unit}` : 'Tour Exhibit'}
          subtitle="Schedule a Showing"
        />

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-3xl">
            {/* Keeps the H1 → H2 → footer-H3 heading order intact even in the
                prerendered/loading state, where no step heading is rendered yet. */}
            <h2 className="sr-only">Book your in-person showing</h2>
            {/* The unit dropped out of the availability feed mid-visit —
                say so plainly instead of showing an empty calendar. */}
            {unitGone && (
              <div
                ref={unitGoneRef}
                tabIndex={-1}
                className="border border-border bg-muted p-12 text-center focus:outline-none"
                role="status"
                aria-live="polite"
              >
                <h2 className="mb-4 text-3xl uppercase tracking-wider">
                  This Apartment Is No Longer Available
                </h2>
                <p className="mb-8 text-lg leading-relaxed">
                  {unit ? `Apartment ${unit}` : 'This apartment'} is no longer available to tour —
                  it may have just been rented. Take a look at our other open apartments.
                </p>
                <Link href="/available-units" className="btn-gold-outline inline-block">
                  View other open apartments
                </Link>
              </div>
            )}

            {/* Unit context / guard */}
            {!unitGone && !unitInfo && availability && (
              <div className="mb-10 border border-border bg-muted p-8 text-center">
                <p className="mb-6 text-lg leading-relaxed">
                  {unit
                    ? `Apartment ${unit} isn't currently available for online scheduling.`
                    : 'Pick an available apartment to book a showing time online.'}
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link href="/available-units" className="btn-gold-outline inline-block">
                    View available apartments
                  </Link>
                  <Link href="/schedule-a-tour" className="btn-dark-outline inline-block">
                    Request a tour instead
                  </Link>
                </div>
              </div>
            )}

            {!unitGone && unitInfo && !booked && !fallback && (
              <>
                {/* Step indicator */}
                <ol className="mb-10 flex justify-center gap-8 text-xs uppercase tracking-wider">
                  {['Tell us about you', 'Select a time'].map((label, i) => (
                    <li
                      key={label}
                      aria-current={step === i + 1 ? 'step' : undefined}
                      className={`flex items-center gap-2 ${step === i + 1 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
                    >
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center border ${step === i + 1 ? 'border-primary bg-primary text-white' : 'border-border'}`}
                      >
                        {i + 1}
                      </span>
                      {label}
                    </li>
                  ))}
                </ol>

                {!isOnline && (
                  <div
                    className="mb-6 border border-destructive bg-destructive/10 p-4 text-destructive"
                    role="status"
                    aria-live="polite"
                  >
                    You appear to be offline. Please check your internet connection.
                  </div>
                )}
              </>
            )}

            {/* Step 1 — contact info */}
            {!unitGone && unitInfo && step === 1 && (
              <div className="border border-border bg-muted p-8">
                <h2 className="mb-2 text-2xl uppercase tracking-wider">Tell Us About You</h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  Booking a showing of Apartment {unit} at 165 W Superior St — your appointment
                  goes straight onto our leasing calendar.
                </p>
                {contactRejected && (
                  <div
                    className="mb-6 border border-destructive bg-destructive/10 p-4 text-destructive"
                    role="alert"
                  >
                    Your submission couldn't be verified. Please review your details and try
                    again, or call us at{' '}
                    <a href="tel:312-450-0635" className="underline">
                      312-450-0635
                    </a>
                    .
                  </div>
                )}
                <form onSubmit={handleSubmit(onContactSubmit)} className="space-y-6" noValidate>
                  <HoneypotField inputRef={botGuard.companyRef} />
                  <div className="grid grid-cols-2 gap-4">
                    {(
                      [
                        ['firstName', 'First Name', 'text'],
                        ['lastName', 'Last Name', 'text'],
                      ] as const
                    ).map(([name, label, type]) => (
                      <div key={name}>
                        <label htmlFor={name} className="mb-2 block text-sm uppercase tracking-wider">
                          {label} *
                        </label>
                        <input
                          type={type}
                          id={name}
                          {...register(name)}
                          aria-invalid={errors[name] ? true : undefined}
                          aria-describedby={errors[name] ? `${name}-error` : undefined}
                          className={inputClass}
                        />
                        {errors[name] && (
                          <p id={`${name}-error`} role="alert" className="mt-1 text-xs text-destructive">
                            {errors[name]?.message}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm uppercase tracking-wider">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      {...register('email')}
                      aria-invalid={errors.email ? true : undefined}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                      className={inputClass}
                    />
                    {errors.email && (
                      <p id="email-error" role="alert" className="mt-1 text-xs text-destructive">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="phone" className="mb-2 block text-sm uppercase tracking-wider">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      {...register('phone')}
                      aria-invalid={errors.phone ? true : undefined}
                      aria-describedby={errors.phone ? 'phone-error' : undefined}
                      className={inputClass}
                    />
                    {errors.phone && (
                      <p id="phone-error" role="alert" className="mt-1 text-xs text-destructive">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={contact.isPending || !isOnline}
                    className="btn-gold-outline w-full border-primary bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                  >
                    {contact.isPending ? 'One moment…' : 'View Available Times'}
                  </button>

                  {/* Texting-consent / privacy language mirroring the AppFolio
                      hosted scheduling form this flow books through. */}
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    By continuing to View Available Times, I agree to receive communication
                    related to my interest in available properties or unit(s). By including my
                    phone number, I agree to receive calls and text messages. Message frequency
                    varies. I can opt out at any time by replying STOP or text HELP for help.
                    Standard message and data rates may apply. Scheduling is provided through
                    AppFolio; all information provided will be treated in accordance with the
                    AppFolio{' '}
                    <a
                      href="https://www.appfolio.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-primary"
                    >
                      Privacy Policy
                    </a>{' '}
                    and{' '}
                    <a
                      href="https://www.appfolio.com/terms/listings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-primary"
                    >
                      Terms of Service
                    </a>
                    , and our{' '}
                    <Link href="/privacy-policy" className="underline hover:text-primary">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </form>
              </div>
            )}

            {/* Step 2 — pick a time */}
            {!unitGone && unitInfo && step === 2 && (
              <div className="border border-border bg-muted p-8">
                <h2 className="mb-2 text-2xl uppercase tracking-wider">
                  Select a Time to View Apartment {unit}
                </h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  All times are Chicago local time at 165 W Superior St.
                </p>

                {slotTakenNotice && (
                  <div
                    ref={slotTakenRef}
                    tabIndex={-1}
                    className="mb-6 border border-destructive bg-destructive/10 p-4 text-destructive focus:outline-none"
                    role="alert"
                  >
                    That time was just booked by someone else. Please pick another time below.
                  </div>
                )}

                {slots.isPending && (
                  <p className="py-8 text-center" role="status" aria-live="polite">
                    <CalendarClock className="mr-2 inline-block h-5 w-5 text-primary" aria-hidden />
                    Loading available times…
                  </p>
                )}

                {slots.data &&
                  (slots.data.days.some((d) => d.slots.length > 0) ? (
                    <div className="space-y-8">
                      {slots.data.days
                        .filter((d) => d.slots.length > 0)
                        .map((day) => (
                          <div key={day.date}>
                            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider">
                              {formatSlotDate(day.date)}
                            </h3>
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                              {day.slots.map((slot) => {
                                const selected =
                                  selectedSlot?.time === slot.time &&
                                  selectedSlot.agentId === slot.agentId;
                                return (
                                  <button
                                    key={`${slot.time}-${slot.agentId}`}
                                    type="button"
                                    onClick={() => setSelectedSlot(slot)}
                                    aria-pressed={selected}
                                    className={`border px-2 py-2 text-sm transition-colors ${
                                      selected
                                        ? 'border-primary bg-primary text-white'
                                        : 'border-border bg-white hover:border-primary hover:text-primary'
                                    }`}
                                  >
                                    {formatSlotTime(slot.time)}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}

                      <div className="border-t border-border pt-6 text-center">
                        {selectedSlot && (
                          <p className="mb-4">
                            In-person showing of Apartment {unit} —{' '}
                            <strong>
                              {formatSlotDate(selectedSlot.time.slice(0, 10))} at{' '}
                              {formatSlotTime(selectedSlot.time)}
                            </strong>
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={onConfirmSlot}
                          disabled={!selectedSlot || book.isPending || !isOnline}
                          className="btn-gold-outline border-primary bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                        >
                          {book.isPending ? 'Booking…' : 'Confirm Appointment'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center">
                      <p className="mb-6">
                        No online showing times are open right now. Send us a tour request and the
                        leasing team will arrange a time with you directly — we already have your
                        contact details.
                      </p>
                      <button
                        type="button"
                        onClick={() => activateFallback(contactData, credentials?.hostedUrl)}
                        className="btn-gold-outline"
                      >
                        Have the leasing team contact me
                      </button>
                    </div>
                  ))}
              </div>
            )}

            {/* Success */}
            {booked && (
              <div
                className="border border-border bg-muted p-12 text-center"
                role="status"
                aria-live="polite"
              >
                <div className="mb-6 inline-flex h-20 w-20 items-center justify-center bg-primary/10 text-primary">
                  <CalendarCheck className="h-10 w-10" aria-hidden />
                </div>
                <h2 className="mb-4 text-3xl uppercase tracking-wider">You're All Set!</h2>
                <p className="mb-2 text-lg leading-relaxed">
                  Your in-person showing of Apartment {unit} is booked for{' '}
                  <strong>
                    {formatSlotDate(booked.slot.time.slice(0, 10))} at{' '}
                    {formatSlotTime(booked.slot.time)}
                  </strong>
                  .
                </p>
                <p className="mb-8 text-lg leading-relaxed">
                  {booked.fullAddress ?? '165 W Superior St, Chicago, IL 60654'} — you will
                  receive an email or text confirmation with your appointment details.
                </p>
                <Link href={`/available-units/${unit}`} className="btn-gold-outline inline-block">
                  Back to Apartment {unit}
                </Link>
              </div>
            )}

            {/* Designed fallback — no dead ends */}
            {fallback && (
              <div
                ref={fallbackRef}
                tabIndex={-1}
                className="border border-border bg-muted p-12 text-center focus:outline-none"
                role="status"
                aria-live="polite"
              >
                <h2 className="mb-4 text-3xl uppercase tracking-wider">We've Got Your Request</h2>
                <p className="mb-8 text-lg leading-relaxed">
                  Online booking isn't available right this moment, but your tour request for{' '}
                  {unit ? `Apartment ${unit}` : 'Exhibit On Superior'} has been sent to our leasing
                  team — they'll reach out shortly to set a time.
                  {fallback.hostedUrl && ' Prefer to pick a time yourself right now?'}
                </p>
                {fallback.hostedUrl && (
                  <a
                    href={fallback.hostedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      trackOutboundClick('tour', fallback.hostedUrl as string, 'schedule_showing_fallback', {
                        floorPlan: unit,
                      })
                    }
                    className="btn-gold-outline inline-flex items-center gap-2"
                  >
                    Open the scheduling page
                    <ExternalLink className="h-4 w-4" aria-hidden />
                  </a>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
