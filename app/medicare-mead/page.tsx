import LocalMedicarePage, { getLocalMedicareMetadata } from "@/components/LocalMedicarePage";

export const metadata = getLocalMedicareMetadata("mead");

export default function MedicareMeadPage() {
  return <LocalMedicarePage citySlug="mead" />;
}
