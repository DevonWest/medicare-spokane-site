import Link from "next/link";

export default function UhcProvidenceUpdate() {
  return (
    <aside className="my-6 rounded-2xl border border-blue-200 bg-blue-50 p-6 text-gray-900" aria-label="2027 UnitedHealthcare and Providence update">
      <p className="font-bold">September 21, 2026: New UHC–Providence network update</p>
      <p className="mt-3 leading-relaxed">Review the announced January 1, 2027 change before using a current carrier listing to choose next year&apos;s coverage. The article explains the individual Medicare Advantage scope, Washington D-SNP exception and continuing negotiations.</p>
      <Link href="/unitedhealthcare-providence-medicare-advantage-2027-spokane" className="mt-3 inline-block font-semibold text-blue-700 underline hover:text-blue-900">Read the UHC–Providence 2027 announcement and next steps →</Link>
    </aside>
  );
}
