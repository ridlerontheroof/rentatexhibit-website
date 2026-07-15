import { PageHero } from '../components/PageHero';
import { Helmet } from 'react-helmet-async';

export function Residents() {
  return (
    <>
      <Helmet>
        <title>Resident Resources | Exhibit On Superior</title>
        <meta name="description" content="Resident resource page for Exhibit On Superior. Replace prior resident portal links with the current AppFolio resident portal once confirmed." />
      </Helmet>
      <div>
        <PageHero
          image="/images/image-086-work-spaces-with-blazing-fast-wifi-access-d3tr2q.jpg"
          alt="Residents | Exhibit On Superior in Chicago, Illinois"
          title="Resident Life Made Simple"
          subtitle="Residents"
        />

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <p className="text-lg leading-relaxed mb-8">
              Need to pay rent, submit maintenance requests, or check community updates? You’re in the right place. Log in to your portal and manage it all with ease.
            </p>
            <a href="https://highlandrealestatepartners.appfolio.com/connect/" target="_blank" rel="noopener noreferrer" className="btn-gold-outline bg-primary text-white border-primary hover:bg-primary/90 inline-block">
              Resident Login
            </a>
          </div>
        </section>

        <section className="py-16 px-4 bg-dark-section">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="section-title text-white mb-6">Need Help?</h2>
            <p className="text-lg leading-relaxed mb-8 text-white">
              Our team is available to assist with any questions or technical issues with the resident portal.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:312-450-0635" className="btn-gold-outline inline-block">
                312-450-0635
              </a>
              <a href="mailto:exhibit@highlandptrs.com" className="btn-gold-outline bg-primary text-white border-primary hover:bg-primary/90 inline-block">
                Email Support
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
