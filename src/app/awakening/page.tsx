import { AwakeningClient } from "./awakening-client";

export const metadata = {
  title: "Awakening — Brain",
  description: "Diagnóstico adaptativo: descubra seu nível e receba uma trilha personalizada.",
};

export default function AwakeningPage() {
  return <AwakeningClient />;
}
