import { useState } from 'react';
import { PageHero } from '../components/PageHero';
import { useCreateLead } from '../hooks/use-create-lead';
import { Phone, Mail, MapPin } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Seo } from '../components/Seo';
import { QuickAnswer } from '../components/QuickAnswer';
import { FaqSection } from '../components/FaqSection';

const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  message: z.string().min(10, 'Please provide a message'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactUs() {
  const [submitted, setSubmitted] = useState(false);
  const createLead = useCreateLead();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

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
          title="Get in touch"
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
                  <div className="bg-primary/10 text-primary p-4 mb-6 border border-primary">
                    Thank you! We've received your message and will respond shortly.
                  </div>
                )}

                {createLead.isError && (
                  <div className="bg-destructive/10 text-destructive p-4 mb-6 border border-destructive" role="alert">
                    Something went wrong and your message couldn't be sent. Please check your connection and try again.
                  </div>
                )}

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
                    <label htmlFor="message" className="block text-sm uppercase tracking-wider mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      {...register('message')}
                      rows={5}
                      className="w-full px-4 py-2 border border-border bg-white focus:outline-none focus:border-primary resize-none"
                    />
                    {errors.message && (
                      <p className="text-destructive text-xs mt-1">{errors.message.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={createLead.isPending}
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
