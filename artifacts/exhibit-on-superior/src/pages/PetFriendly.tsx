import { PageHero } from '../components/PageHero';
import { Heart, Home, MapPin, PawPrint } from 'lucide-react';

export function PetFriendly() {
  return (
    <div>
      <PageHero
        image="/images/assets/images/image-079-gettyimages-1440280890-ox4ske.jpg"
        alt="Pet Friendly | Exhibit On Superior in Chicago, Illinois"
        title="Pet Friendly"
        subtitle="Your Furry Friends Are Welcome Here"
      />

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <span className="eyebrow">Pet-Friendly Living</span>
          <h2 className="section-title mb-6">A Home for the Whole Family</h2>
          <p className="text-lg leading-relaxed">
            At Exhibit on Superior, we understand that pets are family. Our pet-friendly community welcomes dogs and cats with open arms, offering amenities and services designed to make life comfortable for both you and your four-legged companions.
          </p>
        </div>
      </section>

      <section className="py-12 px-4 bg-muted">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <img
              src="/images/assets/images/image-080-gettyimages-1386939001-lrrzhc.jpg"
              alt="Happy dog on a walk outside at Exhibit On Superior in Chicago, Illinois"
              className="w-full h-[500px] object-cover"
            />
            <div>
              <h3 className="text-3xl uppercase tracking-wider mb-6">Pet Amenities & Services</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center">
                      <PawPrint className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg uppercase tracking-wider mb-2">Pet Spa Station</h4>
                    <p className="text-sm">
                      On-site pet spa with grooming station, wash tubs, and drying area to keep your pets clean and fresh.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center">
                      <MapPin className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg uppercase tracking-wider mb-2">Nearby Parks</h4>
                    <p className="text-sm">
                      Steps from River North dog parks and walking trails, including Ohio Street Beach dog-friendly area.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center">
                      <Home className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg uppercase tracking-wider mb-2">Pet-Friendly Design</h4>
                    <p className="text-sm">
                      Spacious floor plans with designer plank flooring that's easy to clean and durable for active pets.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center">
                      <Heart className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg uppercase tracking-wider mb-2">Pet Community</h4>
                    <p className="text-sm">
                      Join a vibrant community of pet lovers with regular pet-friendly resident events and social gatherings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h3 className="text-3xl uppercase tracking-wider mb-8 text-center">Pet Policy</h3>
          <div className="bg-muted p-8 border border-border">
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1 flex-shrink-0">•</span>
                <span>Dogs and cats are welcome with no breed restrictions</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1 flex-shrink-0">•</span>
                <span>Maximum of 2 pets per apartment</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1 flex-shrink-0">•</span>
                <span>Pet deposit: $300 per pet (refundable)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1 flex-shrink-0">•</span>
                <span>Monthly pet rent: $50 per pet</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1 flex-shrink-0">•</span>
                <span>All pets must be registered with management and provide proof of vaccinations</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1 flex-shrink-0">•</span>
                <span>Pets must be leashed in all common areas</span>
              </li>
            </ul>
            <p className="mt-6 text-sm text-muted-foreground">
              Pet policies are subject to change. Please contact our leasing office for the most current information and any questions about specific breeds or circumstances.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-dark-section">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="section-title text-white mb-6">Questions About Our Pet Policy?</h2>
          <p className="text-lg leading-relaxed mb-8">
            Our leasing team is happy to answer any questions about bringing your pet to Exhibit on Superior.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:312-450-0635" className="btn-gold-outline inline-block">
              Call: 312-450-0635
            </a>
            <a href="/contact" className="btn-gold-outline bg-primary text-white border-primary hover:bg-primary/90 inline-block">
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
