import Link from "next/link";

export default function MedicareCosts2027Guide() {
  return (
    <section
      id="2027-medicare-costs"
      aria-labelledby="medicare-costs-heading"
      className="mt-8 rounded-2xl border border-blue-200 bg-white p-6"
    >
      <h2 id="medicare-costs-heading" className="text-2xl font-bold text-gray-900">
        2027 Medicare cost guide
      </h2>
      <p className="mt-3 leading-relaxed text-gray-700">
        The standard Part B premium is $209.40 a month in 2027, and the annual
        Part B deductible is $292. Use the guide to look up hospital
        and skilled nursing costs or see how income affects Part B and Part D premiums.
      </p>
      <Link
        href="/2027-medicare-costs"
        className="mt-5 inline-block rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
      >
        Read the 2027 Medicare cost guide
      </Link>
    </section>
  );
}
