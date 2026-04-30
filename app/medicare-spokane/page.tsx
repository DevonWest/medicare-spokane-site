import LocalMedicarePage, { getLocalMedicareMetadata } from "@/components/LocalMedicarePage";

export const metadata = getLocalMedicareMetadata("spokane");

export default function MedicareSpokanePage() {
  return <LocalMedicarePage citySlug="spokane" />;
}
