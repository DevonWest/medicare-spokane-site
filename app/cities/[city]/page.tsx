import { notFound, permanentRedirect } from "next/navigation";
import { getAllCitySlugs, getCityBySlug, getLocalMedicarePath } from "@/lib/cities";

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateStaticParams() {
  return getAllCitySlugs().map((city) => ({ city }));
}

export default async function CityPageRedirect({ params }: Props) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);

  if (!city) {
    notFound();
  }

  permanentRedirect(getLocalMedicarePath(city.slug));
}
