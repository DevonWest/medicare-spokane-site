import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Disclaimer from "@/components/Disclaimer";
import PageHero from "@/components/PageHero";
import { siteConfig } from "@/lib/site";
import { getActiveReviewableTeamMembers, getTeamMemberSlug } from "@/lib/team";

export const metadata: Metadata = {
  title: "Review Our Medicare Team | Medicare in Spokane",
  description:
    "Choose the Medicare in Spokane team member you worked with so your review or feedback reaches the right person.",
  alternates: { canonical: `${siteConfig.url}/review` },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ReviewPage() {
  const members = getActiveReviewableTeamMembers();

  return (
    <>
      <PageHero
        title="Who Would You Like to Review?"
        subtitle="Select the person you worked with so we can make sure your feedback gets to the right place."
        crumbs={[{ href: "/", label: "Home" }, { label: "Review" }]}
      />

      <section className="bg-white px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {members.map((member) => {
              const firstName = member.name.split(" ")[0];
              const href = `/review/rating?agent=${encodeURIComponent(getTeamMemberSlug(member))}`;

              return (
                <article
                  key={member.name}
                  className="flex h-full flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm"
                >
                  <div className="aspect-[4/3] bg-blue-50">
                    {member.image ? (
                      <Image
                        src={member.image}
                        alt={`Photo of ${member.name}, ${member.title}`}
                        width={800}
                        height={600}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-blue-900">
                        <span className="text-3xl font-bold">{member.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="text-2xl font-bold text-gray-900">{member.name}</h2>
                    <p className="mt-2 text-base leading-7 text-blue-700">{member.title}</p>
                    <Link
                      href={href}
                      className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-700 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-800"
                    >
                      Review {firstName}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          <Disclaimer className="mx-auto mt-10 max-w-4xl" />
        </div>
      </section>
    </>
  );
}
