# soul.md — Format Specification

**Version:** 1.4
**Status:** Draft
**Maintainer:** [paperdavid/manoma](https://github.com/paperdavid/manoma)
**License:** CC0 (the format is public-domain; reference implementations are MIT)

---

## Overview

`soul.md` is an open, plaintext, git-friendly format for a person's AI identity. It encodes who someone is, how they think, what they value, what they're good at, and how they want an AI to sound — in a form designed to be read by any LLM runtime.

The goals:

1. **User-owned.** The file lives on the user's machine. Every implementation MUST operate without a network round-trip to parse or consume it.
2. **Portable.** Any tool can read and write `soul.md`. No vendor has privileged access.
3. **Versionable.** Plain markdown + YAML. Diff-able, forkable, reviewable in git.
4. **Selective.** Designed for token-budgeted injection, not dumped wholesale into a prompt.

---

## File structure

A `soul.md` file is a markdown document with top-level sections prefixed by `## /<id>`. Each section MAY contain nested subsections (`### /<sub>`). Each section MAY include an HTML meta comment that configures how it should be injected.

```markdown
## /identity
<!-- meta: priority=high | stability=stable | inject=always | max_tokens=250 -->

```yaml
name: Alex Chen
role: founder
```
```

### Canonical sections (v1.4)

| Section               | Inject tier  | Purpose                                                      |
|-----------------------|--------------|--------------------------------------------------------------|
| `/config`             | —            | Metadata and mode routing.                                   |
| `/identity`           | always       | Name, role, timezone, how you think.                         |
| `/values`             | always       | Core principles, tradeoffs, non-negotiables.                 |
| `/voice`              | always       | TARS-style personality dials (0–100) + free-text.            |
| `/skills`             | mixed        | `.summary` always; `/domain/*` on trigger.                   |
| `/intuition`          | always       | Pattern recognition, taste, under-pressure traits.           |
| `/writing`            | always       | Style, tone per channel, pet peeves, voice samples.          |
| `/now`                | by_mode      | Current priorities, deadlines, open decisions.               |
| `/memory/decisions`   | on_trigger   | Log of choices and reasoning.                                |
| `/memory/lessons`     | on_trigger   | Lessons learned from past mistakes.                          |
| `/memory/positions`   | by_mode      | Strong opinions.                                             |
| `/people`             | on_trigger   | People blocks, triggered by name mention.                    |
| `/tools`              | always       | User's stack.                                                |
| `/preferences`        | always       | Output formatting.                                           |
| `/modes`              | by_mode      | Mode-specific (`personal`, `creative`, `learning`) blocks.   |

Implementations SHOULD tolerate unknown sections (forward-compatible).

---

## Meta directives

Each section MAY carry a meta comment:

```html
<!-- meta: priority=high | stability=stable | inject=always | max_tokens=250 -->
```

| Key          | Values                                 | Meaning                                                  |
|--------------|----------------------------------------|----------------------------------------------------------|
| `priority`   | `high` \| `medium` \| `low`            | Drop order when the token budget is exceeded.            |
| `stability`  | `stable` \| `volatile`                 | Hint that content changes frequently (e.g. `/now`).      |
| `inject`     | `always` \| `by_mode` \| `on_trigger`  | When the section is eligible for injection.              |
| `max_tokens` | integer                                | Soft cap; section is truncated beyond this.              |

Defaults when meta is omitted: `priority=medium`, `stability=stable`, `inject=by_mode`, `max_tokens=200`.

---

## Trigger directives

Any section MAY include a trigger comment with keywords that, when present in the user's message, cause the section to be injected even if its `inject` is `on_trigger`:

```html
<!-- Triggers: "decision", "choose", "tradeoff", "strategy" -->
```

Triggers are case-insensitive substring matches.

---

## Config section

```yaml
## /config

version: 1.4
created: 2025-01-15
last_updated: 2025-02-18
default_mode: work
active_mode: work

### mode_routing

work:     [identity, values, voice, skills.summary, intuition, writing, now, memory.decisions, memory.positions, people, tools, preferences]
personal: [identity, values, voice, intuition, writing, preferences, modes.personal]
creative: [identity, values, voice, skills.summary, intuition, writing, preferences, modes.creative, memory.positions]
learning: [identity, values, voice, skills.summary, intuition, preferences, modes.learning, memory.positions, memory.lessons]
```

- `version` — soul.md schema version (currently `1.4`).
- `default_mode` — mode when the client doesn't specify one.
- `active_mode` — current mode.
- `mode_routing` — map of mode → ordered list of section IDs eligible for injection in that mode. Keys MAY use `.` or `/` separators (`memory.decisions` ≡ `memory/decisions`).

---

## Voice dials (TARS)

Dials are 0–100 integers that encode personality. Canonical dials:

`humor`, `sarcasm`, `directness`, `patience`, `formality`, `creativity`, `challenge`, `warmth`, `confidence`, `verbosity`

Written as `<dial>: <value>/100`. Example:

```yaml
humor: 60/100
directness: 85/100
warmth: 40/100
```

Implementations SHOULD convert dials into behavioral instructions rather than passing numeric values to the model. The reference implementation ([@manoma/core](packages/core/injector.js)) maps each dial value to an English instruction sentence.

Modes MAY override dials:

```markdown
**creative:**
```yaml
creativity: 95
challenge: 20
```
```

---

## Skills

Skills have two forms:

**`skills.summary`** — always injected, compact:

```yaml
domains:
  - name: backend engineering
    level: expert              # learning | competent | senior | expert
    years: 8
    keywords: python, apis, databases, scaling

working_knowledge:
  - skill: frontend
    context: can ship basic UIs
building_toward:
  - skill: rust
    context: 2 months in
```

**`skills.domain.<name>`** — on-trigger, injected when `keywords` match the user's message. Contains:

```markdown
**my approach:** …
**what good looks like:** …
**heuristics:** …
**anti-patterns:** …
**my edge:** …
**current frontier:** …
```

Level rules (implementations SHOULD honor):

| Level               | Behavior                                                 |
|---------------------|----------------------------------------------------------|
| `expert`            | Skip basics, jargon ok, challenge assumptions.           |
| `senior`            | Depth ok; explain edge cases; minimal hand-holding.      |
| `competent`         | Explain when needed.                                     |
| `working_knowledge` | Explain more; link to known domains.                     |
| `building_toward`   | Teach patiently; analogies from known domains.           |
| not listed          | Ask about experience level before answering.             |

---

## Injection algorithm (reference)

1. Determine `mode` (from request header, config `active_mode`, or `default_mode`).
2. Resolve `mode_routing[mode]` → ordered section IDs.
3. Collect **Tier 1 (always)** sections. Never cut.
4. Collect **Tier 2 (by_mode)** sections listed in the mode routing.
5. For the user's message, find:
   - built-in keyword triggers (`email`, `decide`, `mistake`, …);
   - per-section `<!-- Triggers: ... -->` directives;
   - skill domains whose `keywords` match;
   - people names mentioned.
6. Collect **Tier 3 (on_trigger)** matches.
7. Truncate by `max_tokens` per section; drop sections low-to-high priority until under the total budget (default 2500).
8. Emit a single text blob with `=== LABEL ===` delimiters.

Implementations are free to diverge on the budget, the instruction phrasing, and the ordering — but SHOULD preserve the three-tier model and the section-level meta semantics.

---

## Privacy

`soul.md` MAY contain personal information. Implementations MUST:

- Operate locally by default. Any network call involving `soul.md` contents MUST be opt-in and disclosed.
- Never transmit `soul.md` to a server owned by the implementation's author without explicit consent.
- Treat `soul.md` as user property. Implementations that write to the file MUST keep edits localized and diff-friendly.

Implementations SHOULD:

- Warn if `soul.md` is placed in a directory likely to be synced (iCloud, Dropbox) or committed publicly.
- Support encryption-at-rest as an opt-in.

---

## Reference implementations

- [`@manoma/core`](packages/core/) — zero-dep parser + injector (JavaScript).
- [`manoma-mcp`](packages/mcp/) — MCP server exposing `soul.md` as resources and tools.

---

## Versioning

The format follows semver-ish rules:

- **Major** (`2.0`): breaking section removal or meta semantic change.
- **Minor** (`1.5`): new sections, new meta keys, new dials. Additive.
- **Patch** — clarifications, typo fixes in the spec.

Parsers SHOULD read any `1.x` file. Unknown sections and meta keys MUST be ignored, not rejected.

---

## Contributing

The format is intentionally small and opinionated. Changes are discussed as issues on [paperdavid/manoma](https://github.com/paperdavid/manoma). Parallel implementations in other languages are welcome — a Rust, Python, or Go parser that matches this spec is a first-class citizen.

The schema is the thing. The runtime is just how it's read.
