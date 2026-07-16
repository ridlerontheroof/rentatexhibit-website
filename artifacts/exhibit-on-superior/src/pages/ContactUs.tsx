import { useState } from 'react';
import { PageHero } from '../components/PageHero';
import { useCreateLead } from '../hooks/use-create-lead';
import { useUnsavedChangesWarning } from '../hooks/use-unsaved-changes';
import { useOnlineStatus } from '../hooks/use-online-status';
import { useBackOnlineNotice } from '../hooks/use-back-online-notice';
import { Phone, Mail, MapPin } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Seo } from '../components/Seo';
import { trackLead } from '../lib/analytics';
import { QuickAnswer } from '../components/QuickAnswer';
import { FaqSection } from '../components/FaqSection';

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
  message: z.string().min(10, 'Please provide a message'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactUs() {
  const [submitted, setSubmitted] = useState(false);
  const createLead = useCreateLead();
  const isOnline = useOnlineStatus();
  const showBackOnline = useBackOnlineNotice();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  useUnsavedChangesWarning(isDirty && !submitted && !createLead.isPending);

  const onSubmit = (data: ContactFormData) => {
    createLead.mutate(
      {
        type: 'contact',
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        message: data.message,
      },
      {
        onSuccess: () => {
          trackLead('contact');
          setSubmitted(true);
          reset();
          setTimeout(() => setSubmitted(false), 5000);
        },
      }
    );
  };

  return (
    <>
      <Seo path="/contact-us" />
      <div>
        <PageHero
          image="/images/image-084-20170601-0076-p0s5be.jpg"
          alt="Contact Us | Exhibit On Superior in Chicago, Illinois"
          titleScript="Get in Touch"
          title="With Exhibit On Superior"
          subtitle="Contact Us"
        />

        <QuickAnswer path="/contact-us" />

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Info */}
              <div>
                <h2 className="text-3xl uppercase tracking-wider mb-8">Contact Exhibit On Superior</h2>
                <p className="text-lg leading-relaxed mb-8">
                  Schedule a tour and explore the unmatched style, comfort, and convenience at Exhibit on Superior. Your future home awaits.
                </p>

                <div className="space-y-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg uppercase tracking-wider mb-1">Phone</h3>
                      <a href="tel:312-450-0635" className="text-primary hover:underline">
                        312-450-0635
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg uppercase tracking-wider mb-1">Email</h3>
                      <a href="mailto:exhibit@highlandptrs.com" className="text-primary hover:underline">
                        exhibit@highlandptrs.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg uppercase tracking-wider mb-1">Address</h3>
                      <p>
                        165 W Superior St<br />
                        Chicago, IL 60654
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-6 border border-border">
                  <h3 className="text-lg uppercase tracking-wider mb-2">Managed By</h3>
                  <p className="text-primary font-semibold">Highland Management LLC</p>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-muted p-8 border border-border">
                <h2 className="text-3xl uppercase tracking-wider mb-6">Send a Message</h2>

                {submitted && (
                  <div
                    className="bg-primary/10 text-primary p-4 mb-6 border border-primary"
                    role="status"
                    aria-live="polite"
                  >
                    Thank you! We've received your message and will respond shortly.
                  </div>
                )}

                {!isOnline && (
                  <div
                    className="bg-destructive/10 text-destructive p-4 mb-6 border border-destructive"
                    role="status"
                    aria-live="polite"
                  >
                    You appear to be offline. Please check your internet connection before sending your message.
                  </div>
                )}

                {showBackOnline && (
                  <div
                    className="bg-primary/10 text-primary p-4 mb-6 border border-primary"
                    role="status"
                    aria-live="polite"
                  >
                    You're back online. You can now send your message.
                  </div>
                )}

                {createLead.isError && (
                  <div className="bg-destructive/10 text-destructive p-4 mb-6 border border-destructive" role="alert">
                    Something went wrong and your message couldn't be sent. Please check your connection and try again.
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
                        className="w-full px-4 py-2 border border-border bg-white focus:outline-none focus:border-primary"
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
                        className="w-full px-4 py-2 border border-border bg-white focus:outline-none focus:border-primary"
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
                      className="w-full px-4 py-2 border border-border bg-white focus:outline-none focus:border-primary"
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
                      className="w-full px-4 py-2 border border-border bg-white focus:outline-none focus:border-primary"
                    />
                    {errors.phone && (
                      <p id="phone-error" role="alert" className="text-destructive text-xs mt-1">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm uppercase tracking-wider mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      {...register('message')}
                      rows={5}
                      aria-invalid={errors.message ? true : undefined}
                      aria-describedby={errors.message ? 'message-error' : undefined}
                      className="w-full px-4 py-2 border border-border bg-white focus:outline-none focus:border-primary resize-none"
                    />
                    {errors.message && (
                      <p id="message-error" role="alert" className="text-destructive text-xs mt-1">
                        {errors.message.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={createLead.isPending || !isOnline}
                    className="btn-gold-outline bg-primary text-white border-primary hover:bg-primary/90 w-full disabled:opacity-50"
                  >
                    {createLead.isPending ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
        <FaqSection path="/contact-us" />
    </>
  );
}
