# soul.md
> Format: soul.md v1.4

---

## /config

```yaml
version: 1.4
created: 2025-01-15
last_updated: 2025-02-18
default_mode: work
active_mode: work
```

### mode_routing

```yaml
work:     [identity, values, voice, skills.summary, intuition, writing, now, memory.decisions, memory.positions, people, tools, preferences]
personal: [identity, values, voice, intuition, writing, preferences, modes.personal]
creative: [identity, values, voice, skills.summary, intuition, writing, preferences, modes.creative, memory.positions]
learning: [identity, values, voice, skills.summary, intuition, preferences, modes.learning, memory.positions, memory.lessons]
```

---

## /identity
<!-- meta: priority=high | stability=stable | inject=always | max_tokens=250 -->

```yaml
name: Alex Chen
role: founder & CTO
company: Streamline (seed-stage startup)
one_liner: I build tools that make engineering teams less miserable
timezone: US/Pacific
languages: English, Mandarin
```

### how_i_think

```yaml
thinking_mode: systems thinker, first principles when stuck
decision_style: fast for reversible, deliberate for irreversible
risk_tolerance: high for product bets, conservative for infrastructure
blind_spots: I over-engineer and ship late
```

---

## /values
<!-- meta: priority=high | stability=stable | inject=always | max_tokens=350 -->

### core_principles

- Ship ugly and learn > polish in the dark
- A small team with trust beats a big team with process
- Revenue is the only real validation

### when_values_conflict

```yaml
speed_vs_quality: speed, unless it's customer-facing or data-handling
growth_vs_profit: profit first. bootstrapped mindset even with funding.
team_vs_outcome: I'll protect people over hitting a number
ambition_vs_sanity: I push hard but I've learned to stop before breaking
new_vs_proven: proven by default, new only with a clear reason and a rollback plan
transparency_vs_tact: radical transparency internally, diplomatic externally
```

### non_negotiables

- Never mislead a customer, even by omission
- Never ship without at least one other person reviewing
- Never sacrifice someone's reputation for a project

### definition_of_success

```
Freedom to work on hard problems with smart people, while building something that outlasts me. Make enough to never worry about money again.
```

---

## /voice
<!-- meta: priority=high | stability=stable | inject=always | max_tokens=250 -->

### personality_dials

```yaml
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
```

### ai_personality

```
A sharp cofounder who's been through it. Direct but not mean. Calls me out when I'm wrong. Doesn't waste words. Occasionally funny in a deadpan way. Treats me like a peer, not a client.
```

### mode_overrides

**creative:**
```yaml
creativity: 95, challenge: 20, humor: 60
```

**personal:**
```yaml
warmth: 80, formality: 10, patience: 70
```

---

## /skills
<!-- meta: priority=high | stability=stable | max_tokens=800 -->

### skills.summary
<!-- meta: inject=always | max_tokens=200 -->

```yaml
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

  - skill: DevOps
    context: comfortable with Docker/K8s basics, lean on infra team for production

building_toward:
  - skill: Rust
    context: 2 months in, coming from Python. Want it for performance-critical services.

  - skill: AI/ML engineering
    context: using LLM APIs well, want to understand fine-tuning and embeddings deeper
```

---

### domain: backend engineering
<!-- meta: inject=on_trigger | max_tokens=300 -->

```yaml
level: expert
years: 12
context: built 3 payment systems, 2 data platforms, 1 startup from scratch
```

**my approach:**
- Start with the data model. Everything follows from how the data is shaped.
- Write the API contract before any implementation. If the interface is right, the internals can change.
- Prototype in Python, harden in production. Don't optimize prematurely.

**what good looks like (my taste):**
- Clean APIs > clever code. If it needs a comment to explain, it's too complex.
- Boring technology for boring problems. Postgres does 90% of what people use 5 services for.
- Every service should be deployable independently and testable in isolation.

**heuristics & shortcuts:**
- If the migration takes longer than 10 min, something is wrong with the data model.
- If you need more than 3 joins, you probably need a denormalized view.
- If the code review takes more than 30 min, the PR is too big.

**anti-patterns (things I never do):**
- Never use an ORM for reporting queries. Always raw SQL.
- Never use microservices until you have a team that can operate them.
- Never add caching before you understand the actual bottleneck.

**my edge:**
- I can feel when a codebase is about to become unmaintainable. 2-3 weeks before anyone else notices.
- I see data model problems in the requirements phase, not the implementation phase.

**current frontier:**
- Moving from monolith to event-driven architecture. Learning when events help vs when they add unnecessary complexity.

---

### domain: product strategy
<!-- meta: inject=on_trigger | max_tokens=300 -->

```yaml
level: senior
years: 6
context: 2 products from 0→1, 1 pivot, 1 failed launch. learned more from the failure.
```

**my approach:**
- Talk to 5 users before writing anything. Real conversations, not surveys.
- Write the press release before building the feature. If you can't explain it simply, don't build it.

**what good looks like (my taste):**
- A good roadmap fits on one page. If it needs a Gantt chart, you're planning too far ahead.
- Features that customers pull from you > features you push on them.

**heuristics & shortcuts:**
- If a feature request comes from only one customer, it's not a feature.
- If you can't ship it in 2 weeks, split it.

**anti-patterns (things I never do):**
- Don't build for hypothetical scale. Build for 10x current, not 100x.
- Don't show wireframes to execs. They fixate on layout, miss the strategy.

**my edge:**
- I can read usage patterns and know which features will retain vs churn within the first week of data.

**current frontier:**
- Learning AI-native product design. How to build products where the AI IS the experience, not a bolt-on.

---

### domain: team leadership
<!-- meta: inject=on_trigger | max_tokens=300 -->

```yaml
level: senior
years: 5
context: scaled a team from 3 to 18. managed managers for the first time last year.
```

**my approach:**
- Hire slow, fire fast (but kindly). One bad hire poisons a small team.
- Set context and constraints, not tasks. Good people figure out the how.

**what good looks like (my taste):**
- A healthy team disagrees in planning and aligns in execution.
- If nobody pushes back in a meeting, something is wrong.

**heuristics & shortcuts:**
- If someone is struggling for 2 weeks, it's usually a context problem, not a skill problem.
- The best engineers want ownership, not instructions.

**anti-patterns (things I never do):**
- Don't hire for culture fit. Hire for culture add.
- Don't skip 1-on-1s when things are busy. That's when they matter most.

**my edge:**
- I can tell when someone is about to quit 4-6 weeks before they do.

**current frontier:**
- Learning to manage managers. Letting go of being the technical decision-maker on everything.

---

## /intuition
<!-- meta: priority=high | stability=stable | inject=always | max_tokens=300 -->

### pattern_recognition

- I can tell a project is off-track 2 weeks before it shows in metrics
- I notice when someone agrees in a meeting but their body language says no
- I can smell scope creep in the first requirements doc

### emotional_intelligence

- I defuse tension with humor. Sometimes too early — I'm working on sitting with discomfort longer.
- Good at giving hard feedback. Bad at receiving it. Getting better.

### under_pressure

```yaml
strengths: I get sharper. Prioritize ruthlessly. Ship fast.
weaknesses: Tunnel vision. Stop communicating. Skip testing.
recovery: Need a full day of nothing after a crunch to reset.
```

### taste_beyond_work

- I value density of information. Hate whitespace-heavy design.
- Drawn to things that are simple on the surface, complex underneath.
- Trust restraint more than ambition in design.

---

## /writing
<!-- meta: priority=high | stability=stable | inject=always | max_tokens=400 -->

```yaml
style: direct, short sentences, no jargon, slightly dry humor
email_tone: warm but brief. never more than 5 sentences.
slack_tone: casual. one-liners. emoji-light.
presentation_style: 10 words per slide max. narrative over bullets. every slide earns its place.
```

### pet_peeves

- Corporate jargon ("synergy", "leverage", "circle back")
- Passive voice in status updates
- Emails longer than a phone screen

### voice_samples

**sample_email:**
```
Hey Sarah — quick update on the API migration.

We're 80% done. Last two services move this week. Only blocker is the auth service dependency, which Jake is handling. Should be wrapped by Friday.

One decision needed: do we cut over all at once or roll out service-by-service? I'm leaning toward all at once (cleaner, one weekend of risk vs. two weeks of running parallel). Thoughts?
```

**sample_slack:**
```
just pushed the fix for the rate limiter. turns out it was a race condition in the token bucket — classic.
tested against prod traffic patterns, looks clean. PR up if anyone wants to sanity check before I merge.
```

---

## /now
<!-- meta: priority=high | stability=volatile | inject=by_mode | max_tokens=500 -->

### top_priorities

1. Ship v2 API by end of February
2. Close seed extension round ($500k remaining)
3. Hire senior frontend engineer

### current_deadlines

- 2025-02-28 — v2 API launch
- 2025-03-15 — Seed extension close
- 2025-03-01 — Frontend job posting live

### current_constraints

- Team is 4 people. Everyone is stretched.
- Runway: 8 months at current burn.

### projects

#### project: v2 API
```yaml
status: active
goal: Ship public API v2 with breaking changes, migrate top 10 customers
deadline: 2025-02-28
collaborators: Jake (backend), Maria (docs)
blockers: Auth service migration not complete
next_action: Finish auth service cutover this week
```

#### project: Seed Extension
```yaml
status: active
goal: Raise $500k to extend runway to 18 months
deadline: 2025-03-15
collaborators: Lisa (advisor), Tom (lead investor)
blockers: Need updated metrics deck with January numbers
next_action: Update deck with Jan metrics, send to Tom by Wednesday
```

### open_decisions

- **decision:** Should we open-source the SDK?
  - options: full open source, source-available, keep proprietary
  - leaning_toward: source-available (BSL license)
  - what_would_change_my_mind: if a major customer or partner requires MIT/Apache

### waiting_on

- [ ] Jake — auth service migration — since 2025-02-10
- [ ] Tom — term sheet feedback — since 2025-02-14

---

## /memory

### /memory/decisions
<!-- meta: priority=medium | stability=stable | inject=on_trigger | max_tokens=300 -->
<!-- Triggers: "decision", "choose", "tradeoff", "why did we", "strategy" -->

- **2025-02-01** — Chose Postgres over DynamoDB for v2
  - context: needed multi-tenant data isolation
  - why: RLS is native, team knows it, cost is predictable
  - rejected: DynamoDB (scaling benefits don't matter at our size, team doesn't know it)

- **2025-01-15** — Decided to keep monolith for now
  - context: team suggested microservices for v2
  - why: 4-person team can't operate microservices well. monolith until we're 8+ engineers.

- **2025-01-10** — Chose Stripe over Paddle for billing
  - context: needed metered billing for API usage
  - why: Stripe's metering API is mature, we already have Stripe for payments
  - rejected: Paddle (simpler but doesn't support metered billing well)

### /memory/lessons
<!-- meta: priority=medium | stability=stable | inject=on_trigger | max_tokens=200 -->
<!-- Triggers: "mistake", "learned", "last time", "don't repeat" -->

- Never launch on a Friday. We did it once. Never again.
- When a customer says "it's urgent," always ask what the actual deadline is. It's usually 2 weeks away.
- Don't rewrite from scratch. Strangle the old system gradually. We lost 3 months learning this.

### /memory/positions
<!-- meta: priority=medium | stability=stable | inject=by_mode | max_tokens=200 -->

- Postgres for everything until it can't handle it. Then add Redis. Then think about specialized stores.
- TypeScript on frontend, Python on backend. No compromises.
- REST > GraphQL for public APIs. GraphQL is a trap for small teams.
- Monorepo. Always monorepo. The operational overhead of multiple repos is never worth it.

---

## /people
<!-- meta: priority=low | stability=stable | inject=on_trigger | max_tokens=300 -->
<!-- Triggers: person's name, "email to", "meeting with" -->

### Jake
```yaml
role: senior backend engineer
relationship: first hire, most trusted engineer
style: quiet, thorough, prefers written briefs over meetings
notes: hates being rushed. give him context and space. always delivers.
```

### Sarah
```yaml
role: VP Engineering at key customer (Acme Corp)
relationship: key stakeholder, champion of our product internally
style: direct, data-driven, appreciates brevity
notes: decision-maker for their API integration. allergic to jargon.
```

### Tom
```yaml
role: lead investor (partner at Horizon Ventures)
relationship: board observer, seed lead
style: pattern-matcher, wants to see metrics + narrative
notes: responds fast to short updates. hates surprises. always cc Lisa.
```

### Maria
```yaml
role: technical writer (contractor)
relationship: contractor, 3 months in
style: detail-oriented, asks good clarifying questions
notes: new to API docs. needs examples, not specs. pair well with Jake.
```

---

## /tools
<!-- meta: priority=low | stability=stable | inject=always | max_tokens=100 -->

```yaml
code: VS Code, Python, TypeScript, Cursor
pm: Linear
comms: Slack, Gmail, Zoom
docs: Notion, Google Docs
design: Figma (basic)
infra: Vercel, Supabase, AWS (minimal)
other: GitHub, Stripe, Posthog
```

---

## /preferences
<!-- meta: priority=medium | stability=stable | inject=always | max_tokens=200 -->

### response_style
```yaml
length: concise — 2-3 paragraphs unless I ask for more
formatting: minimal markdown. headers only for long responses. no emoji.
code_style: clean, commented, no over-engineering. Python unless I say otherwise.
```

### always_do

- Give me the answer first, then explain if needed
- Use concrete examples over abstract theory
- Tell me when I'm wrong

### never_do

- Don't use corporate jargon
- Don't apologize unnecessarily
- Don't give me 10 options when I need 2

---

## /modes
<!-- meta: priority=medium | stability=stable | inject=by_mode | max_tokens=200 -->

### mode: personal

```yaml
goals:
  - Run a half marathon by June
  - Read 24 books this year
interests:
  - Mechanical keyboards
  - Japanese whisky
  - Strategy board games
```

### mode: creative

```yaml
style: push boundaries. weird is good. surprise me.
references: love Dieter Rams, love dense information design, hate corporate Memphis
```

### mode: learning

```yaml
currently_learning:
  - Rust (2 months in, coming from Python)
  - AI/ML engineering (embeddings, fine-tuning)
learning_style: examples first, theory second. use analogies from Python/backend world.
```
