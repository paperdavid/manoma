#!/usr/bin/env tsx
/**
 * test.ts — MCP server tests.
 *
 * Verifies that:
 * 1. Parser + injector integration works from TypeScript
 * 2. buildInjection produces correct results
 * 3. file-ops correctly append/replace sections
 * 4. Error cases are handled gracefully
 */

import {
  parseSoulFromString,
  estimateTokens,
  type ParsedSoul,
} from "./src/parser.js";
import { buildInjection, type InjectionResult } from "./src/injector.js";
import {
  findSectionRange,
  appendToSection,
  replaceSection,
} from "./src/file-ops.js";

// ─── Sample soul.md (matches core/test.js) ─────────────────────────────

const SAMPLE_SOUL = `# soul.md
> Format: soul.md v1.4

---

## /config

\`\`\`yaml
version: 1.4
created: 2025-01-15
last_updated: 2025-02-18
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
<!-- meta: priority=high | stability=stable | inject=always | max_tokens=250 -->

\`\`\`yaml
name: Alex Chen
role: founder & CTO
company: Streamline (seed-stage startup)
one_liner: I build tools that make engineering teams less miserable
timezone: US/Pacific
languages: English, Mandarin
\`\`\`

### how_i_think

\`\`\`yaml
thinking_mode: systems thinker, first principles when stuck
decision_style: fast for reversible, deliberate for irreversible
risk_tolerance: high for product bets, conservative for infrastructure
blind_spots: I over-engineer and ship late
\`\`\`

---

## /values
<!-- meta: priority=high | stability=stable | inject=always | max_tokens=350 -->

### core_principles

- Ship ugly and learn > polish in the dark
- A small team with trust beats a big team with process
- Revenue is the only real validation

### when_values_conflict

\`\`\`yaml
speed_vs_quality: speed, unless it's customer-facing or data-handling
growth_vs_profit: profit first. bootstrapped mindset even with funding.
team_vs_outcome: I'll protect people over hitting a number
\`\`\`

### non_negotiables

- Never mislead a customer, even by omission
- Never ship without at least one other person reviewing

---

## /voice
<!-- meta: priority=high | stability=stable | inject=always | max_tokens=250 -->

### personality_dials

\`\`\`yaml
humor:          65/100
sarcasm:        40/100
directness:     85/100
patience:       30/100
formality:      20/100
creativity:     70/100
challenge:      75/100
warmth:         45/100
confidence:     80/100
verbosity:      25/100
\`\`\`

### ai_personality

\`\`\`
A sharp cofounder who's been through it. Direct but not mean.
\`\`\`

### mode_overrides

**creative:**
\`\`\`yaml
creativity: 95, challenge: 20, humor: 60
\`\`\`

**personal:**
\`\`\`yaml
warmth: 80, formality: 10, patience: 70
\`\`\`

---

## /skills
<!-- meta: priority=high | stability=stable | max_tokens=800 -->

### skills.summary
<!-- meta: inject=always | max_tokens=200 -->

\`\`\`yaml
domains:
  - name: backend engineering
    level: expert
    years: 12
    keywords: python, APIs, databases, architecture, scaling, postgres, redis, microservices

  - name: product strategy
    level: senior
    years: 6
    keywords: product, roadmap, prioritization, PMF, GTM, strategy, positioning

  - name: team leadership
    level: senior
    years: 5
    keywords: hiring, management, 1on1, culture, team, org design, performance

working_knowledge:
  - skill: frontend development
    context: can build basic React UIs, not a designer

building_toward:
  - skill: Rust
    context: 2 months in, coming from Python
\`\`\`

---

### domain: backend engineering
<!-- meta: inject=on_trigger | max_tokens=300 -->

\`\`\`yaml
level: expert
years: 12
context: built 3 payment systems, 2 data platforms, 1 startup from scratch
\`\`\`

**my approach:**
- Start with the data model. Everything follows from how the data is shaped.
- Write the API contract before any implementation.

**what good looks like (my taste):**
- Clean APIs > clever code.
- Boring technology for boring problems.

---

### domain: product strategy
<!-- meta: inject=on_trigger | max_tokens=300 -->

\`\`\`yaml
level: senior
years: 6
context: 2 products from 0→1, 1 pivot, 1 failed launch.
\`\`\`

**my approach:**
- Talk to 5 users before writing anything.
- Write the press release before building the feature.

---

### domain: team leadership
<!-- meta: inject=on_trigger | max_tokens=300 -->

\`\`\`yaml
level: senior
years: 5
context: scaled a team from 3 to 18.
\`\`\`

**my approach:**
- Hire slow, fire fast (but kindly).
- Set context and constraints, not tasks.

---

## /intuition
<!-- meta: priority=high | stability=stable | inject=always | max_tokens=300 -->

### pattern_recognition

- I can tell a project is off-track 2 weeks before it shows in metrics
- I notice when someone agrees in a meeting but their body language says no

### emotional_intelligence

- I defuse tension with humor.
- Good at giving hard feedback. Bad at receiving it.

---

## /writing
<!-- meta: priority=high | stability=stable | inject=always | max_tokens=400 -->

\`\`\`yaml
style: direct, short sentences, no jargon, slightly dry humor
email_tone: warm but brief. never more than 5 sentences.
slack_tone: casual. one-liners. emoji-light.
\`\`\`

### pet_peeves

- Corporate jargon ("synergy", "leverage")
- Passive voice in status updates

### voice_samples

**sample_email:**
\`\`\`
Hey Sarah — quick update on the API migration. We're 80% done.
\`\`\`

---

## /now
<!-- meta: priority=high | stability=volatile | inject=by_mode | max_tokens=500 -->

### top_priorities

1. Ship v2 API by end of February
2. Close seed extension round

### current_deadlines

- 2025-02-28 — v2 API launch
- 2025-03-15 — Seed extension close

---

## /memory

### /memory/decisions
<!-- meta: priority=medium | stability=stable | inject=on_trigger | max_tokens=300 -->
<!-- Triggers: "decision", "choose", "tradeoff", "why did we", "strategy" -->

- **2025-02-01** — Chose Postgres over DynamoDB for v2
- **2025-01-15** — Decided to keep monolith for now

### /memory/lessons
<!-- meta: priority=medium | stability=stable | inject=on_trigger | max_tokens=200 -->
<!-- Triggers: "mistake", "learned", "last time", "don't repeat" -->

- Never launch on a Friday. We did it once. Never again.
- When a customer says "it's urgent," always ask what the actual deadline is.

### /memory/positions
<!-- meta: priority=medium | stability=stable | inject=by_mode | max_tokens=200 -->

- Postgres for everything until it can't handle it.
- TypeScript on frontend, Python on backend. No compromises.

---

## /people
<!-- meta: priority=low | stability=stable | inject=on_trigger | max_tokens=300 -->
<!-- Triggers: person's name, "email to", "meeting with" -->

### Jake
\`\`\`yaml
role: senior backend engineer
relationship: first hire, most trusted engineer
style: quiet, thorough, prefers written briefs over meetings
\`\`\`

### Sarah
\`\`\`yaml
role: VP Engineering at key customer (Acme Corp)
relationship: key stakeholder
style: direct, data-driven, appreciates brevity
\`\`\`

### Tom
\`\`\`yaml
role: lead investor (partner at Horizon Ventures)
relationship: board observer, seed lead
style: pattern-matcher, wants to see metrics + narrative
\`\`\`

---

## /tools
<!-- meta: priority=low | stability=stable | inject=always | max_tokens=100 -->

\`\`\`yaml
code: VS Code, Python, TypeScript, Cursor
pm: Linear
comms: Slack, Gmail, Zoom
\`\`\`

---

## /preferences
<!-- meta: priority=medium | stability=stable | inject=always | max_tokens=200 -->

### response_style
\`\`\`yaml
length: concise — 2-3 paragraphs unless I ask for more
formatting: minimal markdown. headers only for long responses. no emoji.
code_style: clean, commented, no over-engineering. Python unless I say otherwise.
\`\`\`

### always_do

- Give me the answer first, then explain if needed
- Tell me when I'm wrong

### never_do

- Don't use corporate jargon
- Don't apologize unnecessarily

---

## /modes
<!-- meta: priority=medium | stability=stable | inject=by_mode | max_tokens=200 -->

### mode: personal

\`\`\`yaml
goals:
  - Run a half marathon by June
  - Read 24 books this year
interests:
  - Mechanical keyboards
  - Japanese whisky
\`\`\`

### mode: creative

\`\`\`yaml
style: push boundaries. weird is good. surprise me.
references: love Dieter Rams, love dense information design
\`\`\`

### mode: learning

\`\`\`yaml
currently_learning:
  - Rust (2 months in, coming from Python)
  - AI/ML engineering (embeddings, fine-tuning)
learning_style: examples first, theory second.
\`\`\`
`;

// ─── Test runner ────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean): void {
  if (condition) {
    console.log(`  \u2713 ${label}`);
    passed++;
  } else {
    console.log(`  \u2717 ${label}`);
    failed++;
  }
}

// ─── Tests ──────────────────────────────────────────────────────────────

console.log("\n  Manoma MCP Test Suite\n");

// ─── 1. Core integration (parse + inject from TypeScript) ───────────────

console.log("  --- Core Integration -----------\n");

const soul: ParsedSoul = parseSoulFromString(SAMPLE_SOUL);

assert("parseSoulFromString works from TS", typeof soul === "object");
assert("sections is a plain object", typeof soul.sections === "object" && !Array.isArray(soul.sections));
assert("has identity section", !!soul.sections.identity);
assert("has values section", !!soul.sections.values);
assert("has voice section", !!soul.sections.voice);
assert("has skills.summary section", !!soul.sections["skills.summary"]);
assert("has memory/decisions section", !!soul.sections["memory/decisions"]);
assert("has memory/lessons section", !!soul.sections["memory/lessons"]);
assert("has people section", !!soul.sections.people);
assert("has tools section", !!soul.sections.tools);
assert("has preferences section", !!soul.sections.preferences);
assert("has now section", !!soul.sections.now);
assert("has modes section", !!soul.sections.modes);
assert("config has mode_routing", Object.keys(soul.config.mode_routing).length >= 4);
assert("skillIndex has domains", soul.skillIndex.domains.length === 3);
assert("personNames extracted", soul.personNames.length >= 3);
assert("estimateTokens works", estimateTokens("hello world") > 0);

// ─── 2. Injection parity tests ─────────────────────────────────────────

console.log("\n  --- Injection Parity -----------\n");

// Basic injection
const basic: InjectionResult = buildInjection({ soul, mode: "work", userMessage: "hello" });
assert("basic injection has text", basic.text.length > 0);
assert("basic injection under budget", basic.totalTokens <= 2500);
assert("includes IDENTITY section", basic.sectionsUsed.includes("IDENTITY"));
assert("includes VALUES section", basic.sectionsUsed.includes("VALUES"));
assert("includes VOICE section", basic.sectionsUsed.includes("VOICE"));
assert("includes SKILLS section", basic.sectionsUsed.includes("SKILLS"));
assert("includes owner name", basic.text.includes("Alex Chen"));
assert("mode is work", basic.mode === "work");

// Skill domain triggering
const apiQ: InjectionResult = buildInjection({ soul, mode: "work", userMessage: "help me design the new API endpoint" });
assert("API keyword triggers backend domain", apiQ.matchedDomains.length > 0);
assert("matched domain is backend", apiQ.matchedDomains.some((d) => d.includes("backend")));
assert("skill depth injected", apiQ.sectionsUsed.some((s) => s.includes("SKILL DEPTH")));
assert("skill behavior hint injected", apiQ.sectionsUsed.some((s) => s.includes("SKILL BEHAVIOR")));
assert("skill behavior calibrates by level", apiQ.text.includes("Calibrate depth by skill level"));

// Product strategy triggering
const prodQ: InjectionResult = buildInjection({ soul, mode: "work", userMessage: "how should we prioritize the roadmap?" });
assert("roadmap triggers product domain", prodQ.matchedDomains.some((d) => d.includes("product")));
assert("product domain has skill behavior", prodQ.sectionsUsed.some((s) => s.includes("SKILL BEHAVIOR")));

// Decision memory triggering
const decisionQ: InjectionResult = buildInjection({ soul, mode: "work", userMessage: "should I choose Postgres or Mongo?" });
assert("choose triggers memory/decisions", decisionQ.triggeredBy.includes("memory/decisions"));
assert("decisions log injected", decisionQ.sectionsUsed.some((s) => s.includes("DECISIONS")));

// Lesson memory triggering
const lessonQ: InjectionResult = buildInjection({ soul, mode: "work", userMessage: "what went wrong last time?" });
assert("last time triggers memory/lessons", lessonQ.triggeredBy.includes("memory/lessons"));

// Person detection
const personQ: InjectionResult = buildInjection({ soul, mode: "work", userMessage: "write an email to Sarah about the migration" });
assert("Sarah detected as mentioned person", personQ.mentionedPeople.includes("sarah"));
assert("person section injected", personQ.sectionsUsed.some((s) => s.includes("SARAH")));

// Voice dials converted
assert("voice instructions in text (directness)", basic.text.toLowerCase().includes("direct") || basic.text.toLowerCase().includes("pad") || basic.text.toLowerCase().includes("say what"));

// Mode switching
const creativeQ: InjectionResult = buildInjection({ soul, mode: "creative", userMessage: "brainstorm ideas" });
assert("creative mode works", creativeQ.mode === "creative");

const learningQ: InjectionResult = buildInjection({ soul, mode: "learning", userMessage: "teach me Rust" });
assert("learning mode works", learningQ.mode === "learning");

// Token budget under heavy load
const heavyQ: InjectionResult = buildInjection({
  soul,
  mode: "work",
  userMessage: "decide on API architecture and write email to Sarah about the database roadmap strategy",
});
assert("heavy query under budget", heavyQ.totalTokens <= 2500);
assert("heavy query has multiple triggers", heavyQ.triggeredBy.length >= 2);

// ─── 3. File-ops tests ─────────────────────────────────────────────────

console.log("\n  --- File Operations ------------\n");

const testDoc = `## /memory

Some intro content.

### /memory/decisions
<!-- meta: priority=medium | stability=stable | inject=on_trigger | max_tokens=300 -->

- **2025-01-01** — Old decision one
- **2025-01-15** — Old decision two

## /now
<!-- meta: priority=high | stability=volatile | inject=by_mode | max_tokens=500 -->

Old now content here.

## /tools
`;

// findSectionRange
const lines = testDoc.split("\n");
const decRange = findSectionRange(lines, "/memory/decisions");
assert("findSectionRange finds /memory/decisions", decRange !== null);
assert("finds correct heading line", decRange !== null && lines[decRange.start].includes("decisions"));

const nowRange = findSectionRange(lines, "/now");
assert("findSectionRange finds /now", nowRange !== null);

const missingRange = findSectionRange(lines, "/nonexistent");
assert("findSectionRange returns null for missing section", missingRange === null);

// appendToSection
const appended = appendToSection(testDoc, "/memory/decisions", "New decision entry");
assert("appendToSection adds new entry", appended.includes("New decision entry"));
assert("appendToSection preserves old entries", appended.includes("Old decision one"));
assert("appendToSection preserves old entries (2)", appended.includes("Old decision two"));
assert("appendToSection adds timestamp", appended.match(/\[\d{4}-\d{2}-\d{2}\] New decision/) !== null);

// appendToSection for missing section (creates it)
const appendedNew = appendToSection(testDoc, "/memory/lessons", "First lesson");
assert("appendToSection creates missing section", appendedNew.includes("/memory/lessons"));
assert("appendToSection adds entry to new section", appendedNew.includes("First lesson"));

// replaceSection
const replaced = replaceSection(testDoc, "/now", "Brand new now content.\nWith multiple lines.");
assert("replaceSection replaces content", replaced.includes("Brand new now content."));
assert("replaceSection preserves heading", replaced.includes("## /now"));
assert("replaceSection removes old content", !replaced.includes("Old now content here"));
assert("replaceSection preserves other sections", replaced.includes("## /tools"));

// replaceSection for missing section (creates it)
const replacedNew = replaceSection(testDoc, "/focus", "New focus content");
assert("replaceSection creates missing section", replacedNew.includes("/focus"));
assert("replaceSection adds content to new section", replacedNew.includes("New focus content"));

// Newest-first ordering: new entry should appear before old entries
const appendedLines = appended.split("\n");
const newIdx = appendedLines.findIndex((l) => l.includes("New decision entry"));
const oldIdx = appendedLines.findIndex((l) => l.includes("Old decision one"));
assert("appendToSection prepends newest first", newIdx < oldIdx);

// Trimming to 15 entries
let manyEntriesDoc = `### /memory/decisions\n<!-- meta: priority=medium -->\n\n`;
for (let i = 1; i <= 16; i++) {
  manyEntriesDoc += `- Entry ${i}\n`;
}
const trimmed = appendToSection(manyEntriesDoc, "/memory/decisions", "Entry 17");
const trimmedEntries = trimmed.split("\n").filter((l) => l.startsWith("- "));
assert("appendToSection trims to MAX_ENTRIES (15)", trimmedEntries.length === 15);
assert("trimmed doc keeps newest entry", trimmed.includes("Entry 17"));

// Section.triggers in injector test
const triggeredSoul = parseSoulFromString(SAMPLE_SOUL);
const triggerDecision = buildInjection({
  soul: triggeredSoul,
  mode: "work",
  userMessage: "we need to decide on a tradeoff here",
});
assert("section.triggers fires for 'tradeoff'", triggerDecision.triggeredBy.includes("memory/decisions"));

// meta.priority: high priority sections always included
assert("high priority sections always injected", basic.sectionsUsed.includes("IDENTITY"));
assert("INTUITION included (always inject)", basic.sectionsUsed.includes("INTUITION"));

// ─── 4. Error handling ─────────────────────────────────────────────────

console.log("\n  --- Error Handling -------------\n");

// Empty soul
const emptySoul = parseSoulFromString("");
assert("empty soul parses without error", typeof emptySoul === "object");
assert("empty soul has no sections", Object.keys(emptySoul.sections).length === 0);

// Minimal soul
const minimalSoul = parseSoulFromString("## /identity\nname: Test User\n");
assert("minimal soul parses", !!minimalSoul.sections.identity);
assert("minimal soul has one section", Object.keys(minimalSoul.sections).length === 1);

// Injection with empty soul
const emptyInjection = buildInjection({ soul: emptySoul, mode: "work", userMessage: "hello" });
assert("injection with empty soul returns text", typeof emptyInjection.text === "string");
assert("injection with empty soul has zero sections used", emptyInjection.sectionsUsed.length === 0);

// Injection with nonexistent mode
const badMode = buildInjection({ soul, mode: "nonexistent_mode", userMessage: "hello" });
assert("nonexistent mode still produces injection", badMode.text.length > 0);
assert("nonexistent mode uses fallback sections", badMode.sectionsUsed.length > 0);

// Injection with empty message
const noMsg = buildInjection({ soul, mode: "work", userMessage: "" });
assert("empty message produces injection", noMsg.text.length > 0);
assert("empty message has no triggers", noMsg.triggeredBy.length === 0);
assert("empty message has no matched domains", noMsg.matchedDomains.length === 0);
assert("empty message has no mentioned people", noMsg.mentionedPeople.length === 0);

// ─── Summary ────────────────────────────────────────────────────────────

console.log(`\n  --- Results --------------------\n`);
console.log(`  ${passed} passed, ${failed} failed`);
console.log();

if (failed > 0) process.exit(1);
