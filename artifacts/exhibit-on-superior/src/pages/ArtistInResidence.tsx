import { PageHero } from '../components/PageHero';
import { Palette, Music, Camera, Pen } from 'lucide-react';

export function ArtistInResidence() {
  return (
    <div>
      <PageHero
        image="/images/assets/images/image-083-dsc00806-yr6rhk.jpg"
        alt="Artist-in-Residence | Exhibit On Superior in Chicago, Illinois"
        title="Artist-in-Residence"
        subtitle="Where Creativity Comes Home"
      />

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <span className="eyebrow">Creative Community</span>
          <h2 className="section-title mb-6">A Living Gallery</h2>
          <p className="text-lg leading-relaxed">
            True to River North's artistic heritage, Exhibit on Superior celebrates creativity through our Artist-in-Residence program. We provide space, resources, and community for artists to create, collaborate, and share their work with residents.
          </p>
        </div>
      </section>

      <section className="py-12 px-4 bg-muted">
        <div className="container mx-auto max-w-5xl">
          <h3 className="text-3xl uppercase tracking-wider mb-12 text-center">What We Offer</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 border border-border">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 text-primary mb-4">
                <Palette className="w-7 h-7" />
              </div>
              <h4 className="text-2xl uppercase tracking-wider mb-4">Studio Space</h4>
              <p className="text-sm leading-relaxed">
                Dedicated creative studio space within the building where artists can work on their craft. Natural lighting, flexible layouts, and all the room needed to bring visions to life.
              </p>
            </div>

            <div className="bg-white p-8 border border-border">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 text-primary mb-4">
                <Music className="w-7 h-7" />
              </div>
              <h4 className="text-2xl uppercase tracking-wider mb-4">Music Studio</h4>
              <p className="text-sm leading-relaxed">
                Soundproof music studio with recording capabilities. Perfect for musicians, producers, and audio artists to practice, record, and experiment.
              </p>
            </div>

            <div className="bg-white p-8 border border-border">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 text-primary mb-4">
                <Camera className="w-7 h-7" />
              </div>
              <h4 className="text-2xl uppercase tracking-wider mb-4">Exhibition Opportunities</h4>
              <p className="text-sm leading-relaxed">
                Rotating art exhibitions in common spaces throughout the building. Artists-in-residence have the opportunity to showcase their work and connect with the community.
              </p>
            </div>

            <div className="bg-white p-8 border border-border">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 text-primary mb-4">
                <Pen className="w-7 h-7" />
              </div>
              <h4 className="text-2xl uppercase tracking-wider mb-4">Creative Events</h4>
              <p className="text-sm leading-relaxed">
                Workshops, open studios, artist talks, and collaborative events that bring residents together through shared appreciation for art and culture.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h3 className="text-3xl uppercase tracking-wider mb-8 text-center">Program Details</h3>
          <div className="prose prose-lg max-w-none">
            <p className="text-lg leading-relaxed mb-6">
              Our Artist-in-Residence program is open to visual artists, musicians, writers, performers, and creators of all disciplines. We seek artists who are passionate about their craft and eager to engage with the community.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              Selected artists receive access to studio space, reduced rent options, and promotional support. In exchange, artists contribute to the vibrant cultural life of Exhibit through exhibitions, performances, or workshops.
            </p>
            <p className="text-lg leading-relaxed">
              Applications are reviewed quarterly. Whether you're an emerging artist or established professional, we invite you to apply and become part of our creative community.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-dark-section">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="section-title text-white mb-6">Interested in Applying?</h2>
          <p className="text-lg leading-relaxed mb-8">
            Contact our leasing team to learn more about the Artist-in-Residence program and application requirements.
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
