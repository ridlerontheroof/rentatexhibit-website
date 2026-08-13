// Schedule-a-Tour — every prospect picks a real day & time on the leasing
// calendar (same scheduler as /schedule-showing). The form keeps its apartment
// dropdown; picking one books that unit's calendar, while "No specific
// apartment" books against the dedicated internal tour unit via the reserved
// "TOUR" token — the visitor only ever sees "your tour of Exhibit On
// Superior", never that unit.
//
// Designed fallback (mandatory, no dead ends): if anything AppFolio-side
// fails — contact step, slot fetch, or booking — the page captures the
// prospect as a standard tour lead through POST /leads with all their form
// details (move-in date, floor-plan preference, comments), exactly like the
// old request form. A specific-apartment prospect also gets the hosted
// AppFolio scheduling link; the general path never does (the hosted page
// would expose the internal tour unit).
import { useEffect, useRef, useState } from 'react';
import { Link, useSearch } from 'wouter';
import { PageHero } from '../components/PageHero';
import { useAvailability } from '../hooks/use-availability';
import { useCreateLead } from '../hooks/use-create-lead';
import { useUnsavedChangesWarning } from '../hooks/use-unsaved-changes';
import { useOnlineStatus } from '../hooks/use-online-status';
import { useBackOnlineNotice } from '../hooks/use-back-online-notice';
import { Calendar, CalendarCheck, ExternalLink } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Seo } from '../components/Seo';
import { trackLead, trackOutboundClick } from '../lib/analytics';
import { QuickAnswer } from '../components/QuickAnswer';
import { FaqSection } from '../components/FaqSection';
import { HoneypotField, useBotGuard } from '../components/BotGuard';
import { SlotPicker } from '../components/showings/SlotPicker';
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

const tourSchema = z.object({
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
  moveInDate: z.string().min(1, 'Move-in date is required'),
  bedrooms: z.string().min(1, 'Please select floor plan preference'),
  unit: z.string().optional(),
  message: z.string().optional(),
});

type TourFormData = z.infer<typeof tourSchema>;

/**
 * Reserved unit token for the no-specific-apartment path. The api-server
 * resolves it to the dedicated tour unit; it never collides with real
 * apartment numbers (digits / "04M02" style).
 */
const GENERAL_TOUR_UNIT = 'TOUR';

interface BookedInfo {
  slot: ShowingSlot;
  fullAddress: string | null;
}

export function ScheduleTour() {
  const createLead = useCreateLead();
  const contact = useShowingContact();
  const book = useBookShowing();
  const isOnline = useOnlineStatus();
  const [showBackOnline, dismissBackOnline] = useBackOnlineNotice();
  const botGuard = useBotGuard();
  const { data: availability } = useAvailability();
  const search = useSearch();
  const requestedUnit = new URLSearchParams(search).get('unit') ?? '';
  const availableUnits = availability?.units ?? [];
  // Only trust a prefilled unit that's actually available right now.
  const defaultUnit = availableUnits.some((u) => u.unit === requestedUnit)
    ? requestedUnit
    : '';

  // Scheduler state (same machine as ScheduleShowing). Contact details are
  // carried over in memory only — never in the URL.
  const [tourData, setTourData] = useState<TourFormData | null>(null);
  const [credentials, setCredentials] = useState<ShowingContactResponse | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ShowingSlot | null>(null);
  const [booked, setBooked] = useState<BookedInfo | null>(null);
  const [slotTakenNotice, setSlotTakenNotice] = useState(false);
  // Lead-capture fallback engaged (= today's plain tour request). hostedUrl
  // is only ever set for a specific-apartment choice.
  const [fallback, setFallback] = useState<{ hostedUrl: string | null } | null>(null);
  // Server rejected the contact submission itself (validation / bot guard).
  // Terminal for this attempt — no fallback lead is created.
  const [contactRejected, setContactRejected] = useState(false);
  const leadSubmittedRef = useRef(false);

  const chosenUnit = tourData?.unit || '';
  const isGeneral = !chosenUnit;
  const schedulerUnit = chosenUnit || GENERAL_TOUR_UNIT;

  const slots = useShowingSlots(
    credentials ? schedulerUnit : null,
    !!credentials && !fallback && !booked,
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, dirtyFields },
    setValue,
  } = useForm<TourFormData>({
    resolver: zodResolver(tourSchema),
    defaultValues: { unit: '' },
  });

  // Availability loads after first render; prefill the apartment select from
  // the ?unit= link once the unit is confirmed available — unless the visitor
  // already picked one themselves.
  useEffect(() => {
    if (defaultUnit && !dirtyFields.unit) {
      setValue('unit', defaultUnit);
    }
  }, [defaultUnit, dirtyFields.unit, setValue]);

  // The request is safe once the guest card exists (credentials) or the
  // fallback lead actually landed; until then, warn before leaving.
  useUnsavedChangesWarning(
    isDirty && !credentials && !createLead.isSuccess && !createLead.isPending && !contact.isPending,
  );

  // Screen-reader focus management (same pattern as ScheduleShowing).
  const fallbackRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const slotTakenRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (fallback) fallbackRef.current?.focus();
  }, [fallback]);
  useEffect(() => {
    if (createLead.isError || contactRejected) errorRef.current?.focus();
  }, [createLead.isError, contactRejected]);
  useEffect(() => {
    if (slotTakenNotice) slotTakenRef.current?.focus();
  }, [slotTakenNotice]);

  const leadDetails = (data: TourFormData) =>
    [
      data.unit ? `Apartment: ${data.unit}` : 'No specific apartment — general tour',
      data.bedrooms ? `Floor plan preference: ${data.bedrooms}` : '',
      data.message ?? '',
    ]
      .filter(Boolean)
      .join('\n');

  /**
   * The mandatory no-dead-end path: capture the prospect as a standard tour
   * lead with everything they typed (move-in date, preference, comments) —
   * exactly today's plain submission. Submitted at most once per visit; the
   * scheduler's contact step and this lead never both create a guest card
   * for the same prospect unless AppFolio already failed before the card
   * existed.
   */
  const activateFallback = (data: TourFormData | null, hostedUrl?: string | null) => {
    // Never hand the general path the hosted page — it would present the
    // internal tour unit as if it were an apartment.
    setFallback({ hostedUrl: data?.unit ? (hostedUrl ?? null) : null });
    if (data && !leadSubmittedRef.current) {
      leadSubmittedRef.current = true;
      createLead.mutate(
        {
          type: 'tour',
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          preferredDate: data.moveInDate,
          message: leadDetails(data) || undefined,
          unit: data.unit || undefined,
          ...botGuard.collect(),
        },
        {
          onSuccess: () => trackLead('tour', { floorPlanPreference: data.bedrooms }),
          // Let a network hiccup be retried from the fallback screen.
          onError: () => {
            leadSubmittedRef.current = false;
          },
        },
      );
    }
  };

  // Slot fetch failed after contact succeeded → fallback (prospect is typed
  // in already; never make them re-enter anything).
  useEffect(() => {
    if (slots.isError && credentials && !fallback && !booked) {
      activateFallback(tourData, credentials.hostedUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots.isError]);

  const onSubmit = (data: TourFormData) => {
    if (contact.isPending) return;
    setContactRejected(false);
    setTourData(data);
    contact.mutate(
      {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        unit: data.unit || GENERAL_TOUR_UNIT,
        ...botGuard.collect(),
      },
      {
        onSuccess: (res) => {
          setCredentials(res);
          trackLead('tour', { floorPlanPreference: data.bedrooms });
        },
        onError: (err) => {
          // A validation/bot rejection (400) is terminal — routing it into
          // the lead-capture fallback would let a bot the server just
          // rejected re-enter the pipeline as a standard tour lead.
          if (err instanceof ShowingApiError && err.code === 'invalid_submission') {
            setContactRejected(true);
            return;
          }
          // Anything else (AppFolio down, unit pulled mid-visit, tour unit
          // misconfigured) → today's plain tour request.
          activateFallback(data, err instanceof ShowingApiError ? err.hostedUrl : null);
        },
      },
    );
  };

  const onConfirmSlot = () => {
    if (!credentials || !selectedSlot || book.isPending) return;
    setSlotTakenNotice(false);
    book.mutate(
      {
        unit: schedulerUnit,
        guestCardId: credentials.guestCardId,
        jwt: credentials.jwt,
        slotTime: selectedSlot.time,
        agentId: selectedSlot.agentId,
        // General path only: the server sends the Exhibit-branded booking
        // confirmation itself (AppFolio's auto-emails for this path carry
        // corporate branding). Unit-specific bookings stay AppFolio-owned.
        ...(isGeneral && tourData
          ? {
              firstName: tourData.firstName,
              lastName: tourData.lastName,
              email: tourData.email,
            }
          : {}),
      },
      {
        onSuccess: (res) => {
          setBooked({ slot: selectedSlot, fullAddress: res.fullAddress });
          trackLead('tour', { floorPlanPreference: 'tour_booked' });
        },
        onError: (err) => {
          if (err.code === 'slot_taken') {
            // Someone grabbed it — refresh the slots and let them re-pick.
            setSelectedSlot(null);
            setSlotTakenNotice(true);
            void slots.refetch();
            return;
          }
          activateFallback(tourData, err.hostedUrl);
        },
      },
    );
  };

  const inSlotStep = !!credentials && !fallback && !booked;

  // The general path never shows the internal tour unit's address line.
  const bookedAddress =
    booked && (isGeneral ? '165 W Superior St, Chicago, IL 60654' : (booked.fullAddress ?? '165 W Superior St, Chicago, IL 60654'));

  return (
    <>
      <Seo
        path="/schedule-a-tour"
        // `?unit=` deep links get a distinct title so crawlers don't flag the
        // parameterized variant as a duplicate of the base page (canonical
        // still points at /schedule-a-tour).
        title={
          requestedUnit
            ? `Schedule a Tour for Apt ${requestedUnit} | Exhibit On Superior`
            : undefined
        }
        description={
          requestedUnit
            ? `Request a tour of apartment ${requestedUnit} at Exhibit On Superior in River North, Chicago — pick a date and our leasing team will confirm your visit.`
            : undefined
        }
      />
      <div>
        <PageHero
          image="/images/image-087-012417-5548-ocwsdh.jpg"
          alt="Furnished apartment sitting area with leather daybed and floor-to-ceiling windows at Exhibit On Superior"
          titleScript="Let Us Show You"
          title="Around"
          subtitle="Schedule a Tour"
        />

        <QuickAnswer path="/schedule-a-tour" />

        <section id="request-a-showing" className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            {/* Booked — the scheduler confirmed a real calendar appointment. */}
            {booked && (
              <div
                className="max-w-2xl mx-auto text-center bg-muted p-12 border border-border"
                role="status"
                aria-live="polite"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 text-primary mb-6">
                  <CalendarCheck className="w-10 h-10" aria-hidden />
                </div>
                <h2 className="text-3xl uppercase tracking-wider mb-4">You're All Set!</h2>
                <p className="text-lg leading-relaxed mb-2">
                  {isGeneral
                    ? 'Your tour of Exhibit On Superior is booked for '
                    : `Your in-person showing of Apartment ${chosenUnit} is booked for `}
                  <strong>
                    {formatSlotDate(booked.slot.time.slice(0, 10))} at{' '}
                    {formatSlotTime(booked.slot.time)}
                  </strong>
                  .
                </p>
                <p className="text-lg leading-relaxed mb-8">
                  {bookedAddress} — you will receive an email or text confirmation with your
                  appointment details.
                </p>
                <Link
                  href={isGeneral ? '/available-units' : `/available-units/${chosenUnit}`}
                  className="btn-gold-outline inline-block"
                >
                  {isGeneral ? 'Browse available apartments' : `Back to Apartment ${chosenUnit}`}
                </Link>
              </div>
            )}

            {/* Fallback — request captured as a standard tour lead. */}
            {!booked && fallback && (
              <div
                ref={fallbackRef}
                tabIndex={-1}
                className="max-w-2xl mx-auto text-center bg-muted p-12 border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                role="status"
                aria-live="polite"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 text-primary mb-6">
                  <Calendar className="w-10 h-10" aria-hidden />
                </div>
                {createLead.isError ? (
                  <>
                    <h2 className="text-3xl uppercase tracking-wider mb-4">Almost There</h2>
                    <div
                      ref={errorRef}
                      tabIndex={-1}
                      className="bg-destructive/10 text-destructive p-4 mb-6 border border-destructive focus:outline-none focus:ring-2 focus:ring-ring text-left"
                      role="alert"
                    >
                      Something went wrong and your tour request couldn't be sent. Please check
                      your connection and try again, or call us at{' '}
                      <a href="tel:312-450-0635" className="underline">
                        312-450-0635
                      </a>
                      .
                    </div>
                    <button
                      type="button"
                      onClick={() => activateFallback(tourData, fallback.hostedUrl)}
                      className="btn-gold-outline inline-block"
                    >
                      Try sending my tour request again
                    </button>
                  </>
                ) : (
                  <>
                    <h2 className="text-3xl uppercase tracking-wider mb-4">
                      Tour Request Received!
                    </h2>
                    <p className="text-lg leading-relaxed mb-8">
                      Online booking isn't available right this moment, but your tour request has
                      been sent to our leasing team. A member of the team will contact you shortly
                      to confirm your tour appointment.
                      {fallback.hostedUrl && ' Prefer to pick a time yourself right now?'}
                    </p>
                    {fallback.hostedUrl && (
                      <a
                        href={fallback.hostedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          trackOutboundClick(
                            'tour',
                            fallback.hostedUrl as string,
                            'schedule_tour_fallback',
                            { floorPlan: chosenUnit },
                          )
                        }
                        className="btn-gold-outline inline-flex items-center gap-2"
                      >
                        Open the scheduling page
                        <ExternalLink className="h-4 w-4" aria-hidden />
                      </a>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Step 2 — pick a day & time (same scheduler as /schedule-showing). */}
            {inSlotStep && (
              <div className="max-w-3xl mx-auto bg-muted p-6 sm:p-8 border border-border">
                <h2 className="mb-2 text-2xl uppercase tracking-wider">
                  {isGeneral
                    ? 'Select a Time for Your Tour'
                    : `Select a Time to View Apartment ${chosenUnit}`}
                </h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  All times are Chicago local time at 165 W Superior St.
                </p>
                <SlotPicker
                  isPending={slots.isPending}
                  days={slots.data?.days}
                  selectedSlot={selectedSlot}
                  onSelectSlot={setSelectedSlot}
                  onConfirm={onConfirmSlot}
                  confirmPending={book.isPending}
                  confirmDisabled={!isOnline}
                  selectionLabel={
                    isGeneral
                      ? 'Your tour of Exhibit On Superior'
                      : `In-person showing of Apartment ${chosenUnit}`
                  }
                  slotTakenNotice={slotTakenNotice}
                  slotTakenRef={slotTakenRef}
                  noSlotsMessage="No online tour times are open right now. Send us your request and the leasing team will arrange a time with you directly — we already have your contact details."
                  noSlotsActionLabel="Have the leasing team contact me"
                  onNoSlotsAction={() =>
                    activateFallback(tourData, isGeneral ? null : credentials?.hostedUrl)
                  }
                />
              </div>
            )}

            {/* Step 1 — the tour request form (unchanged fields). */}
            {!booked && !fallback && !inSlotStep && (
              <div>
                {/* The tour-request form is the primary path on this page and
                    leads the section; the Leasing Office contact strip sits
                    below it as the secondary path. Live listings stay behind
                    the View Available Units button. */}
                <div className="max-w-3xl mx-auto bg-muted p-6 sm:p-8 border border-border">
                  <h2 className="text-2xl uppercase tracking-wider mb-6">Request a Showing</h2>

                  {!isOnline && (
                    <div
                      className="bg-destructive/10 text-destructive p-4 mb-6 border border-destructive"
                      role="status"
                      aria-live="polite"
                    >
                      You appear to be offline. Please check your internet connection before requesting a tour.
                    </div>
                  )}

                  {showBackOnline && (
                    <div
                      className="bg-primary/10 text-primary p-4 mb-6 border border-primary flex items-start justify-between gap-4"
                      role="status"
                      aria-live="polite"
                    >
                      <span>You're back online. You can now request your tour.</span>
                      <button
                        type="button"
                        onClick={dismissBackOnline}
                        aria-label="Dismiss notice"
                        className="text-primary underline underline-offset-4 hover:text-primary/80 text-sm uppercase tracking-wider flex-shrink-0"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  {contactRejected && (
                    <div
                      ref={errorRef}
                      tabIndex={-1}
                      className="bg-destructive/10 text-destructive p-4 mb-6 border border-destructive focus:outline-none focus:ring-2 focus:ring-ring"
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

                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    {...botGuard.formProps}
                    // The back-online notice stays until the visitor dismisses it
                    // or starts interacting with the form (WCAG 2.2.1 Timing
                    // Adjustable — no disappearing-on-a-timer).
                    onChange={dismissBackOnline}
                    className="space-y-6"
                    noValidate
                  >
                    <HoneypotField inputRef={botGuard.honeypotRef} />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm uppercase tracking-wider mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          autoComplete="given-name"
                          enterKeyHint="next"
                          {...register('firstName')}
                          aria-invalid={errors.firstName ? true : undefined}
                          aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                          className="w-full px-4 py-2 border border-border bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                        />
                        {errors.firstName && (
                          <p id="firstName-error" role="alert" className="text-destructive text-xs mt-1">
                            {errors.firstName.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm uppercase tracking-wider mb-2">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          autoComplete="family-name"
                          enterKeyHint="next"
                          {...register('lastName')}
                          aria-invalid={errors.lastName ? true : undefined}
                          aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                          className="w-full px-4 py-2 border border-border bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                        />
                        {errors.lastName && (
                          <p id="lastName-error" role="alert" className="text-destructive text-xs mt-1">
                            {errors.lastName.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-4">
                    <div>
                      <label htmlFor="email" className="block text-sm uppercase tracking-wider mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        autoComplete="email"
                        enterKeyHint="next"
                        {...register('email')}
                        aria-invalid={errors.email ? true : undefined}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                        className="w-full px-4 py-2 border border-border bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                      />
                      {errors.email && (
                        <p id="email-error" role="alert" className="text-destructive text-xs mt-1">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm uppercase tracking-wider mb-2">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        autoComplete="tel"
                        enterKeyHint="next"
                        {...register('phone')}
                        aria-invalid={errors.phone ? true : undefined}
                        aria-describedby={errors.phone ? 'phone-error' : undefined}
                        className="w-full px-4 py-2 border border-border bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                      />
                      {errors.phone && (
                        <p id="phone-error" role="alert" className="text-destructive text-xs mt-1">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-4">
                    <div>
                      <label htmlFor="moveInDate" className="block text-sm uppercase tracking-wider mb-2">
                        Desired Move-In Date *
                      </label>
                      <input
                        type="date"
                        id="moveInDate"
                        {...register('moveInDate')}
                        aria-invalid={errors.moveInDate ? true : undefined}
                        aria-describedby={errors.moveInDate ? 'moveInDate-error' : undefined}
                        className="w-full appearance-none px-4 py-2 border border-border bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                      />
                      {errors.moveInDate && (
                        <p id="moveInDate-error" role="alert" className="text-destructive text-xs mt-1">
                          {errors.moveInDate.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="bedrooms" className="block text-sm uppercase tracking-wider mb-2">
                        Floor Plan Preference *
                      </label>
                      <select
                        id="bedrooms"
                        {...register('bedrooms')}
                        aria-invalid={errors.bedrooms ? true : undefined}
                        aria-describedby={errors.bedrooms ? 'bedrooms-error' : undefined}
                        className="w-full px-4 py-2 border border-border bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="">Select...</option>
                        <option value="Studio">Studio</option>
                        <option value="1 Bedroom">1 Bedroom</option>
                        <option value="2 Bedrooms">2 Bedrooms</option>
                        <option value="3 Bedrooms">3 Bedrooms</option>
                        <option value="Any">Any / Not Sure</option>
                      </select>
                      {errors.bedrooms && (
                        <p id="bedrooms-error" role="alert" className="text-destructive text-xs mt-1">
                          {errors.bedrooms.message}
                        </p>
                      )}
                    </div>
                    </div>

                    {availableUnits.length > 0 && (
                      <div>
                        <label htmlFor="unit" className="block text-sm uppercase tracking-wider mb-2">
                          Interested in a Specific Apartment?
                        </label>
                        <select
                          id="unit"
                          {...register('unit')}
                          className="w-full px-4 py-2 border border-border bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                        >
                          <option value="">No specific apartment</option>
                          {availableUnits.map((u) => (
                            <option key={u.unit} value={u.unit}>
                              Apt {u.unit}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label htmlFor="message" className="block text-sm uppercase tracking-wider mb-2">
                        Additional Comments
                      </label>
                      <textarea
                        id="message"
                        {...register('message')}
                        rows={3}
                        placeholder="Preferred tour times, questions, etc."
                        className="w-full px-4 py-2 border border-border bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={contact.isPending || !isOnline}
                      className="btn-gold-outline bg-primary text-white border-primary hover:bg-primary/90 w-full disabled:opacity-50"
                    >
                      {contact.isPending ? 'Submitting...' : 'Request Tour'}
                    </button>

                    {/* Texting-consent / privacy language mirroring the AppFolio
                        hosted scheduling form this flow books through. */}
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      By submitting this form, I agree to receive communication related to my
                      interest in available properties or unit(s). By including my phone number, I
                      agree to receive calls and text messages. Message frequency varies. I can opt
                      out at any time by replying STOP or text HELP for help. Standard message and
                      data rates may apply. Scheduling is provided through AppFolio; all
                      information provided will be treated in accordance with the AppFolio{' '}
                      <a
                        href="https://www.appfolio.com/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Privacy Policy (AppFolio)"
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
                      <Link
                        href="/privacy-policy"
                        aria-label="Privacy Policy (Exhibit on Superior)"
                        className="underline hover:text-primary"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </form>
                </div>

                {/* Leasing Office — secondary contact strip below the form */}
                <div className="max-w-3xl mx-auto mt-8 bg-dark-section text-white p-6">
                  <h2 className="text-lg uppercase tracking-wider mb-3">Leasing Office</h2>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <p className="mb-1">165 W Superior St Chicago, IL 60654</p>
                      <p>
                        <a href="tel:312-450-0635" className="text-white underline underline-offset-4 hover:text-white/80">
                          312-450-0635
                        </a>
                      </p>
                    </div>
                    <div className="flex w-fit flex-col sm:flex-row gap-4">
                      <a href="mailto:exhibit@highlandptrs.com?subject=Schedule%20a%20Tour%20at%20Exhibit%20On%20Superior" className="btn-gold-outline block text-center">
                        Email us to schedule a tour
                      </a>
                      <Link
                        href="/available-units"
                        className="btn-gold-outline bg-primary! text-white! border-primary! hover:bg-primary/90! block text-center"
                      >
                        View Available Units
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
        <FaqSection path="/schedule-a-tour" />
    </>
  );
}
