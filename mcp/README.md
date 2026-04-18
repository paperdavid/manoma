# manoma-mcp

MCP server for **soul.md** — your portable AI identity layer.

One command. Every LLM knows who you are.

```
npx manoma-mcp
```

---

## What it does

`manoma-mcp` reads your `soul.md` file and serves it over the [Model Context Protocol](https://modelcontextprotocol.io), giving any MCP-compatible client (Claude Desktop, Cursor, Windsurf, etc.) structured access to your identity, skills, values, and preferences.

**Read** — every soul.md section is exposed as a resource. The LLM calls `get_context` to bootstrap who you are, `get_skill_depth` to drill into a domain when needed.

**Write back** — the AI records decisions, captures lessons, and updates your current status as you work. soul.md stays alive without you manually editing it.

```
┌──────────────────────────────────────────────────────┐
│                    MCP Client                        │
│              (Claude, Cursor, Windsurf)              │
└────────────────────────┬─────────────────────────────┘
                         │ stdio
┌────────────────────────┴─────────────────────────────┐
│                   manoma-mcp                         │
│                                                      │
│  Resources                    Tools                  │
│  ─────────                    ─────                  │
│  soul://section/{path}       get_context(mode?)     │
│  soul://full                 get_injection(mode?,   │
│                                 message?)            │
│                               get_skill_depth(skill) │
│                               list_sections()        │
│                               add_decision(...)      │
│                               add_lesson(...)        │
│                               update_now(content)    │
└────────────────────────┬─────────────────────────────┘
                         │ fs read/write
                    ┌────┴────┐
                    │ soul.md│
                    └─────────┘
```

---

## Quick Start

### 1. Add to your MCP client

**Claude Desktop** — edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

**Cursor** — edit `.cursor/mcp.json`:

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

**Custom soul.md path:**

```json
{
  "mcpServers": {
    "manoma": {
      "command": "npx",
      "args": ["-y", "manoma-mcp"],
      "env": {
        "SOUL_MD_PATH": "/path/to/your/soul.md"
      }
    }
  }
}
```

### 2. That's it

On first run, the server auto-creates a starter `soul.md` at `~/soul.md` with placeholders for `/identity`, `/values`, `/voice`, `/skills`, and more. The LLM delivers a one-time welcome message telling you what just happened.

Open `~/soul.md` in your editor and fill in the placeholders — start with `/identity` and `/values`, flesh out the rest as it feels useful. Or just ask the AI: *"help me fill in my soul.md"*.

### 3. Talk to the AI

The LLM now has access to your identity. It can call `get_context` to load your profile, `get_skill_depth` to go deep on a domain, and write-back tools to maintain soul.md as you work.

---

## Resources

| URI | Description |
|-----|-------------|
| `soul://section/{path}` | Any section by path (e.g. `/identity`, `/memory/decisions`, `/skills/skills.summary`) |
| `soul://full` | Complete soul.md file |

## Tools

### Read

| Tool | Purpose |
|------|---------|
| `get_context(mode?)` | Load all sections for a mode (work, personal, creative, learning). Primary bootstrapping call. |
| `get_injection(mode?, message?)` | Build a smart, token-budgeted injection using the full algorithm (keyword triggers, skill matching, voice dials, priority truncation). |
| `get_skill_depth(skill)` | Drill into a specific skill domain with full detail |
| `list_sections()` | Discover all available sections with paths and metadata |

### Write-back

| Tool | Purpose |
|------|---------|
| `add_decision(decision, context?)` | Prepend a timestamped decision to `/memory/decisions` (newest first, keeps last 15) |
| `add_lesson(lesson, source?)` | Prepend a timestamped lesson to `/memory/lessons` (newest first, keeps last 15) |
| `update_now(content)` | Replace the `/now` section with current focus |

Write-back is what makes soul.md a **living document**. The AI captures context as you work — decisions get recorded, lessons accumulate, your `/now` stays current.

---

## Mode Routing

soul.md supports mode-based context routing. Define which sections load for each mode in your config:

```yaml
work:     [identity, values, voice, skills.summary, intuition, writing, now, memory.decisions]
personal: [identity, values, voice, intuition, writing, preferences]
creative: [identity, values, voice, skills.summary, intuition, writing, preferences]
learning: [identity, values, voice, skills.summary, intuition, preferences]
```

When the LLM calls `get_context(mode="work")`, only the listed sections are returned — keeping context focused and token-efficient.

---

## Configuration

The server looks for soul.md in this order:

1. `SOUL_MD_PATH` environment variable
2. `./soul.md` (current directory)
3. `~/soul.md` (home directory)

**Auto-bootstrap:** if the resolved path has no file, the server writes a starter template there on first run (with parent directories created as needed). You can always delete the file and let it recreate, or hand-edit freely — the server never overwrites an existing soul.md.

---

## Storage & sync

Your soul.md is a single plain-text file. How you store it is up to you — a few patterns that work well:

**Private git repo** (recommended)
Keep soul.md in a private repo and symlink it to `~/soul.md`:

```bash
git clone git@github.com:you/soul.git ~/code/soul
ln -s ~/code/soul/soul.md ~/soul.md
```

You get version history, diffs when the AI writes back, and sync across machines with `git pull`. Commit after the AI adds decisions or lessons and you'll see how your identity evolves.

**Cloud-synced folder**
Drop soul.md in iCloud Drive, Dropbox, or Google Drive and point `SOUL_MD_PATH` at it:

```json
"env": { "SOUL_MD_PATH": "/Users/you/Library/Mobile Documents/com~apple~CloudDocs/soul.md" }
```

Zero effort, works across all your devices, no git. Trade-off: no history unless the provider versions it.

**Local only**
Default `~/soul.md` is fine if you only use one machine. Back it up however you back up the rest of your home directory.

**Don't put it in a public repo.** soul.md contains your values, decisions, and personal context. Treat it like a journal.

---

## Development

```bash
git clone https://github.com/paperdavid/manoma
cd manoma
npm install
npm run build
npm start
```

Test with the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

---

## Publishing

### npm

```bash
npm run build
npm publish --access public
```

### MCP Registry

The project includes `server.json` and `mcpName` in `package.json` for [MCP Registry](https://modelcontextprotocol.io/registry/about) compatibility.

```bash
# Install the publisher CLI
curl -L "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_$(uname -s | tr '[:upper:]' '[:lower:]')_$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/').tar.gz" | tar xz mcp-publisher && sudo mv mcp-publisher /usr/local/bin/

# Authenticate and publish
mcp-publisher login github
mcp-publisher publish
```

---

## License

MIT
