import { LeadForm } from '@/components/LeadForm';
import { LocalBusinessSchema } from '@/components/LocalBusinessSchema';

export default function Home() {
  return (
    <>
      <LocalBusinessSchema />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <header className="bg-blue-700 text-white py-4 px-6">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold">Medicare Spokane</h1>
            <a href="tel:+15095550100" className="bg-white text-blue-700 px-4 py-2 rounded font-semibold hover:bg-blue-50">
              Call (509) 555-0100
            </a>
          </div>
        </header>

        <section className="max-w-5xl mx-auto px-6 py-16 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Find the Best Medicare Plans in Spokane, WA
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Free, unbiased help from a local Medicare advisor. Compare Medicare Advantage,
            Supplement, and Part D plans available in Spokane.
          </p>
        </section>

        <section className="max-w-lg mx-auto px-6 pb-16">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Get Your Free Medicare Review
            </h3>
            <p className="text-gray-600 mb-6 text-center">
              No obligation. A local advisor will call you within 24 hours.
            </p>
            <LeadForm />
          </div>
        </section>

        <section className="bg-gray-50 py-12 px-6">
          <div className="max-w-5xl mx-auto">
            <h3 className="text-3xl font-bold text-gray-900 text-center mb-8">
              Why Choose Medicare Spokane?
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: 'Local Experts', desc: 'We know the Medicare plans available in Spokane and Eastern Washington.' },
                { title: 'Free Service', desc: 'Our help costs you nothing. We are compensated by insurance carriers.' },
                { title: 'Unbiased Advice', desc: 'We compare plans from multiple carriers to find the best fit for you.' },
              ].map((item) => (
                <div key={item.title} className="bg-white rounded-lg p-6 shadow-sm">
                  <h4 className="font-semibold text-lg text-gray-900 mb-2">{item.title}</h4>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="bg-gray-800 text-gray-400 py-8 px-6 text-center text-sm mt-12">
          <p>© {new Date().getFullYear()} Medicare Spokane. Not affiliated with the federal Medicare program.</p>
          <p className="mt-2">Licensed insurance agent. Serving Spokane, WA and surrounding areas.</p>
        </footer>
      </main>
    </>
  );
}
