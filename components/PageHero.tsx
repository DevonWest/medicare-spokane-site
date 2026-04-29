import Link from "next/link";

interface Crumb {
  href?: string;
  label: string;
}

interface PageHeroProps {
  title: string;
  subtitle?: string;
  crumbs: Crumb[];
}

export default function PageHero({ title, subtitle, crumbs }: PageHeroProps) {
  return (
    <section className="bg-gradient-to-br from-blue-800 to-blue-600 text-white py-16 px-4">
      <div className="max-w-5xl mx-auto">
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
    </section>
  );
}
