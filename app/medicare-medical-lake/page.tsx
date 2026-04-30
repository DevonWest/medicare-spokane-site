import LocalMedicarePage, { getLocalMedicareMetadata } from "@/components/LocalMedicarePage";

export const metadata = getLocalMedicareMetadata("medical-lake");

export default function MedicareMedicalLakePage() {
  return <LocalMedicarePage citySlug="medical-lake" />;
}
