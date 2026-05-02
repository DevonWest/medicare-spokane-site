import type { ReactNode } from "react";
import Link from "next/link";

interface Crumb {
  href?: string;
  label: string;
}

interface PageHeroProps {
  title: string;
  subtitle?: string;
  crumbs: Crumb[];
  illustration?: ReactNode;
}

export default function PageHero({ title, subtitle, crumbs, illustration }: PageHeroProps) {
  return (
    <section className="bg-gradient-to-br from-blue-800 to-blue-600 text-white py-16 px-4">
      <div className={`mx-auto ${illustration ? "max-w-6xl" : "max-w-5xl"}`}>
        <div className={illustration ? "grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center" : undefined}>
          <div>
            <nav aria-label="Breadcrumb" className="text-blue-200 text-sm mb-4">
              {crumbs.map((c, i) => (
                <span key={`${i}-${c.href ?? c.label}`}>
                  {c.href ? (
                    <Link href={c.href} className="hover:text-white">
                      {c.label}
                    </Link>
                  ) : (
                    <span>{c.label}</span>
                  )}
                  {i < crumbs.length - 1 ? <span className="mx-2">/</span> : null}
                </span>
              ))}
            </nav>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">{title}</h1>
            {subtitle ? <p className="text-xl text-blue-100 max-w-3xl">{subtitle}</p> : null}
          </div>
          {illustration ? (
            <div className="hidden lg:flex lg:justify-center">
              <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-white/10 p-4 shadow-lg backdrop-blur-sm">
                {illustration}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
