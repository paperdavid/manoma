"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const STEPS = [
  "Welcome",
  "Identity",
  "How you think",
  "Values",
  "Voice",
  "Skills",
  "Download",
];

const VOICE_DIALS = [
  { key: "humor", label: "Humor", low: "Professional", high: "Witty" },
  { key: "sarcasm", label: "Sarcasm", low: "Earnest", high: "Ironic" },
  { key: "directness", label: "Directness", low: "Diplomatic", high: "No sugarcoating" },
  { key: "patience", label: "Patience", low: "Cuts to answer", high: "Explains step by step" },
  { key: "formality", label: "Formality", low: "Friend-like", high: "Formal" },
  { key: "creativity", label: "Creativity", low: "Conventional", high: "Wild ideas" },
  { key: "challenge", label: "Challenge", low: "Supportive", high: "Pushes back" },
  { key: "warmth", label: "Warmth", low: "Transactional", high: "Caring" },
  { key: "confidence", label: "Confidence", low: "Hedges", high: "States opinions" },
  { key: "verbosity", label: "Verbosity", low: "Concise", high: "Detailed" },
] as const;

type SoulData = {
  template: string | null;
  identity: {
    name: string;
    role: string;
    company: string;
    one_liner: string;
    timezone: string;
    languages: string;
  };
  how_i_think: {
    thinking_mode: string;
    decision_style: string;
    risk_tolerance: string;
    blind_spots: string;
  };
  values: {
    core_principles: string[];
    speed_vs_quality: string;
    growth_vs_profit: string;
    team_vs_outcome: string;
    non_negotiables: string[];
    definition_of_success: string;
  };
  voice: Record<string, number | string>;
  skills: {
    domains: { name: string; level: string; years: string; keywords: string }[];
    working_knowledge: { skill: string; context: string }[];
    building_toward: { skill: string; context: string }[];
  };
};

const DEFAULT_DATA: SoulData = {
  template: null,
  identity: {
    name: "",
    role: "",
    company: "",
    one_liner: "",
    timezone: "",
    languages: "",
  },
  how_i_think: {
    thinking_mode: "",
    decision_style: "",
    risk_tolerance: "",
    blind_spots: "",
  },
  values: {
    core_principles: ["", "", ""],
    speed_vs_quality: "",
    growth_vs_profit: "",
    team_vs_outcome: "",
    non_negotiables: ["", ""],
    definition_of_success: "",
  },
  voice: {
    ai_personality: "",
    humor: 50,
    sarcasm: 30,
    directness: 70,
    patience: 50,
    formality: 30,
    creativity: 50,
    challenge: 60,
    warmth: 50,
    confidence: 70,
    verbosity: 40,
  },
  skills: {
    domains: [
      { name: "", level: "competent", years: "", keywords: "" },
      { name: "", level: "competent", years: "", keywords: "" },
    ],
    working_knowledge: [{ skill: "", context: "" }],
    building_toward: [{ skill: "", context: "" }],
  },
};

function generateSoulMd(data: SoulData): string {
  const date = new Date().toISOString().split("T")[0];

  const identityYaml = `name: ${data.identity.name || "{{NAME}}"}
role: ${data.identity.role || "{{ROLE}}"}
company: ${data.identity.company || "{{COMPANY}}"}
one_liner: ${data.identity.one_liner || "{{ONE_LINER}}"}
timezone: ${data.identity.timezone || "{{TIMEZONE}}"}
languages: ${data.identity.languages || "{{LANGUAGES}}"}`;

  const howIThinkYaml = `thinking_mode: ${data.how_i_think.thinking_mode || "{{e.g. first principles, pattern matcher}}"}
decision_style: ${data.how_i_think.decision_style || "{{e.g. fast for reversible, slow for irreversible}}"}
risk_tolerance: ${data.how_i_think.risk_tolerance || "{{e.g. high for experiments, conservative for money}}"}
blind_spots: ${data.how_i_think.blind_spots || "{{e.g. I over-optimize and ship late}}"}`;

  const principles = data.values.core_principles
    .filter(Boolean)
    .map((p) => `- ${p}`)
    .join("\n") || "- \n- \n- ";
  const nonNeg = data.values.non_negotiables
    .filter(Boolean)
    .map((n) => `- ${n}`)
    .join("\n") || "- \n- ";

  const voiceYaml = VOICE_DIALS.map(
    (d) => `${d.key.padEnd(12)} ${data.voice[d.key] ?? 50}/100`
  ).join("\n");

  const domainsYaml =
    data.skills.domains
      .filter((d) => d.name)
      .map(
        (d) =>
          `  - name: ${d.name}
    level: ${d.level}
    years: ${d.years}
    keywords: ${d.keywords}`
      )
      .join("\n\n") ||
    `  - name: 
    level: competent
    years: 
    keywords: `;
  const workingYaml =
    data.skills.working_knowledge
      .filter((w) => w.skill)
      .map(
        (w) =>
          `  - skill: ${w.skill}
    context: ${w.context}`
      )
      .join("\n\n") || `  - skill: 
    context: `;
  const buildingYaml =
    data.skills.building_toward
      .filter((b) => b.skill)
      .map(
        (b) =>
          `  - skill: ${b.skill}
    context: ${b.context}`
      )
      .join("\n\n") || `  - skill: 
    context: `;

  return `# soul.md
> Your portable AI context layer. One file that makes any LLM yours.
> Format: soul.md v1.4 | Last updated: ${date}

---

## /config

\`\`\`yaml
version: 1.4
created: ${date}
last_updated: ${date}
default_mode: work
active_mode: work
\`\`\`

### mode_routing

\`\`\`yaml
work:     [identity, values, voice, skills.summary, intuition, writing, now, memory.decisions, memory.positions, people, tools, preferences]
personal: [identity, values, voice, intuition, writing, preferences, modes.personal]
creative: [identity, values, voice, skills.summary, intuition, writing, preferences, modes.creative, memory.positions]
learning: [identity, values, voice, skills.summary, intuition, preferences, modes.learning, memory.positions, memory.lessons]
\`\`\`

---

## /identity

\`\`\`yaml
${identityYaml}
\`\`\`

### how_i_think

\`\`\`yaml
${howIThinkYaml}
\`\`\`

---

## /values

### core_principles

${principles}

### when_values_conflict

\`\`\`yaml
speed_vs_quality: ${data.values.speed_vs_quality || "# e.g. speed, unless customer-facing"}
growth_vs_profit: ${data.values.growth_vs_profit || "# e.g. profit first, bootstrapped mindset"}
team_vs_outcome: ${data.values.team_vs_outcome || "# e.g. protect people over hitting a number"}
\`\`\`

### non_negotiables

${nonNeg}

### definition_of_success

\`\`\`
${data.values.definition_of_success || "{{What does winning look like for you?}}"}

\`\`\`

---

## /voice

### personality_dials

\`\`\`yaml
${voiceYaml}
\`\`\`

### ai_personality

\`\`\`
${data.voice.ai_personality || "{{In plain words, who is your AI?}}"}

\`\`\`

---

## /skills

### skills.summary

\`\`\`yaml
domains:
${domainsYaml}

working_knowledge:
${workingYaml}

building_toward:
${buildingYaml}
\`\`\`

---

## /intuition

### pattern_recognition
- 
- 

### emotional_intelligence
- 

### under_pressure
\`\`\`yaml
strengths: 
weaknesses: 
recovery: 
\`\`\`

---

## /writing

\`\`\`yaml
style: 
email_tone: 
slack_tone: 
\`\`\`

### pet_peeves
- 
- 

---

## /now

### top_priorities
1. 
2. 
3. 

### current_deadlines
- ${date} — 

### projects
#### project: {{NAME}}
\`\`\`yaml
status: active
goal: 
deadline: 
next_action: 
\`\`\`

---

## /preferences

### response_style
\`\`\`yaml
length: concise unless I ask for more
formatting: minimal markdown
code_style: clean, commented
\`\`\`

### always_do
- 

### never_do
- 
`;
}

function mergeParsedIntoSoulData(parsed: {
  identity: SoulData["identity"];
  how_i_think: SoulData["how_i_think"];
  values: Partial<SoulData["values"]> & {
    core_principles?: string[];
    non_negotiables?: string[];
  };
  voice: SoulData["voice"];
  skills: SoulData["skills"];
}): SoulData {
  const d = { ...DEFAULT_DATA };
  d.identity = { ...d.identity, ...parsed.identity };
  d.how_i_think = { ...d.how_i_think, ...parsed.how_i_think };
  const cp = parsed.values.core_principles ?? [];
  const nn = parsed.values.non_negotiables ?? [];
  d.values = {
    ...d.values,
    ...parsed.values,
    core_principles:
      cp.length > 0 ? [...cp, "", "", ""].slice(0, Math.max(3, cp.length)) : d.values.core_principles,
    non_negotiables:
      nn.length > 0 ? [...nn, ""].slice(0, Math.max(2, nn.length)) : d.values.non_negotiables,
  };
  d.voice = { ...d.voice, ...parsed.voice };
  const domains = parsed.skills.domains ?? [];
  const wk = parsed.skills.working_knowledge ?? [];
  const bt = parsed.skills.building_toward ?? [];
  d.skills = {
    domains: domains.length >= 2 ? domains : domains.length > 0 ? [...domains, { name: "", level: "competent", years: "", keywords: "" }] : d.skills.domains,
    working_knowledge: wk.length > 0 ? wk : d.skills.working_knowledge,
    building_toward: bt.length > 0 ? bt : d.skills.building_toward,
  };
  return d;
}

export function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateSlug = searchParams.get("template");
  const [step, setStep] = useState(0);
  const [data, setData] = useState<SoulData>(DEFAULT_DATA);
  const [loadingTemplate, setLoadingTemplate] = useState(!!templateSlug);

  useEffect(() => {
    if (!templateSlug) return;
    fetch(`/api/templates/${templateSlug}/parsed`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Failed to load template"))))
      .then((parsed) => {
        const merged = mergeParsedIntoSoulData(parsed);
        merged.template = templateSlug;
        setData(merged);
        setStep(1);
      })
      .catch(() => setLoadingTemplate(false))
      .finally(() => setLoadingTemplate(false));
  }, [templateSlug]);

  const update = <K extends keyof SoulData>(key: K, value: SoulData[K]) => {
    setData((d) => ({ ...d, [key]: value }));
  };

  const updateIdentity = (k: keyof SoulData["identity"], v: string) => {
    setData((d) => ({
      ...d,
      identity: { ...d.identity, [k]: v },
    }));
  };

  const updateHowIThink = (k: keyof SoulData["how_i_think"], v: string) => {
    setData((d) => ({
      ...d,
      how_i_think: { ...d.how_i_think, [k]: v },
    }));
  };

  const updateValues = (k: keyof SoulData["values"], v: SoulData["values"][typeof k]) => {
    setData((d) => ({ ...d, values: { ...d.values, [k]: v } }));
  };

  const updatePrinciple = (i: number, v: string) => {
    const arr = [...data.values.core_principles];
    arr[i] = v;
    updateValues("core_principles", arr);
  };

  const updateNonNeg = (i: number, v: string) => {
    const arr = [...data.values.non_negotiables];
    arr[i] = v;
    updateValues("non_negotiables", arr);
  };

  const updateVoice = (k: string, v: number | string) => {
    setData((d) => ({
      ...d,
      voice: { ...d.voice, [k]: v },
    }));
  };

  const updateSkillDomain = (
    i: number,
    k: keyof SoulData["skills"]["domains"][0],
    v: string
  ) => {
    const arr = [...data.skills.domains];
    arr[i] = { ...arr[i], [k]: v };
    setData((d) => ({
      ...d,
      skills: { ...d.skills, domains: arr },
    }));
  };

  const addDomain = () => {
    setData((d) => ({
      ...d,
      skills: {
        ...d.skills,
        domains: [
          ...d.skills.domains,
          { name: "", level: "competent", years: "", keywords: "" },
        ],
      },
    }));
  };

  const goToTemplate = (slug: string) => {
    router.push(`/templates/${slug}`);
  };

  const downloadSoul = () => {
    const content = generateSoulMd(data);
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "soul.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  if (loadingTemplate) {
    return (
      <div>
        <p className="text-sm text-muted">Loading template…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <div className="progress-track h-1 w-full">
          <div
            className="progress-fill h-full"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <p className="mt-1.5 text-sm text-muted">
          Step {step + 1} of {STEPS.length}
        </p>
      </div>

      {step === 0 && (
        <div className="space-y-8">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">
              Build your soul
            </h1>
            <p className="mt-2 text-base leading-relaxed text-muted">
              A guided flow to create your soul.md. Start from a template or
              build from scratch.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted">
              Start from a template
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {["founder", "engineer", "designer", "pm"].map((slug) => (
                <button
                  key={slug}
                  onClick={() => goToTemplate(slug)}
                  className="flex items-center justify-between rounded border border-border bg-surface px-3 py-2 text-left text-sm transition hover:border-fg"
                >
                  <span className="capitalize text-fg">{slug}.md</span>
                  <span className="text-xs text-muted">Use template →</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <h2 className="text-sm font-medium text-muted">
              Or build from scratch
            </h2>
            <button
              onClick={() => {
                update("template", null);
                next();
              }}
              className="mt-2 rounded border border-fg px-3 py-2 text-sm text-fg transition hover:bg-surface-elevated"
            >
              Start blank →
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-fg sm:text-xl">
              Identity
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Who you are. This shapes how the AI addresses you and understands
              your context.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { key: "name", label: "Name", placeholder: "Alex Chen" },
              { key: "role", label: "Role", placeholder: "founder, senior PM, designer" },
              { key: "company", label: "Company", placeholder: "Acme Inc or independent" },
              { key: "one_liner", label: "One-liner", placeholder: "How you'd introduce yourself in ~10 words" },
              { key: "timezone", label: "Timezone", placeholder: "US/Pacific" },
              { key: "languages", label: "Languages", placeholder: "English, Spanish" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="mb-1 block text-sm text-muted">{label}</label>
                <input
                  type="text"
                  value={data.identity[key as keyof SoulData["identity"]]}
                  onChange={(e) => updateIdentity(key as keyof SoulData["identity"], e.target.value)}
                  placeholder={placeholder}
                  className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-fg placeholder-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-fg sm:text-xl">
              How you think
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Your mental model. Helps the AI reason in your style.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { key: "thinking_mode", label: "Thinking mode", placeholder: "first principles, pattern matcher, gut + validate" },
              { key: "decision_style", label: "Decision style", placeholder: "fast for reversible, slow for irreversible" },
              { key: "risk_tolerance", label: "Risk tolerance", placeholder: "high for experiments, conservative for money" },
              { key: "blind_spots", label: "Blind spots", placeholder: "I over-optimize and ship late" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="mb-1 block text-sm text-muted">{label}</label>
                <input
                  type="text"
                  value={data.how_i_think[key as keyof SoulData["how_i_think"]]}
                  onChange={(e) => updateHowIThink(key as keyof SoulData["how_i_think"], e.target.value)}
                  placeholder={placeholder}
                  className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-fg placeholder-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-fg sm:text-xl">
              Values
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Your ACTUAL decision-making principles. Not aspirational.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-muted">
                Core principles (3–5)
              </label>
              {data.values.core_principles.map((p, i) => (
                <input
                  key={i}
                  type="text"
                  value={p}
                  onChange={(e) => updatePrinciple(i, e.target.value)}
                  placeholder="e.g. Ship ugly and learn > polish in the dark"
                  className="mb-1.5 w-full rounded border border-border bg-surface px-3 py-2 text-sm text-fg placeholder-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              ))}
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">
                When values conflict
              </label>
              <div className="space-y-2">
                {[
                  { key: "speed_vs_quality", placeholder: "speed, unless customer-facing" },
                  { key: "growth_vs_profit", placeholder: "profit first, bootstrapped mindset" },
                  { key: "team_vs_outcome", placeholder: "protect people over hitting a number" },
                ].map(({ key, placeholder }) => (
                  <input
                    key={key}
                    type="text"
                    value={data.values[key as keyof typeof data.values] as string}
                    onChange={(e) => updateValues(key as keyof SoulData["values"], e.target.value)}
                    placeholder={placeholder}
                    className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-fg placeholder-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">
                Non-negotiables (lines you don&apos;t cross)
              </label>
              {data.values.non_negotiables.map((n, i) => (
                <input
                  key={i}
                  type="text"
                  value={n}
                  onChange={(e) => updateNonNeg(i, e.target.value)}
                  placeholder="e.g. Never mislead a customer"
                  className="mb-1.5 w-full rounded border border-border bg-surface px-3 py-2 text-sm text-fg placeholder-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              ))}
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">
                Definition of success
              </label>
              <textarea
                value={data.values.definition_of_success}
                onChange={(e) => updateValues("definition_of_success", e.target.value)}
                placeholder="What does winning look like for you? Personal, not generic."
                rows={2}
                className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-fg placeholder-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-fg sm:text-xl">
              Voice
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Tune how your AI sounds. 0 = none, 100 = maximum.
            </p>
          </div>
          <div className="space-y-4">
            {VOICE_DIALS.map(({ key, label, low, high }) => (
              <div key={key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-fg">{label}</span>
                  <span className="text-muted">
                    {low} ← {data.voice[key] ?? 50} → {high}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={data.voice[key] ?? 50}
                  onChange={(e) => updateVoice(key, parseInt(e.target.value, 10))}
                  className="range-accent h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border"
                />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-sm text-muted">
                AI personality (in plain words)
              </label>
              <textarea
                value={data.voice.ai_personality}
                onChange={(e) => updateVoice("ai_personality", e.target.value)}
                placeholder="e.g. A sharp cofounder who's been through it. Direct but kind."
                rows={2}
                className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-fg placeholder-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-fg sm:text-xl">
              Skills
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Your expertise domains. Not a resume — how you think about your
              craft.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-sm text-muted">Domains</label>
                <button
                  type="button"
                  onClick={addDomain}
                  className="text-xs text-fg hover:underline"
                >
                  + Add domain
                </button>
              </div>
              {data.skills.domains.map((d, i) => (
                <div
                  key={i}
                  className="mb-3 rounded border border-border p-3"
                >
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      type="text"
                      value={d.name}
                      onChange={(e) => updateSkillDomain(i, "name", e.target.value)}
                      placeholder="e.g. backend engineering"
                      className="rounded border border-border bg-surface px-2 py-1.5 text-sm text-fg placeholder-muted"
                    />
                    <select
                      value={d.level}
                      onChange={(e) => updateSkillDomain(i, "level", e.target.value)}
                      className="rounded border border-border bg-surface px-2 py-1.5 text-sm text-fg"
                    >
                      <option value="learning">Learning</option>
                      <option value="competent">Competent</option>
                      <option value="senior">Senior</option>
                      <option value="expert">Expert</option>
                    </select>
                    <input
                      type="text"
                      value={d.years}
                      onChange={(e) => updateSkillDomain(i, "years", e.target.value)}
                      placeholder="Years"
                      className="rounded border border-border bg-surface px-2 py-1.5 text-sm text-fg placeholder-muted"
                    />
                    <input
                      type="text"
                      value={d.keywords}
                      onChange={(e) => updateSkillDomain(i, "keywords", e.target.value)}
                      placeholder="Keywords: python, APIs, databases"
                      className="rounded border border-border bg-surface px-2 py-1.5 text-sm text-fg placeholder-muted sm:col-span-2"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">
                Working knowledge
              </label>
              {data.skills.working_knowledge.map((w, i) => (
                <div key={i} className="mb-2 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={w.skill}
                    onChange={(e) => {
                      const arr = [...data.skills.working_knowledge];
                      arr[i] = { ...arr[i], skill: e.target.value };
                      setData((d) => ({ ...d, skills: { ...d.skills, working_knowledge: arr } }));
                    }}
                    placeholder="e.g. frontend development"
                    className="flex-1 rounded border border-border bg-surface px-3 py-2 text-sm text-fg placeholder-muted"
                  />
                  <input
                    type="text"
                    value={w.context}
                    onChange={(e) => {
                      const arr = [...data.skills.working_knowledge];
                      arr[i] = { ...arr[i], context: e.target.value };
                      setData((d) => ({ ...d, skills: { ...d.skills, working_knowledge: arr } }));
                    }}
                    placeholder="context"
                    className="flex-1 rounded border border-border bg-surface px-3 py-2 text-sm text-fg placeholder-muted"
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted">
                Building toward
              </label>
              {data.skills.building_toward.map((b, i) => (
                <div key={i} className="mb-2 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={b.skill}
                    onChange={(e) => {
                      const arr = [...data.skills.building_toward];
                      arr[i] = { ...arr[i], skill: e.target.value };
                      setData((d) => ({ ...d, skills: { ...d.skills, building_toward: arr } }));
                    }}
                    placeholder="e.g. Rust"
                    className="flex-1 rounded border border-border bg-surface px-3 py-2 text-sm text-fg placeholder-muted"
                  />
                  <input
                    type="text"
                    value={b.context}
                    onChange={(e) => {
                      const arr = [...data.skills.building_toward];
                      arr[i] = { ...arr[i], context: e.target.value };
                      setData((d) => ({ ...d, skills: { ...d.skills, building_toward: arr } }));
                    }}
                    placeholder="context"
                    className="flex-1 rounded border border-border bg-surface px-3 py-2 text-sm text-fg placeholder-muted"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-4">
          <div>
            <h1 className="text-lg font-semibold text-fg">
              Your soul is ready
            </h1>
            <p className="mt-1 text-sm text-muted">
              Download soul.md below. The simplest way to use it: copy the
              contents into your AI tool&apos;s custom instructions field
              (ChatGPT Custom Instructions, Claude Projects, Cursor Rules,
              Gemini Gems). For smart injection and write-back across clients,
              see the{" "}
              <a href="/docs" className="underline decoration-border underline-offset-4 hover:decoration-fg">
                MCP server install docs
              </a>
              .
            </p>
          </div>
          <div className="rounded border border-border p-4">
            <p className="text-sm text-muted">
              If you started from a template, we&apos;ve merged your inputs with
              the template structure. You can edit soul.md in any text editor
              after downloading.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={downloadSoul}
              className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-on-accent transition hover:opacity-80"
            >
              Download soul.md
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-medium text-fg transition hover:border-fg"
            >
              Back to home
            </Link>
          </div>
        </div>
      )}

      {step < 6 && (
        <div className="mt-8 flex justify-between">
          <button
            onClick={prev}
            disabled={step === 0}
            className="rounded-full border border-border px-3 py-2 text-xs font-medium text-fg transition hover:border-fg disabled:opacity-40"
          >
            Back
          </button>
          <button
            onClick={next}
            className="rounded-full bg-accent px-3 py-2 text-xs font-medium text-on-accent transition hover:opacity-80"
          >
            {step === 5 ? "Review & download" : "Continue"}
          </button>
        </div>
      )}
    </div>
  );
}
