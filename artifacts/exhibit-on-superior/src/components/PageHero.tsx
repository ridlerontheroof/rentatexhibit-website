interface PageHeroProps {
  image: string;
  alt: string;
  title: string;
  subtitle?: string;
}

export function PageHero({ image, alt, title, subtitle }: PageHeroProps) {
  return (
    <div className="relative h-[400px] lg:h-[500px] overflow-hidden">
      <img
        src={image}
        alt={alt}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
        <div className="text-center text-white px-4">
          <h1 className="page-title text-white mb-4">{title}</h1>
          {subtitle && (
            <p className="text-lg md:text-xl max-w-2xl mx-auto">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
