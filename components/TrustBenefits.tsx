interface Benefit {
  title: string;
  body: string;
  icon: string;
}

interface TrustBenefitsProps {
  heading?: string;
  subheading?: string;
  items?: Benefit[];
}

const defaultItems: Benefit[] = [
  {
    icon: "🏠",
    title: "Local Spokane Expertise",
    body: "We work with Spokane-area residents every day and are familiar with the doctors, hospitals, and provider networks serving Eastern Washington.",
  },
  {
    icon: "💰",
    title: "No Cost to You",
    body: "Our help is free. We are paid by the insurance carriers we represent, so you pay the same plan premium whether you work with us or enroll on your own.",
  },
  {
    icon: "🛡️",
    title: "Independent & Unbiased",
    body: "As a licensed independent insurance agency, we represent multiple carriers and walk you through your options so you can make an informed choice.",
  },
  {
    icon: "📞",
    title: "Real People, Year-Round",
    body: "We are here for you long after enrollment — for billing questions, plan changes, or annual reviews during the Annual Enrollment Period.",
  },
];

export default function TrustBenefits({
  heading = "Why Spokane Residents Work With Us",
  subheading = "We are a licensed independent insurance agency serving Spokane and Eastern Washington.",
  items = defaultItems,
}: TrustBenefitsProps) {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">{heading}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">{subheading}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.title}
              className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:border-blue-300 transition-colors"
            >
              <div className="text-3xl mb-3" aria-hidden="true">
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
