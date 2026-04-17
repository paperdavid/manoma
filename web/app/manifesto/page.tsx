import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manifesto — Manoma",
  description:
    "Personal AI agents as portable career capital. Why humans with better agents outcompete humans with worse agents.",
};

export default function ManifestoPage() {
  return (
    <div className="space-y-10 sm:space-y-16">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl sm:leading-[1.2]">
          Manifesto
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted max-w-2xl sm:mt-4 sm:text-base">
          Why we're building personal AI agents as portable career capital.
        </p>
      </header>

      <section>
        <h2 className="text-base font-semibold tracking-tight text-fg sm:text-xl">
          The Core Thesis
        </h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-fg sm:text-base">
          Personal Agent as Career Capital
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:mt-4 sm:text-base">
          A personal AI agent is how you amplify and prove your professional value. Not
          &quot;productivity tool.&quot; Career capital.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:mt-4 sm:text-base">
          Today: company hires you and gets you — soul, speed, network, taste.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
          Tomorrow: company hires you and gets you + your agent — trained on how you make
          decisions, what you prioritize, how you communicate, what patterns you recognize.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:mt-4 sm:text-base">
          The human who shows up with a well-trained personal agent is 10x more valuable
          than the human who shows up empty-handed. And 10x more valuable than a
          company&apos;s generic AI, because generic AI has no judgment — it has instructions.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold tracking-tight text-fg sm:text-xl">
          Why companies hire the human and not just the AI
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:mt-4 sm:text-base">
          AI without a human is a median performer with no accountability. It can&apos;t take
          a weird bet based on gut feeling, build trust with a difficult client, say
          &quot;this strategy is wrong&quot; and stake their reputation on it, navigate politics to
          ship something, or know which rules to break and when.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:mt-4 sm:text-base">
          The personal agent doesn&apos;t replace that — it makes human judgment execute at
          machine speed. The human decides, the agent multiplies.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold tracking-tight text-fg sm:text-xl">
          The future
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:mt-4 sm:text-base">
          Not &quot;humans vs. AI for jobs.&quot; It&apos;s humans with better agents outcompeting
          humans with worse agents (or none). Your personal agent becomes like your
          reputation, your network, your portfolio — something you build over years. Not
          transferable. Companies can&apos;t copy it when you leave.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold tracking-tight text-fg sm:text-xl">
          The unsolved tension
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:mt-4 sm:text-base">
          Who owns the agent? If you train it on company data, the company has a claim. If
          you take it with you, you&apos;re taking institutional knowledge. This is the next
          big IP/employment law fight. This only works if the agent is truly personal and
          portable — not locked into Microsoft&apos;s ecosystem or an employer&apos;s Slack
          workspace.
        </p>
      </section>

      <section>
        <p className="text-base font-medium leading-relaxed text-fg sm:text-lg">
          AI coding was wave one. <br />
          AI work management is wave two. <br />
          Wave three is humans building personal AI agents as portable career capital. <br />
          The thing that makes them unhireable-without.
        </p>
      </section>
    </div>
  );
}
