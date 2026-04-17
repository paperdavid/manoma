import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const VALID_SLUGS = ["founder", "engineer", "designer", "pm"];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!VALID_SLUGS.includes(slug)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Try monorepo templates dir first
  const monorepoPath = join(process.cwd(), "..", "..", "templates", `${slug}.md`);
  // Try public dir (for Vercel)
  const publicPath = join(process.cwd(), "public", "templates", `${slug}.md`);

  let content: string;
  if (existsSync(monorepoPath)) {
    content = readFileSync(monorepoPath, "utf-8");
  } else if (existsSync(publicPath)) {
    content = readFileSync(publicPath, "utf-8");
  } else {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/markdown",
      "Content-Disposition": `attachment; filename="soul-${slug}.md"`,
    },
  });
}
