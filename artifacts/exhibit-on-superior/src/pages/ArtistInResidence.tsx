import { PageHero } from '../components/PageHero';
import { Brush, CalendarHeart, Home, Music } from 'lucide-react';
import { Seo } from '../components/Seo';
import { QuickAnswer } from '../components/QuickAnswer';
import { FaqSection } from '../components/FaqSection';
import { Link } from 'wouter';

export function ArtistInResidence() {
  return (
    <>
      <Seo path="/artist-in-residence" />
      <div>
        <PageHero
          image="/images/image-083-dsc00806-yr6rhk.jpg"
          alt="Artist-in-Residence | Exhibit On Superior in Chicago, Illinois"
          title="Artist-in-Residence Program: A Home Where Art and Music Thrive"
          subtitle="Artist-in-Residence"
        />

        <QuickAnswer path="/artist-in-residence" />

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="section-title mb-6">Where Creativity Lives</h2>
            <div className="prose prose-lg max-w-none text-left mb-8">
              <p className="mb-6">
                Since 2017, Highland Management LLC has proudly hosted an innovative Artist-in-Residence program, where creativity meets community. As part of our ongoing commitment to enriching the living experience, as well as supporting local artists from musicians and muralist we can offer exclusive events and experiences to both the artist and our residents.
              </p>
              <p>
                It&rsquo;s a natural fit for the neighborhood, too. River North is home to one of Chicago&rsquo;s best-known gallery districts, and Exhibit&rsquo;s name is a nod to that creative energy. The program brings that spirit inside the building — onto its walls, into its lounges, and into the community calendar.
              </p>
            </div>
          </div>
        </section>

        {/* How the program works */}
        <section className="py-16 px-4 bg-muted">
          <div className="container mx-auto max-w-5xl">
            <h3 className="text-3xl uppercase tracking-wider mb-10 text-center">How The Program Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 border border-border text-center">
                <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  <Home className="w-6 h-6" />
                </div>
                <h4 className="text-lg uppercase tracking-wider mb-3">Rent-Free Residency</h4>
                <p className="text-sm leading-relaxed">
                  Winning artists — a resident musician and a resident visual artist — live at Exhibit rent-free in exchange for sharing their talents with the community.
                </p>
              </div>
              <div className="bg-white p-8 border border-border text-center">
                <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  <CalendarHeart className="w-6 h-6" />
                </div>
                <h4 className="text-lg uppercase tracking-wider mb-3">Events & Classes</h4>
                <p className="text-sm leading-relaxed">
                  From intimate live performances to hands-on art classes and monthly sip-and-paint sessions, the artists turn the building&rsquo;s amenity spaces into venues.
                </p>
              </div>
              <div className="bg-white p-8 border border-border text-center">
                <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  <Brush className="w-6 h-6" />
                </div>
                <h4 className="text-lg uppercase tracking-wider mb-3">Art In The Building</h4>
                <p className="text-sm leading-relaxed">
                  Murals and original artwork appear throughout the property and Highland communities, so the program shapes the spaces residents move through every day.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Meet the artists */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <h3 className="text-3xl uppercase tracking-wider mb-10 text-center">Meet The Resident Artists</h3>
            <div className="space-y-10">
              <div className="bg-muted p-8 border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <Music className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg uppercase tracking-wider">Trevor Tisdale — Musician In Residence</h4>
                </div>
                <p className="leading-relaxed">
                  Trevor Tisdale is a self-taught musician who found his voice harmonizing with the bands and artists that filled his childhood home. You can hear the influence of Funk, Soul, Pop, Blues and Rock &lsquo;n&rsquo; Roll in all of Trevor&rsquo;s live performances. Trevor&rsquo;s skill on guitar has evolved into a dynamic extension of his voice. He spends most of his time now honing more intermediate and advanced techniques for live performing and writing and recording music in his free time.
                </p>
              </div>
              <div className="bg-muted p-8 border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <Brush className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg uppercase tracking-wider">Asend — Visual Artist In Residence</h4>
                </div>
                <p className="leading-relaxed">
                  Blending street art with fine art, Asend is a boundary-pushing street artist whose vibrant murals and live painting sessions transform blank walls into stories. His art sparks dialogue and colorfully reflects the energy of our community. Look for monthly sip and paints at Exhibit as well as artwork throughout the property and communities.
                </p>
              </div>
            </div>
            <p className="text-lg leading-relaxed text-center mt-10">
              Together, these artists not only shape our physical spaces but also foster a dynamic culture of creativity and connection.
            </p>
          </div>
        </section>

        <section className="py-16 px-4 bg-muted">
          <div className="container mx-auto max-w-5xl">
            <h3 className="text-3xl uppercase tracking-wider mb-8 text-center">Watch: Musician In Residence</h3>
            <div className="aspect-video bg-black border border-border">
              <iframe
                src="https://player.vimeo.com/video/358844745?rel=0"
                className="w-full h-full"
                allowFullScreen
                title="Musician in Residence"
              />
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-dark-section">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="section-title text-white mb-6">Live Where Art And Music Thrive</h2>
            <p className="text-lg leading-relaxed mb-8 text-white">
              Want to experience the program in person? Schedule a tour and see the artwork, amenity spaces, and River North location for yourself.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/schedule-a-tour" className="btn-gold-outline inline-block">
                Schedule a Tour
              </Link>
              <Link href="/neighborhood" className="btn-gold-outline bg-primary text-white border-primary hover:bg-primary/90 inline-block">
                Explore River North
              </Link>
            </div>
          </div>
        </section>
      </div>
        <FaqSection path="/artist-in-residence" />
    </>
  );
}
