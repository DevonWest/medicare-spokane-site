import Image from "next/image";
import Link from "next/link";
import type { TeamMember } from "@/lib/team";

interface TeamSectionProps {
  members: TeamMember[];
  /** When true, shows the full-page secondary CTA "Contact Our Team" button */
  showContactCTA?: boolean;
}

export default function TeamSection({ members, showContactCTA = false }: TeamSectionProps) {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {members.map((member) => {
          const supportText = member.retired
            ? "Retired — contact our office for assistance"
            : `Helping Spokane residents with Medicare${
                typeof member.yearsHelping === "number" ? ` for ${member.yearsHelping}+ years` : ""
              }`;
          const initials = member.name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2);

          return (
            <div
              key={member.name}
              className="group bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col transition-all duration-200 hover:shadow-xl hover:-translate-y-1 hover:border-blue-300"
            >
              <div className="aspect-[3/4] overflow-hidden rounded-lg bg-blue-50">
                {member.image ? (
                  <Image
                    src={member.image}
                    alt={`Photo of ${member.name}, ${member.title}`}
                    width={600}
                    height={800}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-blue-800">
                    <span className="text-4xl font-bold tracking-tight" aria-hidden="true">
                      {initials}
                    </span>
                    <span className="mt-2 text-xs font-semibold uppercase tracking-wider">
                      Health Insurance Options
                    </span>
                  </div>
                )}
              </div>

              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 leading-snug">{member.name}</h3>
                    <p className="text-sm font-medium text-blue-700 mt-0.5 mb-2">{member.title}</p>
                  </div>
                  {member.retired && (
                    <span className="inline-flex shrink-0 items-center rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                      Retired
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-gray-500 mb-3">{supportText}</p>
                <p className="text-sm text-gray-600 leading-relaxed flex-1">{member.shortBio}</p>

                {member.specialties && member.specialties.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-2" aria-label={`${member.name}'s specialties`}>
                    {member.specialties.map((s) => (
                      <li
                        key={s}
                        className="text-xs bg-blue-50 text-blue-800 rounded-full px-2.5 py-1 font-medium"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-5 flex flex-col gap-2">
                  <Link
                    href="/request-contact"
                    className="inline-flex min-h-11 items-center justify-center bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-3 rounded-lg transition-colors"
                  >
                    Request a Call
                  </Link>
                  {member.scheduleUrl && (
                    <a
                      href={member.scheduleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center justify-center bg-white border border-blue-300 hover:border-blue-500 text-blue-700 text-sm font-medium px-4 py-3 rounded-lg transition-colors"
                    >
                      Schedule with {member.name.split(" ")[0]}
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showContactCTA && (
        <div className="mt-10 text-center">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center bg-white border-2 border-blue-700 text-blue-700 hover:bg-blue-700 hover:text-white font-semibold px-8 py-3 rounded-lg transition-colors text-base"
          >
            Contact Our Team
          </Link>
        </div>
      )}
    </div>
  );
}
