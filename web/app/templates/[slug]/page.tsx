import { notFound } from "next/navigation";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const VALID_SLUGS = ["founder", "engineer", "designer", "pm"];

export default async function TemplatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!VALID_SLUGS.includes(slug)) notFound();

  const monorepoPath = join(process.cwd(), "..", "..", "templates", `${slug}.md`);
  const publicPath = join(process.cwd(), "public", "templates", `${slug}.md`);

  let content: string;
  if (existsSync(monorepoPath)) {
    content = readFileSync(monorepoPath, "utf-8");
  } else if (existsSync(publicPath)) {
    content = readFileSync(publicPath, "utf-8");
  } else {
    notFound();
  }

  return (
    <div className="space-y-6 sm:space-y-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold tracking-tight capitalize text-fg sm:text-xl">
          {slug} template
        </h1>
        <div className="flex flex-wrap gap-3">
          <a
            href={`/api/templates/${slug}`}
            download={`soul-${slug}.md`}
            className="rounded-full bg-accent px-3 py-2 text-sm font-medium text-on-accent transition hover:opacity-80"
          >
            Download soul.md
          </a>
          <a
            href={`/build?template=${slug}`}
            className="rounded-full border border-border px-3 py-2 text-sm font-medium text-fg transition hover:border-fg"
          >
            Customize from scratch
          </a>
        </div>
      </div>
      <pre className="overflow-x-auto rounded-lg border border-border bg-surface-elevated p-4 text-xs leading-relaxed text-fg sm:p-5 sm:text-sm">
        {content}
        </pre>
    </div>
  );
}
