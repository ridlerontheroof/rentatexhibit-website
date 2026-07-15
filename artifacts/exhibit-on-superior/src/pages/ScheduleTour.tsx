import { useState } from 'react';
import { PageHero } from '../components/PageHero';
import { useCreateLead } from '../hooks/use-create-lead';
import { Calendar, Clock, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const tourSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  moveInDate: z.string().min(1, 'Move-in date is required'),
  bedrooms: z.string().min(1, 'Please select floor plan preference'),
  message: z.string().optional(),
});

type TourFormData = z.infer<typeof tourSchema>;

export function ScheduleTour() {
  const [submitted, setSubmitted] = useState(false);
  const createLead = useCreateLead();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TourFormData>({
    resolver: zodResolver(tourSchema),
  });

  const onSubmit = (data: TourFormData) => {
    createLead.mutate(
      { ...data, source: 'schedule-tour' },
      {
        onSuccess: () => {
          setSubmitted(true);
          reset();
        },
      }
    );
  };

  return (
    <div>
      <PageHero
        image="/images/assets/images/image-087-012417-5548-ocwsdh.jpg"
        alt="Schedule a Tour | Exhibit On Superior in Chicago, Illinois"
        title="Schedule a Tour"
        subtitle="Experience Luxury Living in Person"
      />

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          {submitted ? (
            <div className="max-w-2xl mx-auto text-center bg-muted p-12 border border-border">
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
                <span className="eyebrow">Visit Us</span>
                <h2 className="text-3xl uppercase tracking-wider mb-6">Tour Exhibit On Superior</h2>
                <p className="text-lg leading-relaxed mb-8">
                  See for yourself why Exhibit on Superior is Chicago's premier luxury apartment community. Our team will give you a personal tour of our amenities, floor plans, and the vibrant River North neighborhood.
                </p>

                <div className="space-y-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg uppercase tracking-wider mb-1">Flexible Scheduling</h3>
                      <p className="text-sm">
                        Tours available 7 days a week. Choose a time that works best for your schedule.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg uppercase tracking-wider mb-1">Personal Attention</h3>
                      <p className="text-sm">
                        Get a guided tour with one of our leasing professionals who can answer all your questions.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg uppercase tracking-wider mb-1">Same-Day Tours</h3>
                      <p className="text-sm">
                        Need to see an apartment today? Call us at 312-450-0635 for immediate availability.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-dark-section text-white p-6">
                  <h3 className="text-lg uppercase tracking-wider mb-3">Leasing Office</h3>
                  <p className="mb-2">30 W. Superior St., Chicago, IL 60654</p>
                  <p className="text-sm mb-4">
                    Mon-Fri: 9 AM - 6 PM<br />
                    Sat: 10 AM - 5 PM<br />
                    Sun: 12 PM - 5 PM
                  </p>
                  <a href="tel:312-450-0635" className="text-primary hover:underline">
                    312-450-0635
                  </a>
                </div>
              </div>

              {/* Right Column - Form */}
              <div className="bg-muted p-8 border border-border">
                <h2 className="text-2xl uppercase tracking-wider mb-6">Request a Tour</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm uppercase tracking-wider mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        {...register('firstName')}
                        className="w-full px-4 py-2 border border-border bg-white focus:outline-none focus:border-primary"
                      />
                      {errors.firstName && (
                        <p className="text-destructive text-xs mt-1">{errors.firstName.message}</p>
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
                        className="w-full px-4 py-2 border border-border bg-white focus:outline-none focus:border-primary"
                      />
                      {errors.lastName && (
                        <p className="text-destructive text-xs mt-1">{errors.lastName.message}</p>
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
                      className="w-full px-4 py-2 border border-border bg-white focus:outline-none focus:border-primary"
                    />
                    {errors.email && (
                      <p className="text-destructive text-xs mt-1">{errors.email.message}</p>
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
                      className="w-full px-4 py-2 border border-border bg-white focus:outline-none focus:border-primary"
                    />
                    {errors.phone && (
                      <p className="text-destructive text-xs mt-1">{errors.phone.message}</p>
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
                      className="w-full px-4 py-2 border border-border bg-white focus:outline-none focus:border-primary"
                    />
                    {errors.moveInDate && (
                      <p className="text-destructive text-xs mt-1">{errors.moveInDate.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="bedrooms" className="block text-sm uppercase tracking-wider mb-2">
                      Floor Plan Preference *
                    </label>
                    <select
                      id="bedrooms"
                      {...register('bedrooms')}
                      className="w-full px-4 py-2 border border-border bg-white focus:outline-none focus:border-primary"
                    >
                      <option value="">Select...</option>
                      <option value="Studio">Studio</option>
                      <option value="1 Bedroom">1 Bedroom</option>
                      <option value="2 Bedrooms">2 Bedrooms</option>
                      <option value="Any">Any / Not Sure</option>
                    </select>
                    {errors.bedrooms && (
                      <p className="text-destructive text-xs mt-1">{errors.bedrooms.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm uppercase tracking-wider mb-2">
                      Additional Comments
                    </label>
                    <textarea
                      id="message"
                      {...register('message')}
                      rows={3}
                      placeholder="Preferred tour times, questions, etc."
                      className="w-full px-4 py-2 border border-border bg-white focus:outline-none focus:border-primary resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={createLead.isPending}
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
  );
}
