# soul.md

> **Your identity, not theirs.** One file, every AI.

`soul.md` is an open format for your AI identity — values, voice, skills, taste. A plaintext file you own, version in git, and carry between tools. **Manoma** is the reference MCP server that makes any LLM read your soul.md.

- **User-owned** — lives on your machine, in your repo. No cloud, no account, no vendor.
- **Portable** — works with Claude Desktop, Cursor, Zenflow, and any MCP-aware client.
- **Built to outlive models** — git-diffable, forkable, versioned. A format, not a walled garden.

See the [soul.md format specification](SPEC.md).

---

## Install

One line in your Claude Desktop, Cursor, or Zenflow config:

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

### Get a soul.md

- **Web builder** — [manoma.ai/build](https://manoma.ai/build) — fill the form, download the file.
- **Template** — `cp templates/founder.md ~/soul.md` (also: `engineer.md`, `designer.md`, `pm.md`).

---

## Tools the MCP server exposes

**Read** — `get_context(mode?)`, `get_injection(mode?, message?)`, `get_skill_depth(skill)`, `list_sections()`.

**Write-back** — `add_decision(...)`, `add_lesson(...)`, `update_now(...)`.

Resources expose every section as `soul://section/<path>`, plus `soul://full` for the whole file.

Full details in [mcp/README.md](mcp/README.md) and [SPEC.md](SPEC.md).

---

## Repo

```
manoma/
├── mcp/         — MCP server (npx manoma-mcp)
├── templates/   — starter soul.md files
├── SPEC.md      — format specification
└── README.md
```

---

## Philosophy

Every AI vendor wants to own your memory. `soul.md` is the opposite bet: your identity as a plaintext file you control, interchangeable between tools, diff-able in git, outliving any individual model.

The schema is the thing. The runtime is just how it's read.

Contributions, forks, and parallel implementations welcome.

MIT.
