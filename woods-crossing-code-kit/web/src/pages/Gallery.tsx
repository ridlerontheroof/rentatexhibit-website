import { verifiedContent } from "../data/generated";
import { Link } from "wouter";

export default function Gallery() {
  return (
    <div className="py-24 px-4 md:px-8 max-w-7xl mx-auto w-full">
      <header className="mb-16 md:mb-24 max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-serif tracking-tight mb-6">Gallery</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          A glimpse into life at our community.
        </p>
      </header>

      {(!verifiedContent.gallery || verifiedContent.gallery.length === 0) ? (
        <div className="text-center py-24 text-muted-foreground border rounded-sm bg-secondary/10 max-w-2xl mx-auto">
          <p className="mb-4 text-lg">Gallery images are currently being updated.</p>
          <p>Please <Link href="/contact" className="text-primary hover:underline">contact us</Link> to schedule a tour.</p>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {verifiedContent.gallery.map((image, i) => (
            <div key={i} className="break-inside-avoid relative group overflow-hidden rounded-sm bg-secondary/20">
              <img 
                src={image.src} 
                alt={image.alt}
                width={image.width}
                height={image.height}
                loading="lazy"
                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <span className="text-white font-medium">{image.alt}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}