import LocalMedicarePage, { getLocalMedicareMetadata } from "@/components/LocalMedicarePage";

export const metadata = getLocalMedicareMetadata("airway-heights");

export default function MedicareAirwayHeightsPage() {
  return <LocalMedicarePage citySlug="airway-heights" />;
}
