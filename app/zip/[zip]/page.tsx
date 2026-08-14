import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getLocalMedicareMetadata } from "@/components/LocalMedicarePage";
import { getLocalMedicarePath } from "@/lib/cities";
import { getAllZips, getZipArea } from "@/lib/zips";

interface Props {
  params: Promise<{ zip: string }>;
}

export async function generateStaticParams() {
  return getAllZips().map((zip) => ({ zip }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { zip } = await params;
  const area = getZipArea(zip);

  if (!area) {
    return { title: "Not Found" };
  }

  return getLocalMedicareMetadata(area.citySlug);
}

export default async function ZipPage({ params }: Props) {
  const { zip } = await params;
  const area = getZipArea(zip);

  if (!area) {
    notFound();
  }

  permanentRedirect(getLocalMedicarePath(area.citySlug));
}
