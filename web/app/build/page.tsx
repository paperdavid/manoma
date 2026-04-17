import type { Metadata } from "next";
import { Suspense } from "react";
import { OnboardingFlow } from "../components/OnboardingFlow";

export const metadata: Metadata = {
  title: "Build your soul — Manoma",
  description:
    "A guided flow to create your soul.md. Start from a template or build from scratch.",
};

export default function BuildPage() {
  return (
    <Suspense fallback={<div className="px-6 py-16 text-sm text-muted">Loading…</div>}>
      <OnboardingFlow />
    </Suspense>
  );
}
