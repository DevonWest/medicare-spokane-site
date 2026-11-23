import Link from "next/link";

export default function UhcProvidenceUpdate() {
  return (
    <aside className="my-6 rounded-2xl border border-blue-200 bg-blue-50 p-6 text-gray-900" aria-label="2027 UnitedHealthcare and Providence update">
      <p className="font-bold">2027 UHC Medicare Advantage network change</p>
      <p className="mt-3 leading-relaxed">Starting January 1, Providence will be out of network for UHC Medicare Advantage PPO, HMO, group retiree and Chronic Special Needs Plans. Washington UHC Dual Eligible Special Needs Plans are the exception.</p>
      <Link href="/unitedhealthcare-providence-medicare-advantage-2027-spokane" className="mt-3 inline-block font-semibold text-blue-700 underline hover:text-blue-900">Read the UHC–Providence 2027 announcement and next steps →</Link>
    </aside>
  );
}
