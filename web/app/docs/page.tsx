import Link from "next/link";

export default function DocsPage() {
  return (
    <div className="space-y-8 sm:space-y-12">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">
          Documentation
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted max-w-2xl sm:text-base">
          How to create your soul.md and install the Manoma MCP server.
        </p>
      </header>

        <section id="templates">
          <h2 className="text-base font-semibold tracking-tight text-fg">
            Templates
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Start from a pre-filled example based on your role.
          </p>
          <ul className="mt-3 space-y-2 text-sm sm:space-y-1.5 sm:text-base">
            <li className="flex flex-col gap-0.5 sm:flex-row sm:gap-1">
              <Link
                href="/templates/founder"
                className="text-fg underline decoration-border underline-offset-4 transition hover:decoration-fg"
              >
                founder.md
              </Link>
              <span className="text-xs text-muted sm:text-sm">— Founder/CTO, product + eng</span>
            </li>
            <li className="flex flex-col gap-0.5 sm:flex-row sm:gap-1">
              <Link
                href="/templates/engineer"
                className="text-fg underline decoration-border underline-offset-4 transition hover:decoration-fg"
              >
                engineer.md
              </Link>
              <span className="text-xs text-muted sm:text-sm">— Software engineer</span>
            </li>
            <li className="flex flex-col gap-0.5 sm:flex-row sm:gap-1">
              <Link
                href="/templates/designer"
                className="text-fg underline decoration-border underline-offset-4 transition hover:decoration-fg"
              >
                designer.md
              </Link>
              <span className="text-xs text-muted sm:text-sm">— Product/UX designer</span>
            </li>
            <li className="flex flex-col gap-0.5 sm:flex-row sm:gap-1">
              <Link
                href="/templates/pm"
                className="text-fg underline decoration-border underline-offset-4 transition hover:decoration-fg"
              >
                pm.md
              </Link>
              <span className="text-xs text-muted sm:text-sm">— Product manager</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold tracking-tight text-fg">
            Quick start
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted sm:text-base">
            <li>
              Create your soul.md — use the{" "}
              <Link
                href="/build"
                className="text-fg underline decoration-border underline-offset-4 transition hover:decoration-fg"
              >
                web builder
              </Link>
              , start from a template above, or edit the blank schema.
            </li>
            <li>
              Save it at{" "}
              <code className="rounded bg-surface-elevated px-1.5 py-0.5 font-mono text-sm text-fg">
                ~/soul.md
              </code>{" "}
              (or any path set via{" "}
              <code className="rounded bg-surface-elevated px-1.5 py-0.5 font-mono text-sm text-fg">
                SOUL_MD_PATH
              </code>
              ).
            </li>
            <li>
              Add the MCP server to your Claude Desktop, Cursor, or Zed config:
            </li>
          </ol>
          <div className="mt-4 overflow-hidden rounded-lg border border-border bg-surface-elevated p-4 font-mono text-xs sm:p-5 sm:text-sm">
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
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Restart your client. Any MCP-aware assistant can now read your
            identity, skills, and voice — and write decisions and lessons back
            as conversations happen.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold tracking-tight text-fg">
            How injection works
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
            Three tiers: always (identity, values, voice), by mode
            (work/personal/creative/learning), and on trigger (keywords match
            your message).
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            ~2500 tokens per injection. Core identity gets ~1600. Triggered
            content shares ~900.
          </p>
        </section>
    </div>
  );
}
