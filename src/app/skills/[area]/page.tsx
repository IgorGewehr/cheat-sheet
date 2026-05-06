import { notFound } from "next/navigation";
import { getAllCards } from "@/lib/content";
import { getArea, SKILL_AREAS } from "@/lib/skill-trees";
import { AreaClient } from "./area-client";

export async function generateStaticParams() {
  return SKILL_AREAS.map((a) => ({ area: a.id }));
}

interface PageProps {
  params: Promise<{ area: string }>;
}

export default async function AreaPage({ params }: PageProps) {
  const { area: areaId } = await params;
  const area = getArea(areaId);
  if (!area) notFound();

  const cards = getAllCards().map(({ slug, title, category, excerpt, tags, stack }) => ({
    slug,
    title,
    category,
    excerpt,
    tags: tags ?? [],
    stack: stack ?? [],
  }));

  return <AreaClient area={area} cards={cards} />;
}

export function generateMetadata({ params }: { params: Promise<{ area: string }> }) {
  return { title: "Skill Tree" };
}
