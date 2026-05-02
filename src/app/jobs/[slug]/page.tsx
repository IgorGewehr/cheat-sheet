import { notFound } from "next/navigation";
import { JOB_TRACKS } from "@/lib/jobs-tracks";
import { TrackClient } from "./track-client";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return JOB_TRACKS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const track = JOB_TRACKS.find((t) => t.slug === slug);
  if (!track) return {};
  return {
    title: `${track.titulo} — Job Prep Tracks · Brain`,
    description: track.resumo,
  };
}

export default async function TrackPage({ params }: Props) {
  const { slug } = await params;
  const track = JOB_TRACKS.find((t) => t.slug === slug);
  if (!track) notFound();
  return <TrackClient track={track} />;
}
