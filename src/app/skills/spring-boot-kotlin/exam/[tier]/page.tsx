import { notFound } from "next/navigation";
import { ExamView } from "./exam-view";
import { getExam } from "@/lib/spring-exam-questions";

export function generateStaticParams() {
  return [{ tier: "1" }, { tier: "3" }, { tier: "5" }];
}

interface PageProps {
  params: Promise<{ tier: string }>;
}

export default async function ExamPage({ params }: PageProps) {
  const { tier: tierStr } = await params;
  const tier = Number(tierStr);
  const exam = getExam(tier);
  if (!exam) notFound();

  return <ExamView exam={exam} />;
}

export function generateMetadata() {
  return { title: "Exame Spring Boot + Kotlin" };
}
