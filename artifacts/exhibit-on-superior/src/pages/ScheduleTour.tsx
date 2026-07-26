import { useEffect, useState } from 'react';
import { Link, useSearch } from 'wouter';
import { PageHero } from '../components/PageHero';
import { useAvailability } from '../hooks/use-availability';
import { useCreateLead } from '../hooks/use-create-lead';
import { useUnsavedChangesWarning } from '../hooks/use-unsaved-changes';
import { useOnlineStatus } from '../hooks/use-online-status';
import { useBackOnlineNotice } from '../hooks/use-back-online-notice';
import { Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Seo } from '../components/Seo';
import { trackLead } from '../lib/analytics';
import { tourUrlForListing } from '../components/floor-plans/UnitGalleryLightbox';
import { formatRent, groupForUnit } from '../components/floor-plans/AvailableUnits';
import { QuickAnswer } from '../components/QuickAnswer';
import { FaqSection } from '../components/FaqSection';

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

export function ScheduleTour() {
  const [submitted, setSubmitted] = useState(false);
  const createLead = useCreateLead();
  const isOnline = useOnlineStatus();
  const showBackOnline = useBackOnlineNotice();
  const { data: availability } = useAvailability();
  const search = useSearch();
  const requestedUnit = new URLSearchParams(search).get('unit') ?? '';
  const availableUnits = availability?.units ?? [];
  // Only trust a prefilled unit that's actually available right now.
  const defaultUnit = availableUnits.some((u) => u.unit === requestedUnit)
    ? requestedUnit
    : '';

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, dirtyFields },
    reset,
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

  useUnsavedChangesWarning(isDirty && !submitted && !createLead.isPending);

  const onSubmit = (data: TourFormData) => {
    if (createLead.isPending) return;
    const details = [
      data.unit ? `Apartment: ${data.unit}` : '',
      data.bedrooms ? `Floor plan preference: ${data.bedrooms}` : '',
      data.message ?? '',
    ]
      .filter(Boolean)
      .join('\n');
    createLead.mutate(
      {
        type: 'tour',
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        preferredDate: data.moveInDate,
        message: details || undefined,
        unit: data.unit || undefined,
      },
      {
        onSuccess: () => {
          trackLead('tour', { floorPlanPreference: data.bedrooms });
          setSubmitted(true);
          reset();
        },
      }
    );
  };

  return (
    <>
      <Seo path="/schedule-a-tour" />
      <div>
        <PageHero
          image="/images/image-087-012417-5548-ocwsdh.jpg"
          alt="Schedule a Tour | Exhibit On Superior in Chicago, Illinois"
          titleScript="Let Us Show You"
          title="Around"
          subtitle="Schedule a Tour"
        />

        <QuickAnswer path="/schedule-a-tour" />

        {/* Primary path: book a tour from a specific residence so the
            request lands in the leasing system attached to that unit. */}
        {availableUnits.length > 0 && (
          <section className="py-16 px-4 bg-muted">
            <div className="container mx-auto max-w-5xl">
              <h2 className="text-3xl uppercase tracking-wider mb-3 text-center">
                Pick the Residence You'd Like to See
              </h2>
              <p className="text-lg leading-relaxed mb-10 text-center max-w-2xl mx-auto">
                Choose an available apartment and book your tour right from its
                listing — the time you pick there goes straight onto our
                calendar, attached to that exact home.
              </p>
              <ul className="divide-y divide-border border border-border bg-white">
                {availableUnits.map((u) => {
                  const group = groupForUnit(u.unit);
                  const rent = formatRent(u.rent);
                  const tourUrl = u.listingUrl ? tourUrlForListing(u.listingUrl) : null;
                  return (
                    <li
                      key={u.unit}
                      className="flex flex-wrap items-center justify-between gap-4 p-5"
                    >
                      <div>
                        <p className="uppercase tracking-wider font-semibold">
                          Apartment {u.unit}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {[group?.typeLabel, rent].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/available-units/${u.unit}`}
                          aria-label={`View details for apartment ${u.unit}`}
                          className="border border-border px-4 py-2 text-xs uppercase tracking-wider transition-colors hover:border-primary hover:text-primary"
                        >
                          View details
                        </Link>
                        {tourUrl ? (
                          <Link
                            href={`/schedule-showing?unit=${u.unit}`}
                            aria-label={`Schedule a tour of apartment ${u.unit}`}
                            className="bg-primary px-4 py-2 text-xs uppercase tracking-wider text-white transition-opacity hover:opacity-90"
                          >
                            Schedule a tour
                          </Link>
                        ) : (
                          <a
                            href="#request-a-showing"
                            onClick={() => setValue('unit', u.unit)}
                            aria-label={`Schedule a tour of apartment ${u.unit}`}
                            className="bg-primary px-4 py-2 text-xs uppercase tracking-wider text-white transition-opacity hover:opacity-90"
                          >
                            Schedule a tour
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        )}

        <section id="request-a-showing" className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            {submitted ? (
              <div
                className="max-w-2xl mx-auto text-center bg-muted p-12 border border-border"
                role="status"
                aria-live="polite"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 text-primary mb-6">
                  <Calendar className="w-10 h-10" />
                </div>
                <h2 className="text-3xl uppercase tracking-wider mb-4">Tour Request Received!</h2>
                <p className="text-lg leading-relaxed mb-8">
                  Thank you for your interest in Exhibit on Superior. A member of our leasing team will contact you shortly to confirm your tour appointment.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="btn-gold-outline inline-block"
                >
                  Schedule Another Tour
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Left Column - Info */}
                <div>
                  <p className="text-lg leading-relaxed mb-8">
                    Don't see the right fit above, or not sure which residence
                    you want to see yet? Tell us what you're looking for and a
                    member of our leasing team will arrange a showing with you
                    directly.
                  </p>

                  <div className="bg-dark-section text-white p-6 mb-8">
                    <h3 className="text-lg uppercase tracking-wider mb-3">Leasing Office</h3>
                    <p className="mb-2">165 W Superior St Chicago, IL 60654</p>
                    <p className="mb-4">
                      <a href="tel:312-450-0635" className="text-primary hover:underline">
                        312-450-0635
                      </a>
                    </p>
                    <div className="flex w-fit flex-col gap-4">
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

                {/* Right Column - Form */}
                <div className="bg-muted p-8 border border-border">
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
                      className="bg-primary/10 text-primary p-4 mb-6 border border-primary"
                      role="status"
                      aria-live="polite"
                    >
                      You're back online. You can now request your tour.
                    </div>
                  )}

                  {createLead.isError && (
                    <div className="bg-destructive/10 text-destructive p-4 mb-6 border border-destructive" role="alert">
                      Something went wrong and your tour request couldn't be sent. Please check your connection and try again.
                    </div>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm uppercase tracking-wider mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          id="firstName"
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

                    <div>
                      <label htmlFor="email" className="block text-sm uppercase tracking-wider mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
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
                      disabled={createLead.isPending || !isOnline}
                      className="btn-gold-outline bg-primary text-white border-primary hover:bg-primary/90 w-full disabled:opacity-50"
                    >
                      {createLead.isPending ? 'Submitting...' : 'Request Tour'}
                    </button>
                  </form>
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
