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
    icon: "📍",
    title: "Local Medicare Experts",
    body: "Our Spokane-based team works with neighbors in Spokane, Spokane Valley, Liberty Lake, Cheney, and across Eastern Washington — and knows the local doctors, hospitals, and provider networks.",
  },
  {
    icon: "🗂️",
    title: "Multiple Carrier Options",
    body: "As a licensed independent insurance agency, we represent multiple carriers so you can compare options and review choices side-by-side instead of being limited to one company.",
  },
  {
    icon: "📅",
    title: "Year-Round Support",
    body: "We are not just here at enrollment. Call us any time of year for billing questions, ID card help, plan changes, and Annual Enrollment reviews.",
  },
  {
    icon: "👥",
    title: "Personalized Plan Reviews",
    body: "We sit down with your doctors, prescriptions, and budget to help you find coverage that fits your needs — at your own pace, with no pressure.",
  },
];

export default function TrustBenefits({
  heading = "Why Spokane Residents Choose Us",
  subheading = "Independent Guidance from a licensed local agency serving Spokane and Eastern Washington.",
  items = defaultItems,
}: TrustBenefitsProps) {
  return (
    <section className="py-20 px-4 bg-slate-50 border-y border-slate-100">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="inline-block text-blue-700 text-sm font-semibold uppercase tracking-wider mb-3">
            Trust &amp; Local Experience
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{heading}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">{subheading}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.title}
              className="bg-white rounded-2xl p-7 border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-blue-300 transition-all"
            >
              <div className="text-4xl mb-4" aria-hidden="true">
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
