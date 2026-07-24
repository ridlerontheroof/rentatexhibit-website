import { PageHero } from '../components/PageHero';
import { SmartImg } from '../components/SmartImg';
import { Heart, Home, MapPin, PawPrint } from 'lucide-react';
import { Seo } from '../components/Seo';
import { QuickAnswer } from '../components/QuickAnswer';
import { FaqSection } from '../components/FaqSection';
import { Link } from 'wouter';
import { SplitHeadline } from '../components/SplitHeadline';

export function PetFriendly() {
  return (
    <>
      <Seo path="/pet-friendly" />
      <div>
        <PageHero
          image="/images/image-079-gettyimages-1440280890-ox4ske.jpg"
          alt="Pet Friendly | Exhibit On Superior in Chicago, Illinois"
          titleScript="Dogs & Cats"
          title="Say Hello to Pet-Friendly Living In Chicago"
          subtitle="Pet Friendly"
        />

        <QuickAnswer path="/pet-friendly" />

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <p className="text-lg leading-relaxed">
              Finally, a pet-friendly community in Chicago, Illinois, that you love. This is not only the perfect place for you, but for your pets, too. From an ultra-walkable neighborhood location to a spacious home and so much more, you and your furry friends will love everything about our pet-friendly perks.
            </p>
          </div>
        </section>

        <section className="py-12 px-4 bg-muted">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <SmartImg
                src="/images/image-080-gettyimages-1386939001-lrrzhc.jpg"
                alt="Happy dog on a walk outside at Exhibit On Superior in Chicago, Illinois"
                sizes="(min-width: 768px) 50vw, 100vw"
                className="w-full h-[500px] object-cover"
              />
              <div>
                <h2 className="text-3xl uppercase tracking-wider mb-6">Pet Amenities & Services</h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center">
                        <PawPrint className="w-6 h-6" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg uppercase tracking-wider mb-2">Pet Spa Station</h3>
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
                      <h3 className="text-lg uppercase tracking-wider mb-2">Nearby Parks</h3>
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
                      <h3 className="text-lg uppercase tracking-wider mb-2">Pet-Friendly Design</h3>
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
                      <h3 className="text-lg uppercase tracking-wider mb-2">Pet Community</h3>
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

        {/* On-site pet amenities detail */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl uppercase tracking-wider mb-8 text-center">Built For Life With Pets</h2>
            <p className="text-lg leading-relaxed text-center mb-8">
              Pet-friendly here means more than "pets allowed." The building&rsquo;s community amenities include a dedicated doggie spa and lounge for bath and grooming days, plus a gated outdoor dog walk so quick trips outside don&rsquo;t require a walk around the block. Inside your apartment, driftwood plank floors throughout stand up to paws and claws far better than carpet — and they clean up in seconds after muddy-day walks.
            </p>
            <p className="text-lg leading-relaxed text-center">
              The location does the rest. River North is an ultra-walkable neighborhood, with side streets for daily loops and the Chicago River and lakefront within easy reach for longer outings. Your dog&rsquo;s daily routine gets real variety without ever needing the car.
            </p>
          </div>
        </section>

        <section className="py-16 px-4 bg-muted">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl uppercase tracking-wider mb-8 text-center">Pet Policy</h2>
            <div className="bg-white p-8 border border-border">
              <p className="text-lg leading-relaxed text-center mb-6">
                Exhibit is a pet-friendly community! Acknowledgement of Dog Rider and compliance of pet policy is required prior to application approval. 2 pets maximum.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1 flex-shrink-0">•</span>
                  <span>Dogs and cats are welcome</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1 flex-shrink-0">•</span>
                  <span>Maximum of 2 pets per apartment</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1 flex-shrink-0">•</span>
                  <span>All pets must be registered with management</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1 flex-shrink-0">•</span>
                  <span>Dog owners must acknowledge the Dog Rider and comply with the pet policy before application approval</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1 flex-shrink-0">•</span>
                  <span>One-time non-refundable pet fee: $650 for one dog or $750 for two (two-dog maximum); $325 for cats (two-cat maximum)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1 flex-shrink-0">•</span>
                  <span>No refundable pet deposit and no monthly pet rent</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary mt-1 flex-shrink-0">•</span>
                  <span>No weight limits &mdash; breed restrictions apply, please see a leasing consultant for details</span>
                </li>
              </ul>
              <p className="mt-6 text-sm text-muted-foreground text-center">
                Have questions about our pet policy? Contact our friendly leasing team in Chicago today.
                Reviewing all leasing costs? See{' '}
                <Link href="/fees" className="text-primary underline">Fees &amp; Leasing Costs</Link>.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-dark-section">
          <div className="container mx-auto max-w-3xl text-center">
            <SplitHeadline script="Embrace Unbounded City Living" caps="At Exhibit On Superior" dark className="mb-6" />
            <Link href="/contact-us" className="btn-gold-outline inline-block">
              Contact Us
            </Link>
          </div>
        </section>
      </div>
        <FaqSection path="/pet-friendly" />
    </>
  );
}
