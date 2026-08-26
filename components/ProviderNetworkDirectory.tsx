"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  PROVIDER_NETWORK_CHECKED_AT,
  PROVIDER_NETWORK_CHECKED_LABEL,
  getProviderNetworkSource,
  getProviderNetworkStatusLabel,
  getProviderSystem,
  providerNetworkEntries,
  providerSystems,
  type ProviderNetworkEntry,
  type ProviderNetworkStatus,
} from "@/lib/providerNetworks";

const statusStyles: Record<ProviderNetworkStatus, string> = {
  listed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  limited: "border-emerald-200 bg-emerald-50 text-emerald-800",
  pending: "border-amber-200 bg-amber-50 text-amber-900",
  "not-listed": "border-slate-300 bg-slate-100 text-slate-700",
  "not-in-network": "border-rose-200 bg-rose-50 text-rose-800",
};

interface ProviderNetworkDirectoryProps {
  entries?: readonly ProviderNetworkEntry[];
  fixedSystemId?: string;
  showFilters?: boolean;
}

export default function ProviderNetworkDirectory({
  entries = providerNetworkEntries,
  fixedSystemId,
  showFilters = true,
}: ProviderNetworkDirectoryProps) {
  const [query, setQuery] = useState("");
  const [systemId, setSystemId] = useState(fixedSystemId ?? "all");
  const [status, setStatus] = useState<ProviderNetworkStatus | "all">("all");

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const selectedSystemId = fixedSystemId ?? systemId;

    return entries.filter((entry) => {
      const system = getProviderSystem(entry.systemId);
      const matchesSystem =
        selectedSystemId === "all" || entry.systemId === selectedSystemId;
      const matchesStatus = status === "all" || entry.status === status;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          entry.carrier,
          entry.productScope,
          entry.detail,
          system?.name ?? "",
          system?.area ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesSystem && matchesStatus && matchesQuery;
    });
  }, [entries, fixedSystemId, query, status, systemId]);

  const groupedEntries = providerSystems
    .map((system) => ({
      system,
      entries: filteredEntries.filter((entry) => entry.systemId === system.id),
    }))
    .filter((group) => group.entries.length > 0);

  return (
    <section aria-labelledby="network-directory-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            Source-backed Spokane crosswalk
          </p>
          <h2 id="network-directory-heading" className="mt-2 text-3xl font-bold text-gray-900">
            Search carrier and provider network information
          </h2>
        </div>
        <p className="text-sm text-gray-600">
          Sources checked{" "}
          <time dateTime={PROVIDER_NETWORK_CHECKED_AT}>{PROVIDER_NETWORK_CHECKED_LABEL}</time>
        </p>
      </div>

      {showFilters ? (
        <div className="mt-7 grid grid-cols-1 gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-5 md:grid-cols-3">
          <label className="block text-sm font-semibold text-gray-800">
            Search carrier or health system
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try Humana, SCAN, or Providence"
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 font-normal text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <label className="block text-sm font-semibold text-gray-800">
            Health system
            <select
              value={fixedSystemId ?? systemId}
              onChange={(event) => setSystemId(event.target.value)}
              disabled={Boolean(fixedSystemId)}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 font-normal text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
            >
              <option value="all">All health systems</option>
              {providerSystems.map((system) => (
                <option key={system.id} value={system.id}>
                  {system.shortName}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-gray-800">
            Listing status
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as ProviderNetworkStatus | "all")
              }
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 font-normal text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">All statuses</option>
              <option value="listed">Listed by provider</option>
              <option value="limited">Listed products — see details below</option>
              <option value="pending">Pending — verify before service</option>
              <option value="not-listed">Not listed</option>
              <option value="not-in-network">Not in network for listed product</option>
            </select>
          </label>
        </div>
      ) : null}

      <p className="mt-5 text-sm font-medium text-gray-600" aria-live="polite">
        Showing {filteredEntries.length} {filteredEntries.length === 1 ? "result" : "results"}
      </p>

      {groupedEntries.length > 0 ? (
        <div className="mt-6 space-y-8">
          {groupedEntries.map(({ system, entries: systemEntries }) => (
            <section
              key={system.id}
              aria-labelledby={`${system.id}-heading`}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-200 bg-slate-50 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-700">{system.area}</p>
                    <h3 id={`${system.id}-heading`} className="mt-1 text-2xl font-bold text-gray-900">
                      {system.name}
                    </h3>
                    <p className="mt-3 max-w-4xl leading-relaxed text-gray-700">{system.summary}</p>
                  </div>
                  {system.detailPath ? (
                    <Link
                      href={system.detailPath}
                      className="shrink-0 font-semibold text-blue-700 hover:underline"
                    >
                      Read system guide →
                    </Link>
                  ) : null}
                </div>
                {system.note ? (
                  <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
                    {system.note}
                  </p>
                ) : null}
              </div>
              <ul className="divide-y divide-slate-200">
                {systemEntries.map((entry) => (
                  <li key={entry.id} className="p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h4 className="text-xl font-bold text-gray-900">{entry.carrier}</h4>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[entry.status]}`}
                          >
                            {getProviderNetworkStatusLabel(entry.status)}
                          </span>
                        </div>
                        <p className="mt-3 font-semibold text-gray-800">{entry.productScope}</p>
                        <p className="mt-2 max-w-4xl leading-relaxed text-gray-700">{entry.detail}</p>
                      </div>
                      <div className="shrink-0 text-sm text-gray-600 lg:max-w-56">
                        <p className="font-semibold text-gray-800">Official source</p>
                        <ul className="mt-2 space-y-2">
                          {entry.sourceIds.map((sourceId) => {
                            const source = getProviderNetworkSource(sourceId);
                            return source ? (
                              <li key={source.id}>
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-semibold text-blue-700 hover:underline"
                                >
                                  {source.publisher} ↗
                                </a>
                              </li>
                            ) : null;
                          })}
                        </ul>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900">No matching network entry</h3>
          <p className="mt-3 text-gray-700">
            Try a broader carrier name or clear one of the filters. An absent result does not mean a
            provider is out of network.
          </p>
        </div>
      )}
    </section>
  );
}
