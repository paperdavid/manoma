import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-10 sm:space-y-14">
      <section>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
          soul.md
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-fg sm:text-5xl sm:leading-[1.05]">
          Your identity, not theirs.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          An open format for your AI identity — values, voice, skills, taste.
          One plaintext file you own, version in git, and carry between tools.
          <span className="text-fg"> Manoma</span> is the MCP server that makes
          any LLM read it.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/build"
            className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-medium text-on-accent transition hover:opacity-80"
          >
            Build your soul.md
          </Link>
          <a
            href="https://github.com/paperdavid/manoma"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-medium text-fg transition hover:border-fg"
          >
            View on GitHub
          </a>
        </div>
      </section>

      <section className="grid gap-6 sm:gap-10 sm:grid-cols-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-fg">
            User-owned
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Your soul.md lives on your machine, in your repo, in your hands.
            No cloud, no account, no vendor.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-fg">
            Portable
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Works with Claude Desktop, Cursor, Zed, and any MCP-aware client.
            One install, every assistant.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-fg">
            Built to outlive models
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Git-diffable. Forkable. Versioned. A file format, not a walled
            garden.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-tight text-fg">
          Install
        </h2>
        <p className="text-sm leading-relaxed text-muted">
          One line in your Claude Desktop, Cursor, or Zed config. The assistant
          reads your soul.md, asks for skill depth on demand, and writes
          decisions and lessons back as conversations happen.
        </p>
        <div className="overflow-hidden rounded-lg border border-border bg-surface-elevated p-4 font-mono text-xs sm:p-5 sm:text-sm">
          <pre className="overflow-x-auto text-fg leading-relaxed">
{`{
  "mcpServers": {
    "manoma": {
      "command": "npx",
      "args": ["-y", "manoma-mcp"]
    }
  }
}`}
          </pre>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-tight text-fg">
          Don&apos;t have a soul.md yet?
        </h2>
        <p className="text-sm leading-relaxed text-muted">
          Use the{" "}
          <Link
            href="/build"
            className="text-fg underline underline-offset-2 hover:opacity-80"
          >
            web onboarding
          </Link>{" "}
          to generate one from a template. Or start from{" "}
          <a
            href="https://github.com/paperdavid/manoma/blob/main/templates/founder.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-fg underline underline-offset-2 hover:opacity-80"
          >
            a template
          </a>{" "}
          and edit it in your editor. soul.md is just markdown.
        </p>
      </section>
    </div>
  );
}
