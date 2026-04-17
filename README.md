# soul.md

> **Your identity, not theirs.** One file, every AI.

`soul.md` is an open format for your AI identity — values, voice, skills, taste. A plaintext file you own, version in git, and carry between tools. **Manoma** is the reference MCP server that makes any LLM read your soul.md.

- **User-owned** — lives on your machine, in your repo. No cloud, no account, no vendor.
- **Portable** — works with Claude Desktop, Cursor, Zed, and any MCP-aware client.
- **Built to outlive models** — git-diffable, forkable, versioned. A format, not a walled garden.

See the [soul.md format specification](SPEC.md).

---

## Install

One line in your Claude Desktop, Cursor, or Zed config:

```json
{
  "mcpServers": {
    "manoma": {
      "command": "npx",
      "args": ["-y", "manoma-mcp"]
    }
  }
}
```

Then drop your soul.md at `~/soul.md`.

Don't have a soul.md yet? Three options:

- **Web onboarding** — visit [manoma.dev/build](https://manoma.dev/build), fill the form, download the file.
- **Template** — `cp templates/founder.md ~/soul.md` (also: `engineer.md`, `designer.md`, `pm.md`) and edit in your editor.
- **Blank** — start from `soul.md` at the repo root.

---

## What the MCP server does

Once installed, any MCP-aware assistant gets structured access to your identity:

**Read tools**

| Tool                                 | Purpose                                                               |
|--------------------------------------|-----------------------------------------------------------------------|
| `get_context(mode?)`                 | All sections routed to the given mode (work/personal/creative/learning). |
| `get_injection(mode?, message?)`     | Smart, token-budgeted injection with the full algorithm (keyword triggers, skill matching, voice dials, priority truncation). |
| `get_skill_depth(skill)`             | Full domain block — approach, heuristics, anti-patterns, edge.        |
| `list_sections()`                    | Tree of all sections with metadata.                                   |

**Write-back tools** (the assistant keeps your soul.md alive)

| Tool                                 | Purpose                                                               |
|--------------------------------------|-----------------------------------------------------------------------|
| `add_decision(decision, context?)`   | Append a timestamped entry to `/memory/decisions`.                    |
| `add_lesson(lesson)`                 | Append to `/memory/lessons`.                                          |
| `update_now(priorities, deadlines?)` | Refresh `/now` with current priorities.                               |

Resources expose every section as `soul://section/<path>`, plus `soul://full` for the whole file.

---

## Repo structure

```
manoma/
├── packages/
│   ├── core/     — parser + injector (zero-dep, shared)
│   ├── mcp/      — MCP server (npx manoma-mcp)
│   └── web/      — landing page + onboarding (Next.js)
├── templates/    — starter soul.md files (founder, engineer, designer, pm)
├── soul.md       — blank schema (v1.4)
├── SPEC.md       — format specification
└── README.md
```

## Scripts

| Command                  | Description                                  |
|--------------------------|----------------------------------------------|
| `npx manoma-mcp`         | Start the MCP server (stdio transport)       |
| `npm test`               | Run parser + injector + MCP tests            |
| `npm run dev`            | Run the web onboarding locally (Next.js)     |
| `npm run build:mcp`      | Build the MCP server                         |

## Env

| Variable        | Default       | Description                        |
|-----------------|---------------|------------------------------------|
| `SOUL_MD_PATH`  | `~/soul.md`   | Path to your soul.md               |

---

## How injection works

The MCP server's `get_injection` tool runs a three-tier algorithm:

**Always inject** — your core identity (~1400 tokens):

- `/identity` — who you are, how you think
- `/values` — your decision-making principles and tradeoffs
- `/voice` — TARS-style personality dials, converted to behavioral instructions
- `/skills.summary` — compact index of your expertise domains
- `/intuition` — pattern recognition, emotional intelligence, taste
- `/writing` — your voice, samples, pet peeves
- `/tools` — your stack
- `/preferences` — output formatting

**By mode** — context that depends on which mode you're in:

- `/now` — current priorities, projects, deadlines (work mode)
- `/memory/positions` — strong opinions (work, creative, learning)
- `/modes/*` — mode-specific block

**On trigger** — loads when your message matches keywords:

- `/skills/domain/*` — full craft depth when topic matches domain keywords
- `/memory/decisions` — when you mention "decide", "choose", "strategy"
- `/memory/lessons` — when you mention "mistake", "learned", "last time"
- `/people` — when you mention a person's name

### Skill-aware behavior

The injector matches keywords in your message against your skill domains:

- **Expert domain** → AI skips basics, goes deep, uses jargon, challenges you
- **Working knowledge** → AI explains when needed, doesn't assume mastery
- **Building toward** → AI teaches, uses analogies from your known domains
- **Not in skills** → AI asks about your experience level first

### Token budget

~2500 tokens total per injection. Core identity gets ~1600. Triggered content shares ~900. Low-priority sections are truncated first. Your personality and expertise are never cut.

Full details in [SPEC.md](SPEC.md).

---

## Philosophy

Every AI vendor wants to own your memory. `soul.md` is the opposite bet: your identity as a plaintext file you control, interchangeable between tools, diff-able in git, and outliving any individual model.

The schema is the thing. The runtime is just how it's read.

Contributions, forks, and parallel implementations welcome.
