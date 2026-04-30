import LocalMedicarePage, { getLocalMedicareMetadata } from "@/components/LocalMedicarePage";

export const metadata = getLocalMedicareMetadata("spokane-valley");

export default function MedicareSpokaneValleyPage() {
  return <LocalMedicarePage citySlug="spokane-valley" />;
}
