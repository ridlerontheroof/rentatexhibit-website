import { PageHero } from '../components/PageHero';
import { Helmet } from 'react-helmet-async';

export function ArtistInResidence() {
  return (
    <>
      <Helmet>
        <title>Artist-in-Residence Program | Exhibit On Superior</title>
        <meta name="description" content="Learn about the Artist-in-Residence program at Exhibit On Superior and how the community connects residents with local art and music experiences." />
      </Helmet>
      <div>
        <PageHero
          image="/images/image-083-dsc00806-yr6rhk.jpg"
          alt="Artist-in-Residence | Exhibit On Superior in Chicago, Illinois"
          title="Artist-in-Residence Program: A Home Where Art and Music Thrive"
          subtitle="Artist-in-Residence"
        />

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="section-title mb-6">Where Creativity Lives</h2>
            <div className="prose prose-lg max-w-none text-left mb-8">
              <p className="mb-6">
                Since 2017, Highland Management LLC has proudly hosted an innovative Artist-in-Residence program, where creativity meets community. As part of our ongoing commitment to enriching the living experience, as well as supporting local artists from musicians and muralist we can offer exclusive events and experiences to both the artist and our residents.
              </p>
              <p className="mb-6">
                As winners of our Artist-in-Residence program, our resident musician and visual artist live rent-free in exchange for sharing their talents with the community. From intimate live performances to hands-on art classes, they help make this more than just a place to live—it’s a place to connect and create.
              </p>
              <p className="mb-6">
                Currently, we are home to two extraordinary resident artists: 🎵 Trevor Tisdale, self-taught musician who found his voice harmonizing with the bands and artists that filled his childhood home. You can hear the influence of Funk, Soul, Pop, Blues and Rock ‘n’ Roll in all of Trevor’s live performances. Trevor’s skill on guitar has evolved into a dynamic extension of his voice. He spends most of his time now honing more intermediate and advanced techniques for live performing and writing and recording music in his free time.
              </p>
              <p className="mb-6">
                🎨 Blending Street art with fine art, Asend, a boundary-pushing street artist whose vibrant murals and live painting sessions transform blank walls into stories. His art sparks dialogue and colorfully reflects the energy of our community. Look for monthly sip and paints at Exhibit as well as artwork throughout the property and communities.
              </p>
              <p>
                Together, these artists not only shape our physical spaces but also foster a dynamic culture of creativity and connection.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-muted">
          <div className="container mx-auto max-w-5xl">
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
      </div>
    </>
  );
}
