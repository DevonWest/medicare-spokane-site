import Image from "next/image";
import { getTeamMemberInitials, type TeamMember } from "@/lib/team";

interface TeamPreviewGridProps {
  members: TeamMember[];
}

export default function TeamPreviewGrid({ members }: TeamPreviewGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {members.map((member) => {
        const initials = getTeamMemberInitials(member.name);

        return (
          <article
            key={member.name}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="aspect-[4/5] overflow-hidden bg-blue-50">
              {member.image ? (
                <Image
                  src={member.image}
                  alt={`Photo of ${member.name}, ${member.title}`}
                  width={480}
                  height={600}
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 45vw, (max-width: 1280px) 30vw, 22vw"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-2xl font-bold text-blue-800">
                  <span aria-hidden="true">{initials}</span>
                </div>
              )}
            </div>
            <div className="space-y-1 p-4">
              <h3 className="text-base font-semibold leading-snug text-gray-900">{member.name}</h3>
              <p className="text-sm leading-snug text-blue-700">{member.title}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
