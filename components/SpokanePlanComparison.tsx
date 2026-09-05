import Link from "next/link";

export default function SpokanePlanComparison() {
  return (
    <section aria-labelledby="spokane-plan-comparison-heading" className="border-b border-blue-100 bg-blue-50 px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <h2 id="spokane-plan-comparison-heading" className="text-3xl font-bold text-gray-900">Which Medicare plans should you compare in Spokane?</h2>
        <p className="mt-4 max-w-4xl text-lg leading-relaxed text-gray-700">
          Start with how you want to receive your medical benefits: Original Medicare or Medicare Advantage.
          If you choose Original Medicare, you can consider a Medicare Supplement policy and separate Part D drug coverage.
          Medigap does not pay Medicare Advantage copays. Your doctors, prescriptions, budget, and enrollment rights help determine what to compare.
        </p>
        <div className="mt-7 overflow-x-auto rounded-xl border border-blue-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-base">
            <caption className="sr-only">Medicare plan types and what Spokane residents should review</caption>
            <thead className="bg-blue-100 text-gray-900"><tr>
              <th scope="col" className="p-4">Coverage option</th>
              <th scope="col" className="p-4">How it works</th>
              <th scope="col" className="p-4">What to check locally</th>
            </tr></thead>
            <tbody className="divide-y divide-blue-100 text-gray-700">
              <tr>
                <th scope="row" className="p-4 align-top"><Link href="/medicare-advantage" className="font-semibold text-blue-800 underline">Medicare Advantage plans</Link></th>
                <td className="p-4 align-top">Part A and Part B through a private plan; most include Part D. You keep paying your Part B premium.</td>
                <td className="p-4 align-top">Exact Spokane County service area, doctors, hospitals, referrals, medical cost sharing, and annual out-of-pocket limit.</td>
              </tr>
              <tr>
                <th scope="row" className="p-4 align-top"><Link href="/medicare-supplements" className="font-semibold text-blue-800 underline">Medicare Supplement plans (Medigap)</Link></th>
                <td className="p-4 align-top">A separate policy that helps with certain Original Medicare costs. New policies do not include prescription drugs.</td>
                <td className="p-4 align-top">Medicare acceptance, plan-letter benefits such as G or N, premiums, and your Washington enrollment or switching rights.</td>
              </tr>
              <tr>
                <th scope="row" className="p-4 align-top"><Link href="/medicare-part-d" className="font-semibold text-blue-800 underline">Medicare Part D plans</Link></th>
                <td className="p-4 align-top">Standalone prescription drug coverage, commonly paired with Original Medicare and Medigap.</td>
                <td className="p-4 align-top">Each medication and dosage, your pharmacy, coverage restrictions, and total estimated yearly cost.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-gray-600">
          Coverage basics: <a href="https://www.medicare.gov/basics/get-started-with-medicare/get-more-coverage/your-coverage-options/compare-original-medicare-medicare-advantage" className="text-blue-800 underline">Medicare.gov comparison</a> and <a href="https://www.medicare.gov/health-drug-plans/medigap/basics/coverage" className="text-blue-800 underline">Medigap coverage</a>. Plan availability and costs depend on your situation and address.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-blue-200 bg-white p-6">
            <h3 className="text-xl font-bold text-gray-900">Check your Spokane care team</h3>
            <p className="mt-3 leading-relaxed text-gray-700">Include your primary doctor, specialists, hospital, and imaging provider. Confirm the exact plan with both the plan and each provider.</p>
            <ul className="mt-4 space-y-2 font-semibold text-blue-800">
              <li><Link href="/providence-medicare-advantage-plans-spokane" className="underline">Providence Medicare network guide</Link></li>
              <li><Link href="/multicare-medicare-advantage-plans-spokane" className="underline">MultiCare and Rockwood Medicare network guide</Link></li>
              <li><Link href="/inland-imaging-medicare-plans-spokane" className="underline">Inland Imaging Medicare coverage guide</Link></li>
            </ul>
          </div>
          <div className="rounded-xl border border-blue-200 bg-white p-6">
            <h3 className="text-xl font-bold text-gray-900">Prepare for Medicare Annual Enrollment</h3>
            <p className="mt-3 leading-relaxed text-gray-700">AEP runs October 15–December 7 each year for permitted Medicare Advantage and Part D changes, with coverage effective January 1. Medigap follows separate rules.</p>
            <p className="mt-3 leading-relaxed text-gray-700">Bring your Annual Notice of Change, provider list, prescriptions, and preferred pharmacies. Check the coming year’s plan documents before deciding.</p>
            <Link href="/medicare-annual-enrollment-spokane" className="mt-4 inline-block font-semibold text-blue-800 underline">Get your Spokane AEP review checklist →</Link>
            <p className="mt-3 text-sm"><a href="https://www.medicare.gov/health-drug-plans/open-enrollment" className="text-blue-800 underline">Official Medicare enrollment dates</a></p>
          </div>
        </div>
        <p className="mt-7 text-lg leading-relaxed text-gray-700">
          Comparing coverage outside Spokane County? Our <Link href="/medicare-stevens-county" className="font-semibold text-blue-800 underline">Stevens County Medicare guide</Link> explains what to check when you live in Colville, Chewelah, or the surrounding area and use care in Spokane.
        </p>
      </div>
    </section>
  );
}
