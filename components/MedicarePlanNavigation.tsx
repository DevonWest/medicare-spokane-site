import Link from "next/link";

const planLinks = [
  { href: "/medicare-spokane", title: "Medicare plans in Spokane", body: "Start with the main coverage choices and a local comparison checklist." },
  { href: "/medicare-advantage", title: "Medicare Advantage plans", body: "Compare provider networks, medical costs, drug coverage, and plan rules." },
  { href: "/medicare-supplements", title: "Medicare Supplement plans", body: "Explore Medigap, Plan G, Plan N, and Washington enrollment considerations." },
  { href: "/medicare-part-d", title: "Medicare Part D plans", body: "Review prescription coverage, preferred pharmacies, and annual drug costs." },
] as const;

export const planNavigationPaths = [
  "/medicare-advantage",
  "/medicare-supplements",
  "/medicare-part-d",
  "/medicare-annual-enrollment-spokane",
  "/spokane-medicare-provider-networks",
  "/providence-medicare-advantage-plans-spokane",
  "/multicare-medicare-advantage-plans-spokane",
  "/inland-imaging-medicare-plans-spokane",
] as const;

export default function MedicarePlanNavigation({ currentPath }: { currentPath?: string }) {
  const providerGuide = currentPath?.includes("network") || currentPath?.includes("plans-spokane");
  return (
    <section aria-labelledby="medicare-plan-guides-heading" className="border-y border-blue-100 bg-blue-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <h2 id="medicare-plan-guides-heading" className="text-2xl font-bold text-gray-900 md:text-3xl">
          {providerGuide ? "Use your provider list to compare Medicare plans" : "Compare Medicare plan types in Spokane"}
        </h2>
        <p className="mt-3 max-w-3xl text-lg leading-relaxed text-gray-700">
          {providerGuide
            ? "After checking provider participation, compare the coverage approach, prescriptions, and total costs. A provider's carrier list alone does not tell you which plan fits your needs."
            : "Choose the guide that matches what you want to review. Our Spokane team offers no-cost help comparing plans from the organizations we represent."}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {planLinks.filter((link) => link.href !== currentPath).map((link) => (
            <Link key={link.href} href={link.href} className="rounded-xl border border-blue-200 bg-white p-5 transition-colors hover:border-blue-500">
              <h3 className="text-lg font-semibold text-blue-800 underline underline-offset-4">{link.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-gray-700">{link.body}</p>
            </Link>
          ))}
        </div>
        <p className="mt-6 leading-relaxed text-gray-700">
          {currentPath !== "/medicare-annual-enrollment-spokane" ? <>
            Preparing for fall enrollment? <Link href="/medicare-annual-enrollment-spokane" className="font-semibold text-blue-800 underline">See AEP dates and your review checklist</Link>.{" "}
          </> : null}
          Live north of Spokane? Read our <Link href="/medicare-stevens-county" className="font-semibold text-blue-800 underline">Stevens County Medicare guide</Link> for Colville, Chewelah, and nearby communities.
        </p>
      </div>
    </section>
  );
}
