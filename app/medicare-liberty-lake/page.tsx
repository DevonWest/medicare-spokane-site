import LocalMedicarePage, { getLocalMedicareMetadata } from "@/components/LocalMedicarePage";

export const metadata = getLocalMedicareMetadata("liberty-lake");

export default function MedicareLibertyLakePage() {
  return <LocalMedicarePage citySlug="liberty-lake" />;
}
