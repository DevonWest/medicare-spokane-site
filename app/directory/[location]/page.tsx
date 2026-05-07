import { notFound } from "next/navigation";
import LocalMedicarePage, { getLocalMedicareMetadata } from "@/components/LocalMedicarePage";
import { getAllDirectorySlugs, getCityByDirectorySlug, getDirectoryPath } from "@/lib/cities";

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

  return getLocalMedicareMetadata(city.slug, getDirectoryPath(location));
}

export default async function DirectoryPage({ params }: Props) {
  const { location } = await params;
  const city = getCityByDirectorySlug(location);

  if (!city) {
    notFound();
  }

  return <LocalMedicarePage citySlug={city.slug} canonicalPath={getDirectoryPath(location)} />;
}
