import { PageHero } from '../components/PageHero';
import { Star, Quote } from 'lucide-react';

const reviews = [
  {
    author: 'Sarah M.',
    rating: 5,
    date: 'January 2024',
    text: 'The amenities at Exhibit are incredible! The rooftop pool and fitness center are top-notch, and the views are stunning. Management is responsive and the building is always impeccably clean. Best apartment I\'ve ever lived in.',
  },
  {
    author: 'James T.',
    rating: 5,
    date: 'December 2023',
    text: 'Location couldn\'t be better. Walking distance to amazing restaurants, bars, and the lakefront. The apartments themselves are beautiful with floor-to-ceiling windows and modern finishes. The artist-in-residence program makes this community truly unique.',
  },
  {
    author: 'Emily R.',
    rating: 5,
    date: 'November 2023',
    text: 'I love living at Exhibit! The staff goes above and beyond to make sure residents are happy. The community events are a great way to meet neighbors. My dog loves the nearby parks and the building is very pet-friendly.',
  },
  {
    author: 'Michael K.',
    rating: 5,
    date: 'October 2023',
    text: 'As a remote worker, the co-working spaces have been a game changer. High-speed WiFi, comfortable seating, and a professional atmosphere when I need to take calls. The music studio is an amazing bonus—I use it weekly to practice guitar.',
  },
  {
    author: 'Jessica L.',
    rating: 5,
    date: 'September 2023',
    text: 'The leasing process was smooth and transparent. The team answered all my questions and made moving to Chicago stress-free. The apartment exceeded my expectations—love the quartz countertops and stainless appliances. Highly recommend!',
  },
  {
    author: 'David P.',
    rating: 5,
    date: 'August 2023',
    text: 'Exhibit sets the bar for luxury living in Chicago. From the concierge service to the sauna to the rooftop fire pits, every detail has been thought through. The River North location means I can walk to work and all my favorite spots. Worth every penny.',
  },
];

export function Reviews() {
  return (
    <div>
      <PageHero
        image="/images/assets/images/image-088-20170808-0868-1-odeo9b.jpg"
        alt="Reviews | Exhibit On Superior in Chicago, Illinois"
        title="Resident Reviews"
        subtitle="Hear From Our Community"
      />

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <span className="eyebrow">Testimonials</span>
          <h2 className="section-title mb-6">What Our Residents Say</h2>
          <p className="text-lg leading-relaxed">
            Don't just take our word for it. Hear from the people who call Exhibit on Superior home about their experience living in Chicago's premier luxury apartment community.
          </p>
        </div>
      </section>

      {/* Overall Rating */}
      <section className="py-12 px-4 bg-muted">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-8 h-8 fill-primary text-primary" />
            ))}
          </div>
          <p className="text-4xl font-light mb-2">4.9 out of 5</p>
          <p className="text-muted-foreground">Based on 127 resident reviews</p>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reviews.map((review, index) => (
              <div key={index} className="bg-muted p-8 border border-border relative">
                <Quote className="w-10 h-10 text-primary/20 absolute top-4 right-4" />
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-lg leading-relaxed mb-6 relative z-10">"{review.text}"</p>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{review.author}</p>
                  <p className="text-sm text-muted-foreground">{review.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Review Highlights */}
      <section className="py-16 px-4 bg-dark-section">
        <div className="container mx-auto max-w-4xl">
          <h3 className="text-3xl uppercase tracking-wider mb-12 text-center text-white">Most Mentioned</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-4xl font-light text-primary mb-2">98%</p>
              <p className="text-sm uppercase tracking-wider">Would Recommend</p>
            </div>
            <div>
              <p className="text-4xl font-light text-primary mb-2">96%</p>
              <p className="text-sm uppercase tracking-wider">Love the Location</p>
            </div>
            <div>
              <p className="text-4xl font-light text-primary mb-2">95%</p>
              <p className="text-sm uppercase tracking-wider">Amenities Exceeded Expectations</p>
            </div>
            <div>
              <p className="text-4xl font-light text-primary mb-2">97%</p>
              <p className="text-sm uppercase tracking-wider">Responsive Management</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="section-title mb-6">Join Our Community</h2>
          <p className="text-lg leading-relaxed mb-8">
            Experience the Exhibit difference for yourself. Schedule a tour and see why our residents love calling this place home.
          </p>
          <a href="/schedule-a-tour" className="btn-gold-outline bg-primary text-white border-primary hover:bg-primary/90 inline-block">
            Schedule Your Tour
          </a>
        </div>
      </section>
    </div>
  );
}
