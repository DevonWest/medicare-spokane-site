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
          const initials = member.name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2);

          return (
            <div
              key={member.name}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
            >
              <div className="relative w-full aspect-square bg-blue-50">
                {member.image ? (
                  <Image
                    src={member.image}
                    alt={`Photo of ${member.name}, ${member.title}`}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    unoptimized
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-blue-800">
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
                <h3 className="text-lg font-bold text-gray-900 leading-snug">{member.name}</h3>
                <p className="text-sm font-medium text-blue-700 mt-0.5 mb-3">{member.title}</p>
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
                    className="inline-flex items-center justify-center bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    Request a Call
                  </Link>
                  {member.scheduleUrl && (
                    <a
                      href={member.scheduleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center bg-white border border-blue-300 hover:border-blue-500 text-blue-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
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
