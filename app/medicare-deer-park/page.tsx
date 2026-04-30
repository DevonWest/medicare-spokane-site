import LocalMedicarePage, { getLocalMedicareMetadata } from "@/components/LocalMedicarePage";

export const metadata = getLocalMedicareMetadata("deer-park");

export default function MedicareDeerParkPage() {
  return <LocalMedicarePage citySlug="deer-park" />;
}
