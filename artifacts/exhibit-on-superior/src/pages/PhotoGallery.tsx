import { useState } from 'react';
import { PageHero } from '../components/PageHero';
import { X } from 'lucide-react';

const galleryImages = [
  { src: '/images/assets/images/image-033-lounge-mfioa0.jpg', alt: 'Photo Gallery | Exhibit On Superior in Chicago, Illinois', category: 'Lobby' },
  { src: '/images/assets/images/image-034-012417-5663-hxwee6.jpg', alt: 'Kitchen and dining table at Exhibit On Superior in Chicago, Illinois', category: 'Apartments' },
  { src: '/images/assets/images/image-035-012417-5680-yegi2f.jpg', alt: 'Kitchen with upscale appliances at Exhibit On Superior in Chicago, Illinois', category: 'Apartments' },
  { src: '/images/assets/images/image-036-012417-5793-ebbynh.jpg', alt: 'Quartz countertops at Exhibit On Superior in Chicago, Illinois', category: 'Apartments' },
  { src: '/images/assets/images/image-037-012417-5630-zsx9za.jpg', alt: 'High quality range at Exhibit On Superior in Chicago, Illinois', category: 'Apartments' },
  { src: '/images/assets/images/image-038-012417-6039-adwhss.jpg', alt: 'Kitchen with stainless-steel appliances', category: 'Apartments' },
  { src: '/images/assets/images/image-039-012417-5797-pnyuww.jpg', alt: 'Close up of the stainless-steel sink at Exhibit On Superior in Chicago, Illinois', category: 'Apartments' },
  { src: '/images/assets/images/image-040-012417-5616b-x84gwq.jpg', alt: 'Kitchen table at Exhibit On Superior in Chicago, Illinois', category: 'Apartments' },
  { src: '/images/assets/images/image-041-012417-5607-piqxtr.jpg', alt: 'Living room with accent wall at Exhibit On Superior in Chicago, Illinois', category: 'Apartments' },
  { src: '/images/assets/images/image-042-012417-5548-cyorgo.jpg', alt: 'Large window in the living room and couch at Exhibit On Superior in Chicago, Illinois', category: 'Apartments' },
  { src: '/images/assets/images/image-043-012417-5563-oriwf6.jpg', alt: 'Bedroom with blue accent wall at Exhibit On Superior in Chicago, Illinois', category: 'Apartments' },
  { src: '/images/assets/images/image-044-012417-5578-ttpmgd.jpg', alt: 'Bedroom at Exhibit On Superior in Chicago, Illinois', category: 'Apartments' },
  { src: '/images/assets/images/image-045-012417-5719-d9ekn6.jpg', alt: 'Second bedroom with large windows at Exhibit On Superior in Chicago, Illinois', category: 'Apartments' },
  { src: '/images/assets/images/image-046-012417-5990-n11px5.jpg', alt: 'Couch and accent wall at Exhibit On Superior in Chicago, Illinois', category: 'Apartments' },
  { src: '/images/assets/images/image-047-012417-6106-pktrcl.jpg', alt: 'Room with large windows at Exhibit On Superior in Chicago, Illinois', category: 'Apartments' },
  { src: '/images/assets/images/image-048-012417-5784-mqhldb.jpg', alt: 'Comfy bed at Exhibit On Superior in Chicago, Illinois', category: 'Apartments' },
  { src: '/images/assets/images/image-049-012417-5711-tfyt08.jpg', alt: 'Extra bedroom with large closet at Exhibit On Superior in Chicago, Illinois', category: 'Apartments' },
  { src: '/images/assets/images/image-050-012417-5857-ihelta.jpg', alt: 'Bed and closet at Exhibit On Superior in Chicago, Illinois', category: 'Apartments' },
  { src: '/images/assets/images/image-051-012417-5582-dbyi1b.jpg', alt: 'Stacked washer and dryer at Exhibit On Superior in Chicago, Illinois', category: 'Apartments' },
  { src: '/images/assets/images/image-052-012417-5599-xirys3.jpg', alt: 'Bathroom at Exhibit On Superior in Chicago, Illinois', category: 'Apartments' },
  { src: '/images/assets/images/image-053-012417-5817-fvbupj.jpg', alt: 'Bathroom with dark cabinetry at Exhibit On Superior in Chicago, Illinois', category: 'Apartments' },
  { src: '/images/assets/images/image-054-20170808-0677-qicu1y.jpg', alt: 'Outdoor lap pool at Exhibit On Superior in Chicago, Illinois', category: 'Amenities' },
  { src: '/images/assets/images/image-055-dji-20230620092832-0149-d-yrh5eg.jpg', alt: 'Pool and deck from above at Exhibit On Superior in Chicago, Illinois', category: 'Amenities' },
  { src: '/images/assets/images/image-056-20170808-0721-c60hfw.jpg', alt: 'Lounge area by the pool at Exhibit On Superior in Chicago, Illinois', category: 'Amenities' },
  { src: '/images/assets/images/image-057-dji-20230620092900-0153-d-oaedvz.jpg', alt: 'Pool and high-rise building at Exhibit On Superior in Chicago, Illinois', category: 'Amenities' },
  { src: '/images/assets/images/image-058-20170808-0843-ymrdpp.jpg', alt: 'Firepit seating on the deck at Exhibit On Superior in Chicago, Illinois', category: 'Amenities' },
  { src: '/images/assets/images/image-059-20170808-0852-sw1ncm.jpg', alt: 'Large rooftop amenity deck at Exhibit On Superior in Chicago, Illinois', category: 'Amenities' },
  { src: '/images/assets/images/image-060-bt7b3585b-ykt6yu.jpg', alt: 'Games on the lawn at Exhibit On Superior in Chicago, Illinois', category: 'Amenities' },
  { src: '/images/assets/images/image-061-012417-6396-e1vomm.jpg', alt: 'Fitness center at Exhibit On Superior in Chicago, Illinois', category: 'Amenities' },
  { src: '/images/assets/images/image-062-012417-6604-a7yglt.jpg', alt: 'Stationary bikes at Exhibit On Superior in Chicago, Illinois', category: 'Amenities' },
  { src: '/images/assets/images/image-063-012417-6437-nx2ske.jpg', alt: 'Meeting table in the lounge at Exhibit On Superior in Chicago, Illinois', category: 'Amenities' },
  { src: '/images/assets/images/image-064-012417-6469-s4tipl.jpg', alt: 'Resident lounge with fireplace at Exhibit On Superior in Chicago, Illinois', category: 'Amenities' },
  { src: '/images/assets/images/image-065-012417-6521-i8yuom.jpg', alt: 'Spacious resident lounge at Exhibit On Superior in Chicago, Illinois', category: 'Amenities' },
  { src: '/images/assets/images/image-066-game-area-with-arcade-games-and-wall-scrabble-oz.jpg', alt: 'Chess board in the lounge at Exhibit On Superior in Chicago, Illinois', category: 'Amenities' },
  { src: '/images/assets/images/image-067-tech-lounge-with-charging-station-and-kitchen-gh.jpg', alt: 'Large meeting table at Exhibit On Superior in Chicago, Illinois', category: 'Amenities' },
  { src: '/images/assets/images/image-068-dsc00897-gc3ypb.jpg', alt: 'Music studio room at Exhibit On Superior in Chicago, Illinois', category: 'Amenities' },
  { src: '/images/assets/images/image-069-012417-6379-oiufjz.jpg', alt: 'Sauna at Exhibit On Superior in Chicago, Illinois', category: 'Amenities' },
  { src: '/images/assets/images/image-070-012417-6535-gpdv36.jpg', alt: 'Front desk at Exhibit On Superior in Chicago, Illinois', category: 'Building' },
  { src: '/images/assets/images/image-071-bt7b3592-gtyc1i.jpg', alt: 'Building entrance at Exhibit On Superior in Chicago, Illinois', category: 'Building' },
  { src: '/images/assets/images/image-072-30-north-runyfq.jpg', alt: 'View to the North at Exhibit On Superior in Chicago, Illinois', category: 'Views' },
  { src: '/images/assets/images/image-073-30-south-kis7bz.jpg', alt: 'View to the South from Exhibit On Superior in Chicago, Illinois', category: 'Views' },
];

export function PhotoGallery() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>('All');

  const categories = ['All', 'Apartments', 'Amenities', 'Building', 'Views', 'Lobby'];
  
  const filteredImages = filter === 'All' 
    ? galleryImages 
    : galleryImages.filter(img => img.category === filter);

  return (
    <div>
      <PageHero
        image="/images/assets/images/image-033-lounge-mfioa0.jpg"
        alt="Photo Gallery | Exhibit On Superior in Chicago, Illinois"
        title="Photo Gallery"
        subtitle="Explore Our Beautiful Spaces"
      />

      {/* Filter Tabs */}
      <section className="py-8 px-4 border-b border-border">
        <div className="container mx-auto">
          <div className="flex flex-wrap gap-4 justify-center">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`uppercase tracking-wider text-sm px-6 py-2 transition-colors ${
                  filter === category
                    ? 'bg-primary text-white'
                    : 'border border-border hover:border-primary'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className="relative aspect-square overflow-hidden group cursor-pointer"
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {selectedImage !== null && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-primary transition-colors"
            aria-label="Close"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={filteredImages[selectedImage].src}
            alt={filteredImages[selectedImage].alt}
            className="max-w-full max-h-full object-contain"
          />
          <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm">
            {selectedImage + 1} / {filteredImages.length}
          </div>
        </div>
      )}
    </div>
  );
}
