import LocalMedicarePage, { getLocalMedicareMetadata } from "@/components/LocalMedicarePage";

export const metadata = getLocalMedicareMetadata("cheney");

export default function MedicareCheneyPage() {
  return <LocalMedicarePage citySlug="cheney" />;
}
