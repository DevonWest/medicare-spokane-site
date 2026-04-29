import type { Metadata } from "next";
import CTASection from "@/components/CTASection";
import Disclaimer from "@/components/Disclaimer";
import PageHero from "@/components/PageHero";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Client Testimonials – Medicare in Spokane",
  description:
    "Read what Spokane-area Medicare clients say about working with Health Insurance Options LLC and our local team of licensed insurance professionals.",
  alternates: { canonical: `${siteConfig.url}/testimonials` },
  openGraph: {
    title: "Client Testimonials – Medicare in Spokane",
    description:
      "Spokane-area Medicare clients on working with Health Insurance Options LLC.",
    url: `${siteConfig.url}/testimonials`,
  },
};

interface Testimonial {
  quote: string;
  author?: string;
}

const testimonials: Testimonial[] = [
  {
    quote:
      "Craig Lenhart patiently, competently, and thoughtfully dissected and clarified how to select coverage based on my personal needs both medically and financially. He exemplifies compassionate work ethic. A breath of fresh air. What a blessing!",
  },
  {
    quote: "Meg is respectful while providing the best savings for her clients.",
    author: "Sherry Ransom",
  },
  {
    quote:
      "I have found this in my Medicare Advantage Agents – Lynn Wold and her team at Health Options. She has been helping me for over 10 years now. Although I don’t need her every year, but when I do – she is right there eager to help. She is so reliable. If you have a need please give Lynn and her team a try – you won’t be disappointed.",
    author: "Jeanette C.",
  },
  {
    quote:
      "The agents are very knowledgeable, friendly, helpful and LOCAL! It’s a treacherous journey to embark on by yourself and I am forever grateful for the personal assistance I have received through the years, especially as plans and options change.",
    author: "Jacquie K.",
  },
  {
    quote:
      "Craig Lenhart was a huge help in explaining and navigating the complexities of Medicare. He was very generous with his time. I feel certain that I have plans that work for my situation. Craig is very competent and trustworthy. I would recommend him to anyone looking for an agent.",
    author: "Mike A.",
  },
  {
    quote:
      "Last year, Craig Lenhart saved me $800! I would have missed the increase in my insurance package, had not Craig flagged me down. My experience with him and this agency has been exceptional. Within their professional and competent casing is an authentic desire to serve and provide helpful navigation through the quagmire of insurance complexities.",
    author: "Judy M.",
  },
];

export default function TestimonialsPage() {
  return (
    <>
      <PageHero
        title="What Our Clients Say"
        subtitle="Real feedback from Spokane-area Medicare clients about their experience working with our local team."
        crumbs={[{ href: "/", label: "Home" }, { label: "Testimonials" }]}
      />

      <section className="py-14 px-4 bg-white">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <figure
              key={i}
              className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-col"
            >
              <svg
                className="h-6 w-6 text-blue-500 mb-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M7.17 6A5.17 5.17 0 002 11.17V18h6.83v-6.83H5.66A1.5 1.5 0 017.17 9.66V6zm10 0A5.17 5.17 0 0012 11.17V18h6.83v-6.83h-3.17a1.5 1.5 0 011.51-1.51V6z" />
              </svg>
              <blockquote className="text-gray-800 leading-relaxed flex-1">
                “{t.quote}”
              </blockquote>
              {t.author ? (
                <figcaption className="mt-4 text-sm font-semibold text-gray-700">
                  — {t.author}
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>

        <p className="max-w-3xl mx-auto mt-10 text-xs text-gray-500 leading-relaxed text-center">
          Testimonials reflect the personal experience of individual clients and are not a
          guarantee of any specific outcome, savings, or plan suitability for your situation.
        </p>
      </section>

      <section className="py-10 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <Disclaimer />
        </div>
      </section>

      <CTASection />
    </>
  );
}
