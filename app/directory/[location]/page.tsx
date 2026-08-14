import { notFound, permanentRedirect } from "next/navigation";
import { getLocalMedicareMetadata } from "@/components/LocalMedicarePage";
import {
  getAllDirectorySlugs,
  getCityByDirectorySlug,
  getLocalMedicarePath,
} from "@/lib/cities";

interface Props {
  params: Promise<{ location: string }>;
}

export async function generateStaticParams() {
  return getAllDirectorySlugs().map((location) => ({ location }));
}

export async function generateMetadata({ params }: Props) {
  const { location } = await params;
  const city = getCityByDirectorySlug(location);

  if (!city) {
    return { title: "Not Found" };
  }

  return getLocalMedicareMetadata(city.slug);
}

export default async function DirectoryPage({ params }: Props) {
  const { location } = await params;
  const city = getCityByDirectorySlug(location);

  if (!city) {
    notFound();
  }

  permanentRedirect(getLocalMedicarePath(city.slug));
}
