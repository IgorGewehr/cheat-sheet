import { JobsClient } from "./jobs-client";

export const metadata = {
  title: "Job Prep Tracks — Brain",
  description:
    "Trilhas curadas para preparar engenheiros de junior a sênior para vagas reais.",
};

export default function JobsPage() {
  return <JobsClient />;
}
