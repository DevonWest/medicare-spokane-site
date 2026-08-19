import Link from "next/link";
import { getMarketUpdatesNewestFirst, marketUpdatesHub } from "@/lib/marketUpdates";

export default function MarketUpdateLinks({ currentPath }: { currentPath: string }) {
  const relatedUpdates = getMarketUpdatesNewestFirst().filter(
    (update) => update.path !== currentPath,
  );

  return (
    <aside
      aria-labelledby="related-market-updates"
      className="rounded-2xl border border-blue-200 bg-blue-50 p-6"
    >
      <h2 id="related-market-updates" className="text-xl font-bold text-gray-900">
        Related Spokane coverage updates
      </h2>
      <p className="mt-3 leading-relaxed text-gray-700">
        Follow the central tracker for confirmed Spokane County and Washington information across
        Medicare and health insurance market changes.
      </p>
      <ul className="mt-4 space-y-3">
        <li>
          <Link href={marketUpdatesHub.path} className="font-semibold text-blue-700 hover:underline">
            {marketUpdatesHub.title}
          </Link>
        </li>
        {relatedUpdates.map((update) => (
          <li key={update.path}>
            <Link href={update.path} className="font-semibold text-blue-700 hover:underline">
              {update.shortTitle}
            </Link>
          </li>
        ))}
        <li>
          <Link href="/resources" className="font-semibold text-blue-700 hover:underline">
            Spokane Medicare and health insurance resources
          </Link>
        </li>
      </ul>
    </aside>
  );
}
