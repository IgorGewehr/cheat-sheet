import { SentinelaClient } from "./sentinela-client";

export const metadata = {
  title: "Sentinela — Brain",
  description: "Auditoria forense adversarial de código gerado por IA.",
};

export default function SentinelaPage() {
  return <SentinelaClient />;
}
