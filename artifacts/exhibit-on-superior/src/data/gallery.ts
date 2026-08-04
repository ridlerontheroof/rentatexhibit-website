// Photo-gallery data + structured data, shared by the PhotoGallery page and
// the prerenderer (entry-server.tsx). The visible grid and the ImageGallery
// JSON-LD are both built from `galleryImages`, so they can never drift.

import { SITE_URL, canonicalFor } from './seo';

export interface GalleryImage {
  src: string;
  alt: string;
  category: string;
}

export const galleryImages: GalleryImage[] = [
  { src: '/images/image-033-lounge-mfioa0.jpg', alt: 'Resident lounge at Exhibit On Superior in River North Chicago', category: 'Lobby' },
  { src: '/images/image-034-012417-5663-hxwee6.jpg', alt: 'Kitchen and dining table at Exhibit On Superior in Chicago, Illinois', category: 'Apartment Gallery' },
  { src: '/images/image-035-012417-5680-yegi2f.jpg', alt: 'Kitchen with upscale appliances at Exhibit On Superior in Chicago, Illinois', category: 'Apartment Gallery' },
  { src: '/images/image-036-012417-5793-ebbynh.jpg', alt: 'Quartz countertops at Exhibit On Superior in Chicago, Illinois', category: 'Apartment Gallery' },
  { src: '/images/image-037-012417-5630-zsx9za.jpg', alt: 'High quality range at Exhibit On Superior in Chicago, Illinois', category: 'Apartment Gallery' },
  { src: '/images/image-038-012417-6039-adwhss.jpg', alt: 'Kitchen with stainless-steel appliances and quartz countertops at Exhibit On Superior in Chicago, Illinois', category: 'Apartment Gallery' },
  { src: '/images/image-039-012417-5797-pnyuww.jpg', alt: 'Close up of the stainless-steel sink at Exhibit On Superior in Chicago, Illinois', category: 'Apartment Gallery' },
  { src: '/images/image-040-012417-5616b-x84gwq.jpg', alt: 'Dining table beside the kitchen island in an apartment at Exhibit On Superior in Chicago, Illinois', category: 'Apartment Gallery' },
  { src: '/images/image-041-012417-5607-piqxtr.jpg', alt: 'Living room with accent wall at Exhibit On Superior in Chicago, Illinois', category: 'Apartment Gallery' },
  { src: '/images/image-042-012417-5548-cyorgo.jpg', alt: 'Large window in the living room and couch at Exhibit On Superior in Chicago, Illinois', category: 'Apartment Gallery' },
  { src: '/images/image-043-012417-5563-oriwf6.jpg', alt: 'Bedroom with blue accent wall at Exhibit On Superior in Chicago, Illinois', category: 'Apartment Gallery' },
  { src: '/images/image-044-012417-5578-ttpmgd.jpg', alt: 'Bedroom at Exhibit On Superior in Chicago, Illinois', category: 'Apartment Gallery' },
  { src: '/images/image-045-012417-5719-d9ekn6.jpg', alt: 'Second bedroom with large windows at Exhibit On Superior in Chicago, Illinois', category: 'Apartment Gallery' },
  { src: '/images/image-046-012417-5990-n11px5.jpg', alt: 'Couch and accent wall at Exhibit On Superior in Chicago, Illinois', category: 'Apartment Gallery' },
  { src: '/images/image-047-012417-6106-pktrcl.jpg', alt: 'Sunlit room with floor-to-ceiling windows in an apartment at Exhibit On Superior in Chicago, Illinois', category: 'Apartment Gallery' },
  { src: '/images/image-048-012417-5784-mqhldb.jpg', alt: 'Bedroom with floor-to-ceiling window at Exhibit On Superior in Chicago, Illinois', category: 'Apartment Gallery' },
  { src: '/images/image-049-012417-5711-tfyt08.jpg', alt: 'Extra bedroom with large closet at Exhibit On Superior in Chicago, Illinois', category: 'Apartment Gallery' },
  { src: '/images/image-050-012417-5857-ihelta.jpg', alt: 'Bedroom with adjacent closet in an apartment at Exhibit On Superior in Chicago, Illinois', category: 'Apartment Gallery' },
  { src: '/images/image-051-012417-5582-dbyi1b.jpg', alt: 'Stacked washer and dryer at Exhibit On Superior in Chicago, Illinois', category: 'Apartment Gallery' },
  { src: '/images/image-052-012417-5599-xirys3.jpg', alt: 'Bathroom at Exhibit On Superior in Chicago, Illinois', category: 'Apartment Gallery' },
  { src: '/images/image-053-012417-5817-fvbupj.jpg', alt: 'Bathroom with dark cabinetry at Exhibit On Superior in Chicago, Illinois', category: 'Apartment Gallery' },
  { src: '/images/image-054-20170808-0677-qicu1y.jpg', alt: 'Outdoor lap pool at Exhibit On Superior in Chicago, Illinois', category: 'Community Gallery' },
  { src: '/images/image-055-dji-20230620092832-0149-d-yrh5eg.jpg', alt: 'Pool and deck from above at Exhibit On Superior in Chicago, Illinois', category: 'Community Gallery' },
  { src: '/images/image-056-20170808-0721-c60hfw.jpg', alt: 'Lounge area by the pool at Exhibit On Superior in Chicago, Illinois', category: 'Community Gallery' },
  { src: '/images/image-057-dji-20230620092900-0153-d-oaedvz.jpg', alt: 'Pool and high-rise building at Exhibit On Superior in Chicago, Illinois', category: 'Community Gallery' },
  { src: '/images/image-058-20170808-0843-ymrdpp.jpg', alt: 'Firepit seating on the deck at Exhibit On Superior in Chicago, Illinois', category: 'Community Gallery' },
  { src: '/images/image-059-20170808-0852-sw1ncm.jpg', alt: 'Large rooftop amenity deck at Exhibit On Superior in Chicago, Illinois', category: 'Community Gallery' },
  { src: '/images/image-060-bt7b3585b-ykt6yu.jpg', alt: 'Games on the lawn at Exhibit On Superior in Chicago, Illinois', category: 'Community Gallery' },
  { src: '/images/image-061-012417-6396-e1vomm.jpg', alt: 'Fitness center at Exhibit On Superior in Chicago, Illinois', category: 'Community Gallery' },
  { src: '/images/image-062-012417-6604-a7yglt.jpg', alt: 'Stationary bikes at Exhibit On Superior in Chicago, Illinois', category: 'Community Gallery' },
  { src: '/images/image-063-012417-6437-nx2ske.jpg', alt: 'Meeting table in the lounge at Exhibit On Superior in Chicago, Illinois', category: 'Community Gallery' },
  { src: '/images/image-064-012417-6469-s4tipl.jpg', alt: 'Resident lounge with fireplace at Exhibit On Superior in Chicago, Illinois', category: 'Community Gallery' },
  { src: '/images/image-065-012417-6521-i8yuom.jpg', alt: 'Spacious resident lounge at Exhibit On Superior in Chicago, Illinois', category: 'Community Gallery' },
  { src: '/images/image-066-game-area-with-arcade-games-and-wall-scrabble-oz.jpg', alt: 'Chess board in the lounge at Exhibit On Superior in Chicago, Illinois', category: 'Community Gallery' },
  { src: '/images/image-067-tech-lounge-with-charging-station-and-kitchen-gh.jpg', alt: 'Large meeting table at Exhibit On Superior in Chicago, Illinois', category: 'Community Gallery' },
  { src: '/images/image-068-dsc00897-gc3ypb.jpg', alt: 'Music studio room at Exhibit On Superior in Chicago, Illinois', category: 'Community Gallery' },
  { src: '/images/image-069-012417-6379-oiufjz.jpg', alt: 'Sauna at Exhibit On Superior in Chicago, Illinois', category: 'Community Gallery' },
  { src: '/images/image-070-012417-6535-gpdv36.jpg', alt: 'Front desk at Exhibit On Superior in Chicago, Illinois', category: 'Building' },
  { src: '/images/image-071-bt7b3592-gtyc1i.jpg', alt: 'Building entrance at Exhibit On Superior in Chicago, Illinois', category: 'Building' },
  { src: '/images/image-072-30-north-runyfq.jpg', alt: 'Skyline view looking north from the 30th floor of Exhibit On Superior in Chicago, Illinois', category: 'Views' },
  { src: '/images/image-073-30-south-kis7bz.jpg', alt: 'Skyline view looking south toward the Loop from the 30th floor of Exhibit On Superior in Chicago, Illinois', category: 'Views' },
];

export const galleryCategories = ['All', 'Apartment Gallery', 'Community Gallery', 'Views', 'Building', 'Lobby'];

/**
 * Visible album guide copy for /photo-gallery — one factual description per
 * album, rendered on the page (and therefore in the prerendered HTML and
 * markdown twin). Counts and content strictly reflect `galleryImages`; the
 * gallery.test guard keeps categories and this map in lockstep.
 */
export const galleryCategoryDescriptions: Record<string, string> = {
  'Apartment Gallery':
    'Inside the homes: kitchens with quartz countertops, stainless-steel appliances, and upscale ranges; living rooms and bedrooms with accent walls and floor-to-ceiling windows; the in-home stacked washer and dryer; and bathrooms with dark cabinetry. These interiors show the standard finish level — every apartment gets the same driftwood-plank floors and window walls you see here.',
  'Community Gallery':
    'The shared amenity spaces: the outdoor lap pool and its lounge deck (including drone shots from above), firepit seating, the lawn games area, the fitness center with stationary bikes, resident lounges with a fireplace and meeting tables, the game area, the tech lounge with charging stations and kitchen, the music studio room, and the sauna.',
  Views:
    'Two skyline outlooks photographed from the 30th floor — one looking north over River North and one looking south toward the Loop — showing the kind of sightlines the tower\u2019s upper floors carry. Outlooks vary by floor and unit position; each floor-plan page lists the compass facing for its homes.',
  Building:
    'The building itself at 165 W Superior St: the front desk that anchors the 24-hour-staffed lobby, and the street-level entrance at the corner of Superior and Wells.',
  Lobby:
    'The resident lounge off the lobby, with floor-to-ceiling windows and city views — the first interior space guests see when they visit.',
};

/**
 * JSON-LD ImageGallery for /photo-gallery, built from the exact same array the
 * visible grid renders. Captions derive from each image's alt text so schema
 * always mirrors on-page content.
 */
export function photoGalleryJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    '@id': `${SITE_URL}/photo-gallery#imagegallery`,
    url: canonicalFor('/photo-gallery'),
    name: 'Exhibit On Superior Photo Gallery',
    about: { '@id': `${SITE_URL}#apartmentcomplex` },
    image: galleryImages.map((img) => ({
      '@type': 'ImageObject',
      contentUrl: `${SITE_URL}${img.src}`,
      name: img.alt,
      caption: img.alt,
    })),
  };
}
