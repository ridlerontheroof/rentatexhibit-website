// Exhibit-branded "Start Your Application" step — the on-brand bridge between
// any Apply button on the site and AppFolio's secure hosted rental
// application. It shows the residence being applied for, sets expectations
// (fees, documents, screening, timeline — all rendered from the shared
// fee/fact modules), and captures the applicant's contact info as a lead
// (guest card + emails via POST /leads) before handing off.
//
// The hand-off is NEVER blocked: the visitor continues to AppFolio's
// application whether or not the lead capture succeeds (or even answers) —
// abandoned applicants become leads, but a lead outage must not cost an
// application.
import { useRef, useState } from 'react';
import { Link, useSearch } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ExternalLink, FileCheck, IdCard, ShieldCheck, Timer } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { Seo } from '../components/Seo';
import { useAvailability } from '../hooks/use-availability';
import { useCreateLead } from '../hooks/use-create-lead';
import { useUnsavedChangesWarning } from '../hooks/use-unsaved-changes';
import { useOnlineStatus } from '../hooks/use-online-status';
import { applyUrlForListing } from '../components/floor-plans/UnitGalleryLightbox';
import {
  bedBathLabel,
  formatRent,
  groupForUnit,
} from '../components/floor-plans/AvailableUnits';
import { resolveUnitSqft } from '../data/unitSqft';
import { APPLY_URL } from '../data/seo';
import { APPLICATION_FEE, ADMIN_FEE, SECURITY_DEPOSIT } from '../data/fees';
import {
  APPROVAL_WINDOW_DISPLAY,
  CREDIT_SCORE_COSIGNER_MIN,
  CREDIT_SCORE_MIN,
  RENTERS_INSURANCE_LLI_DISPLAY,
} from '../data/propertyFacts';
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

/**
 * Longest the hand-off will wait on the lead POST before forwarding anyway.
 * The capture is valuable, but a slow/unreachable API must never hold an
 * applicant hostage on this page.
 */
export const HANDOFF_MAX_WAIT_MS = 4000;

/**
 * "What to have ready" checklist — every figure renders from the shared
 * fee/fact modules (src/data/fees.ts, src/data/propertyFacts.ts), the same
 * sources the Fees page and Knowledge Center guards are pinned to.
 */
export function applicationChecklist() {
  return [
    {
      Icon: FileCheck,
      title: 'Application & admin fees',
      body: `The application fee is ${APPLICATION_FEE} per applicant (each adult applies separately), plus a one-time ${ADMIN_FEE} administration fee per apartment — refunded in full if the application is denied. Security deposit: ${SECURITY_DEPOSIT}.`,
    },
    {
      Icon: IdCard,
      title: 'Documents',
      body: `Have a state or federal government-issued photo ID ready. Renters insurance with minimum liability-to-landlord coverage of ${RENTERS_INSURANCE_LLI_DISPLAY} is required before move-in.`,
    },
    {
      Icon: ShieldCheck,
      title: 'Screening',
      body: `Every adult on the lease is screened individually (credit and background). A minimum credit score of ${CREDIT_SCORE_MIN} is required, or ${CREDIT_SCORE_COSIGNER_MIN}+ with a qualified co-signer.`,
    },
    {
      Icon: Timer,
      title: 'Timeline',
      body: `Approval typically takes ${APPROVAL_WINDOW_DISPLAY}. Complete applications — all applicants submitted, documents in hand — review fastest.`,
    },
  ];
}

export function StartApplication() {
  const search = useSearch();
  const unit = new URLSearchParams(search).get('unit') ?? '';
  const { data: availability } = useAvailability();
  const unitInfo = availability?.units.find((u) => u.unit === unit);
  const isOnline = useOnlineStatus();

  const botGuard = useBotGuard();
  const createLead = useCreateLead();

  // The AppFolio hosted application for this exact residence (carries the
  // visit's source attribution — see applyUrlForListing). Units without a
  // posted listing fall back to the general application entry point.
  const applyUrl =
    (unitInfo?.listingUrl && applyUrlForListing(unitInfo.listingUrl)) || APPLY_URL;

  const [handingOff, setHandingOff] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);
  const forwardedRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ContactFormData>({ resolver: zodResolver(contactSchema) });

  useUnsavedChangesWarning(isDirty && !handingOff);

  /** Forward to AppFolio's hosted application — at most once. */
  const forward = () => {
    if (forwardedRef.current) return;
    forwardedRef.current = true;
    trackOutboundClick('apply', applyUrl, 'start_application', {
      floorPlan: unit || undefined,
    });
    window.location.assign(applyUrl);
  };

  const onSubmit = (data: ContactFormData) => {
    if (handingOff) return;
    setHandingOff(true);
    // Lead capture is best-effort: forward on success, on failure, AND on a
    // hung request (timeout). The application hand-off is never blocked.
    const timer = window.setTimeout(forward, HANDOFF_MAX_WAIT_MS);
    createLead.mutate(
      {
        ...botGuard.collect(),
        type: 'apply',
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        unit: unitInfo ? unit : undefined,
        message: unitInfo
          ? `Apartment: ${unit}\nStarted an application from the website; continuing to the secure online application.`
          : 'Started an application from the website; continuing to the secure online application.',
        smsConsent,
      },
      {
        onSuccess: () => trackLead('apply', { floorPlanPreference: unit || undefined }),
        onSettled: () => {
          window.clearTimeout(timer);
          forward();
        },
      },
    );
  };

  const rent = unitInfo ? formatRent(unitInfo.rent) : null;
  const group = unitInfo ? groupForUnit(unitInfo.unit) : null;
  const sqft = unitInfo ? resolveUnitSqft(unitInfo) : null;

  return (
    <>
      <Seo
        path="/start-application"
        // `?unit=` deep links get a distinct title so parameterized variants
        // aren't flagged as duplicates (canonical still points at the base
        // path, and the page is noindex regardless).
        title={unit ? `Apply for Apt ${unit} | Exhibit On Superior` : undefined}
        description={
          unit
            ? `Start your application for apartment ${unit} at Exhibit On Superior in River North, Chicago — what to have ready before the secure online application.`
            : undefined
        }
      />
      <div>
        <PageHero
          image="/images/image-087-012417-5548-ocwsdh.jpg"
          alt="Start Your Application | Exhibit On Superior in Chicago, Illinois"
          titleScript="Make It Home"
          title={unit ? `Apply for Apartment ${unit}` : 'Apply to Exhibit'}
          subtitle="Start Your Application"
        />

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-3xl">
            <h2 className="sr-only">Start your application</h2>

            {/* Unit context */}
            {unitInfo && (
              <div className="mb-8 flex flex-col gap-3 border border-border bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold uppercase tracking-wider">
                    Apartment {unit}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {[
                      bedBathLabel(unitInfo, group),
                      sqft !== null ? `${sqft.toLocaleString()} sq ft` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                {rent && <p className="text-lg font-semibold text-primary">{rent}</p>}
              </div>
            )}
            {!unitInfo && availability && unit && (
              <div className="mb-8 border border-border bg-muted p-6 text-center">
                <p className="mb-4">
                  Apartment {unit} is no longer listed — it may have just been rented. You can
                  still apply, or pick another open residence first.
                </p>
                <Link href="/available-units" className="btn-gold-outline inline-block">
                  View available apartments
                </Link>
              </div>
            )}

            {/* What to have ready — rendered from the shared fee/fact data */}
            <div className="mb-10 border border-border bg-muted p-8">
              <h2 className="mb-6 text-2xl uppercase tracking-wider">What to Have Ready</h2>
              <ul className="grid gap-6 sm:grid-cols-2">
                {applicationChecklist().map(({ Icon, title, body }) => (
                  <li key={title} className="flex gap-3">
                    <Icon className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <div>
                      <h3 className="mb-1 text-sm font-semibold uppercase tracking-wider">
                        {title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
                Full details on every cost are on the{' '}
                <Link href="/fees" className="underline hover:text-primary">
                  Fees &amp; Leasing Costs
                </Link>{' '}
                page, and the{' '}
                <Link href="/application-guide" className="underline hover:text-primary">
                  Application Guide
                </Link>{' '}
                walks through qualification step by step.
              </p>
            </div>

            {/* Contact + hand-off */}
            {handingOff ? (
              <div
                className="border border-border bg-muted p-12 text-center"
                role="status"
                aria-live="polite"
              >
                <h2 className="mb-4 text-3xl uppercase tracking-wider">You're On Your Way</h2>
                <p className="mb-8 text-lg leading-relaxed">
                  Taking you to the secure online application
                  {unitInfo ? ` for Apartment ${unit}` : ''} now — the rest (identity, fee
                  payment, screening) happens on our secure leasing system.
                </p>
                <a
                  href={applyUrl}
                  onClick={() =>
                    trackOutboundClick('apply', applyUrl, 'start_application_manual', {
                      floorPlan: unit || undefined,
                    })
                  }
                  className="btn-gold-outline inline-flex items-center gap-2"
                >
                  Continue to the application
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
              </div>
            ) : (
              <div className="border border-border bg-muted p-8">
                <h2 className="mb-2 text-2xl uppercase tracking-wider">Tell Us About You</h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  So our leasing team can help if you have questions mid-application — then
                  you'll continue straight to the secure online application.
                </p>
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  {...botGuard.formProps}
                  className="space-y-6"
                  noValidate
                >
                  <HoneypotField inputRef={botGuard.honeypotRef} />
                  <div className="grid grid-cols-2 gap-4">
                    {(
                      [
                        ['firstName', 'First Name', 'text', 'given-name'],
                        ['lastName', 'Last Name', 'text', 'family-name'],
                      ] as const
                    ).map(([name, label, type, autoComplete]) => (
                      <div key={name}>
                        <label
                          htmlFor={name}
                          className="mb-2 block text-sm uppercase tracking-wider"
                        >
                          {label} *
                        </label>
                        <input
                          type={type}
                          id={name}
                          autoComplete={autoComplete}
                          enterKeyHint="next"
                          {...register(name)}
                          aria-invalid={errors[name] ? true : undefined}
                          aria-describedby={errors[name] ? `${name}-error` : undefined}
                          className={inputClass}
                        />
                        {errors[name] && (
                          <p
                            id={`${name}-error`}
                            role="alert"
                            className="mt-1 text-xs text-destructive"
                          >
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
                      autoComplete="email"
                      enterKeyHint="next"
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
                      autoComplete="tel"
                      enterKeyHint="next"
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

                  {/* SMS opt-in consent checkbox (A2P/carrier compliance) */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="smsConsent"
                      checked={smsConsent}
                      onChange={(e) => setSmsConsent(e.target.checked)}
                      className="mt-0.5 h-4 w-4 flex-shrink-0 border-border accent-primary"
                    />
                    <label htmlFor="smsConsent" className="text-xs leading-relaxed text-muted-foreground">
                      By checking this box, you consent to receive SMS messages from Exhibit On Superior
                      regarding service updates and customer support. Message frequency may vary. Message
                      and data rates may apply. Reply STOP to opt out at any time or HELP for assistance.
                      Consent is not a condition of service.{' '}
                      <Link href="/privacy-policy#sms-terms" aria-label="Privacy Policy — SMS Terms & Conditions" className="underline hover:text-primary">
                        Privacy Policy
                      </Link>
                      .
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={!isOnline}
                    className="btn-gold-outline w-full border-primary bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                  >
                    Continue to the Secure Application
                  </button>

                  {/* Consent / privacy language mirroring the AppFolio hosted
                      forms this flow hands off to. */}
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    By continuing, I agree to receive communication related to my interest in
                    available properties or unit(s). By including my phone number, I agree to
                    receive calls and text messages. Message frequency varies. I can opt out at
                    any time by replying STOP or text HELP for help. Standard message and data
                    rates may apply. The application is provided through AppFolio; all
                    information provided will be treated in accordance with the{' '}
                    <a
                      href="https://www.appfolio.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="AppFolio Privacy Policy"
                      className="underline hover:text-primary"
                    >
                      AppFolio Privacy Policy
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
            )}
          </div>
        </section>
      </div>
    </>
  );
}
