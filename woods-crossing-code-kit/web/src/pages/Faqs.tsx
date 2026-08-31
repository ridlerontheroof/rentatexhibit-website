import { verifiedContent } from "../data/generated";
import { Link } from "wouter";

export default function Faqs() {
  return (
    <div className="py-24 px-4 md:px-8 max-w-4xl mx-auto w-full">
      <header className="mb-16 md:mb-24">
        <h1 className="text-4xl md:text-6xl font-serif tracking-tight mb-6">Frequently Asked Questions</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Everything you need to know about living here.
        </p>
      </header>

      {(!verifiedContent.faqs || verifiedContent.faqs.length === 0) ? (
        <div className="text-center py-24 text-muted-foreground border rounded-sm bg-secondary/10">
          <p className="mb-4 text-lg">FAQ information is currently being updated.</p>
          <p>If you have any questions, please <Link href="/contact" className="text-primary hover:underline">contact our leasing team</Link>.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {verifiedContent.faqs.map((faq, i) => (
            <div key={i} className="pb-8 border-b last:border-0">
              <h3 className="text-xl font-medium mb-3 text-foreground">{faq.question}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}