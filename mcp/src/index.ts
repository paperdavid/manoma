#!/usr/bin/env node
/**
 * manoma-mcp — MCP server for soul.md
 *
 * Serves your portable AI identity as MCP resources and tools.
 * Resources expose every soul.md section for reading.
 * Tools enable write-back: add_decision, add_lesson, update_now.
 * The get_injection tool provides a smart, token-budgeted injection
 * for assembling system prompts.
 *
 * Usage:
 *   npx manoma-mcp                           # reads ~/soul.md
 *   SOUL_MD_PATH=./my-soul.md npx manoma-mcp  # custom path
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { parseSoulFromString, type ParsedSoul, type Section } from "./parser.js";
import { buildInjection, type InjectionResult } from "./injector.js";
import {
  resolveSoulPath,
  ensureSoulFile,
  readSoulFile,
  writeSoulFile,
  appendToSection,
  replaceSection,
} from "./file-ops.js";
import { welcomeMessage } from "./template.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let soulPath: string;
let soulDoc: ParsedSoul;

/**
 * Set when soul.md is auto-bootstrapped on first run. Prepended to the first
 * tool response so the LLM can deliver onboarding conversationally, then
 * cleared — welcome only fires once per server process.
 */
let pendingWelcome: string | null = null;

async function reload(): Promise<void> {
  const raw = await readSoulFile(soulPath);
  soulDoc = parseSoulFromString(raw);
}

/**
 * Build a text tool response, prepending the one-shot welcome message if a
 * bootstrap happened earlier this process. All tool handlers route through
 * this so the welcome surfaces on whichever tool the LLM happens to call first.
 */
function textResponse(text: string) {
  if (pendingWelcome) {
    const welcome = pendingWelcome;
    pendingWelcome = null;
    return {
      content: [{ type: "text" as const, text: welcome + text }],
    };
  }
  return {
    content: [{ type: "text" as const, text }],
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve sections for a mode using mode_routing from config.
 * Handles dotted keys (e.g. "skills.summary" → "skills.summary" or "memory.decisions" → "memory/decisions").
 */
function resolveModeContext(mode: string): Section[] {
  const routing = soulDoc.config?.mode_routing;
  if (!routing || !routing[mode]) {
    // Fallback: return all sections with inject=always
    return Object.values(soulDoc.sections).filter(
      (s) => s.meta.inject === "always"
    );
  }

  const sectionKeys = routing[mode];
  const resolved: Section[] = [];

  for (const key of sectionKeys) {
    // Try direct key match first (e.g. "identity", "skills.summary")
    if (soulDoc.sections[key]) {
      resolved.push(soulDoc.sections[key]);
      continue;
    }

    // Try dotted-to-slash conversion (e.g. "memory.decisions" → "memory/decisions")
    const slashKey = key.replace(/\./g, "/");
    if (soulDoc.sections[slashKey]) {
      resolved.push(soulDoc.sections[slashKey]);
      continue;
    }

    // Try matching modes subsection (e.g. "modes.personal" → look in modes section)
    if (key.startsWith("modes.")) {
      const modeName = key.split(".")[1];
      // The modes section may have content with ### mode: personal blocks
      if (soulDoc.sections.modes) {
        const modeBlockRegex = new RegExp(
          `### mode: ${modeName}[\\s\\S]*?(?=### mode:|$)`,
          "i"
        );
        const match = soulDoc.sections.modes.content.match(modeBlockRegex);
        if (match) {
          resolved.push({
            id: `modes/${modeName}`,
            content: match[0],
            meta: soulDoc.sections.modes.meta,
            triggers: [],
          });
        }
      }
      continue;
    }

    // Try matching by section name (last part of any key)
    for (const [id, section] of Object.entries(soulDoc.sections)) {
      if (id.endsWith(`/${key}`) || id.endsWith(`.${key}`)) {
        resolved.push(section);
        break;
      }
    }
  }

  return resolved;
}

/**
 * Detect whether /now looks stale based on the latest date literal inside it.
 *
 * /now is marked `stability=volatile` in the starter template, meaning it's
 * expected to change often. When it hasn't been touched in a while, returning
 * get_context would silently serve stale priorities. We scan for any
 * YYYY-MM-DD date in the section content and return a short hint if the
 * newest one is older than NOW_STALE_DAYS.
 *
 * Returns null when /now has no dates or is still fresh.
 */
const NOW_STALE_DAYS = 14;

function nowStalenessHint(nowContent: string | undefined): string | null {
  if (!nowContent) return null;

  const matches = [...nowContent.matchAll(/\b(20\d{2})-(\d{2})-(\d{2})\b/g)];
  if (matches.length === 0) return null;

  let latestMs = 0;
  let latestStr = "";
  for (const m of matches) {
    const iso = `${m[1]}-${m[2]}-${m[3]}`;
    const ms = Date.parse(iso);
    if (!Number.isNaN(ms) && ms > latestMs) {
      latestMs = ms;
      latestStr = iso;
    }
  }
  if (latestMs === 0) return null;

  const daysOld = Math.floor((Date.now() - latestMs) / 86400000);
  if (daysOld < NOW_STALE_DAYS) return null;

  return `> _/now last dated ${latestStr} (${daysOld} days ago) — may be stale. Call \`update_now\` to refresh._`;
}

function formatSection(section: Section): string {
  // section.content already includes the heading line
  // (e.g. "## /identity\n<!-- meta: ... -->\n\ncontent...")
  // so we return it directly to avoid duplicating the heading or meta.
  return section.content;
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "manoma-mcp",
  version: "0.2.1",
});

// ---------------------------------------------------------------------------
// Resources — one per soul.md section
// ---------------------------------------------------------------------------

// We register a parameterized resource template for all sections
const sectionTemplate = new ResourceTemplate(
  "soul://section/{path}",
  {
    list: async () => {
      await reload();
      return {
        resources: Object.keys(soulDoc.sections).map((id) => ({
          uri: `soul://section/${id}`,
          name: `/${id}`,
          mimeType: "text/markdown" as const,
        })),
      };
    },
  }
);

server.registerResource(
  "soul_section",
  sectionTemplate,
  {
    description:
      "Access any soul.md section by path (e.g. soul://section/identity, soul://section/memory/decisions)",
    mimeType: "text/markdown",
  },
  async (uri: URL, variables: Record<string, string | string[]>) => {
    await reload();
    const pathVar = variables.path;
    const pathStr = Array.isArray(pathVar) ? pathVar.join("/") : pathVar;
    // Core uses keys without leading "/" (e.g. "identity", "memory/decisions")
    const sectionId = pathStr ?? uri.pathname.replace(/^\/+/, "");

    const section = soulDoc.sections[sectionId];
    if (!section) {
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown" as const,
            text: `Section not found: ${sectionId}\n\nAvailable sections:\n${Object.keys(
              soulDoc.sections
            )
              .map((k) => `/${k}`)
              .join("\n")}`,
          },
        ],
      };
    }

    const text = formatSection(section);
    return {
      contents: [{ uri: uri.href, mimeType: "text/markdown" as const, text }],
    };
  }
);

// Register the full soul resource (static URI)
server.registerResource(
  "soul_full",
  "soul://full",
  {
    description: "The complete soul.md file",
    mimeType: "text/markdown",
  },
  async (uri: URL) => {
    await reload();
    return {
      contents: [{ uri: uri.href, mimeType: "text/markdown" as const, text: soulDoc.raw }],
    };
  }
);

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

// --- get_context -----------------------------------------------------------

const GetContextSchema = z
  .object({
    mode: z
      .string()
      .optional()
      .describe(
        "Mode to resolve context for (work, personal, creative, learning). Defaults to active_mode from config."
      ),
  })
  .strict();

server.registerTool(
  "get_context",
  {
    title: "Get Context",
    description: `Retrieve the user's identity context for the current or specified mode.

Returns all soul.md sections that should be injected for the given mode,
as defined by mode_routing in /config. This is the primary way an LLM
should bootstrap context about the user.

Args:
  - mode (string, optional): One of work, personal, creative, learning.
    Defaults to the active_mode in soul.md config.

Returns:
  Combined markdown of all sections relevant to the requested mode,
  including identity, values, voice, skills, and any mode-specific sections.`,
    inputSchema: GetContextSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (params: z.infer<typeof GetContextSchema>) => {
    await reload();

    const mode =
      params.mode ??
      soulDoc.config?.active_mode ??
      "work";

    const sections = resolveModeContext(mode);

    if (sections.length === 0) {
      const availableModes = soulDoc.config?.mode_routing
        ? Object.keys(soulDoc.config.mode_routing).join(", ")
        : "none configured";

      return textResponse(
        `No sections found for mode "${mode}". Available modes: ${availableModes}`
      );
    }

    const text = sections.map(formatSection).join("\n\n---\n\n");

    // Surface a hint if /now looks stale. Only runs when /now was included by
    // mode_routing; we look at the raw soulDoc entry rather than the resolved
    // list so we don't force the section into a mode that excludes it.
    const hint = nowStalenessHint(soulDoc.sections.now?.content);
    const includesNow = sections.some((s) => s.id === "now");
    const prefix = hint && includesNow ? `${hint}\n\n` : "";

    return textResponse(`# Context: ${mode} mode\n\n${prefix}${text}`);
  }
);

// --- get_injection ---------------------------------------------------------

const GetInjectionSchema = z
  .object({
    mode: z
      .string()
      .optional()
      .describe(
        "Mode (work, personal, creative, learning). Defaults to active_mode from config."
      ),
    message: z
      .string()
      .optional()
      .default("")
      .describe(
        "The user's message. Used for keyword/skill/person triggering."
      ),
  })
  .strict();

server.registerTool(
  "get_injection",
  {
    title: "Get Injection",
    description: `Build a smart context injection from soul.md for an LLM system prompt.

Unlike get_context which returns raw sections, this runs the full injection
algorithm: three-tier priority (always/by_mode/on_trigger), keyword matching
for skill domains, person detection, voice dial conversion to behavioral
instructions, and token budgeting (2500 max with priority-aware truncation).

Use this when assembling the full identity blob for an LLM system prompt.

Args:
  - mode (string, optional): One of work, personal, creative, learning.
  - message (string, optional): The user's message. Used for trigger matching.

Returns:
  The injection text, token count, matched sections, triggered domains, and
  mentioned people.`,
    inputSchema: GetInjectionSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (params: z.infer<typeof GetInjectionSchema>) => {
    await reload();

    const mode = params.mode ?? soulDoc.config?.active_mode ?? "work";
    const injection: InjectionResult = buildInjection({
      soul: soulDoc,
      mode,
      userMessage: params.message ?? "",
    });

    const metaLines = [
      `# Injection: ${mode} mode`,
      `Tokens: ~${injection.totalTokens}/2500`,
      `Sections: ${injection.sectionsUsed.join(", ")}`,
    ];

    if (injection.matchedDomains.length) {
      metaLines.push(`Skill domains: ${injection.matchedDomains.join(", ")}`);
    }
    if (injection.mentionedPeople.length) {
      metaLines.push(`People: ${injection.mentionedPeople.join(", ")}`);
    }
    if (injection.triggeredBy.length) {
      metaLines.push(`Triggers: ${injection.triggeredBy.join(", ")}`);
    }

    metaLines.push("", "---", "", injection.text);

    return textResponse(metaLines.join("\n"));
  }
);

// --- get_skill_depth -------------------------------------------------------

const GetSkillDepthSchema = z
  .object({
    skill: z
      .string()
      .describe(
        'Skill domain to look up (e.g. "backend systems", "observability", "frontend")'
      ),
  })
  .strict();

server.registerTool(
  "get_skill_depth",
  {
    title: "Get Skill Depth",
    description: `Retrieve detailed skill information for a specific domain.

Searches soul.md skill sections for a matching domain and returns the
full detail block including level, years, approach, heuristics, and taste.

Args:
  - skill (string): Skill domain name to look up.

Returns:
  Detailed skill section content if found, or a list of available skills
  with a suggestion to check skills.summary.`,
    inputSchema: GetSkillDepthSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (params: z.infer<typeof GetSkillDepthSchema>) => {
    await reload();

    const query = params.skill.toLowerCase().replace(/\s+/g, "_");

    // Search through all sections for skill matches
    const matches: Section[] = [];
    for (const [id, section] of Object.entries(soulDoc.sections)) {
      if (
        id.includes("skills") ||
        id.includes("domain") ||
        (section.domainName && section.domainName.toLowerCase().includes(params.skill.toLowerCase()))
      ) {
        if (
          section.content.toLowerCase().includes(params.skill.toLowerCase()) ||
          id.includes(query)
        ) {
          matches.push(section);
        }
      }
    }

    if (matches.length === 0) {
      // Return the summary instead
      const summary = soulDoc.sections["skills.summary"] ?? soulDoc.sections["skills"];

      return textResponse(
        summary
          ? `No detailed section found for "${params.skill}". Here's the skills summary:\n\n${formatSection(summary)}`
          : `No skill information found for "${params.skill}".`
      );
    }

    const text = matches.map(formatSection).join("\n\n---\n\n");
    return textResponse(text);
  }
);

// --- list_sections ---------------------------------------------------------

server.registerTool(
  "list_sections",
  {
    title: "List Sections",
    description: `List all available sections in soul.md.

Returns a tree-like listing of all sections with their paths, names,
metadata, and child sections. Useful for discovering what's in the soul.`,
    inputSchema: {},
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async () => {
    await reload();

    const lines: string[] = ["# soul.md sections\n"];

    // Root sections are those without a parent
    const rootSections = Object.entries(soulDoc.sections)
      .filter(([, section]) => !section.parent)
      .map(([id]) => id);

    for (const rootId of rootSections) {
      const section = soulDoc.sections[rootId];
      if (!section) continue;

      const meta = Object.entries(section.meta)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ");

      lines.push(`- **/${section.id}**${meta ? ` (${meta})` : ""}`);

      // List children
      if (section.children) {
        for (const childId of section.children) {
          const child = soulDoc.sections[childId];
          if (child) {
            const childMeta = Object.entries(child.meta)
              .map(([k, v]) => `${k}=${v}`)
              .join(", ");
            lines.push(
              `  - /${child.id}${childMeta ? ` (${childMeta})` : ""}`
            );
          }
        }
      }
    }

    return textResponse(lines.join("\n"));
  }
);

// --- add_decision ----------------------------------------------------------

const AddDecisionSchema = z
  .object({
    decision: z
      .string()
      .min(1)
      .max(500)
      .describe(
        'The decision to record (e.g. "Chose Postgres over DynamoDB for billing — need ACID transactions")'
      ),
    context: z
      .string()
      .optional()
      .describe("Optional additional context or reasoning"),
  })
  .strict();

server.registerTool(
  "add_decision",
  {
    title: "Add Decision",
    description: `Record a decision in /memory/decisions.

Appends a timestamped entry to the decisions section of soul.md.
This is how the AI helps maintain soul.md as a living document —
capturing decisions as they happen during conversation.

Args:
  - decision (string): The decision to record. Be specific about what was
    chosen and why.
  - context (string, optional): Additional reasoning or alternatives considered.

Returns:
  Confirmation with the recorded entry.`,
    inputSchema: AddDecisionSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
  },
  async (params: z.infer<typeof AddDecisionSchema>) => {
    await reload();

    const entry = params.context
      ? `${params.decision} — ${params.context}`
      : params.decision;

    const updated = appendToSection(soulDoc.raw, "/memory/decisions", entry);
    await writeSoulFile(soulPath, updated);
    await reload();

    return textResponse(`Decision recorded in /memory/decisions:\n\n> ${entry}`);
  }
);

// --- add_lesson ------------------------------------------------------------

const AddLessonSchema = z
  .object({
    lesson: z
      .string()
      .min(1)
      .max(500)
      .describe(
        'The lesson learned (e.g. "Redis SCAN is O(N) — don\'t use on hot paths without cursor batching")'
      ),
    source: z
      .string()
      .optional()
      .describe(
        'Where the lesson came from (e.g. "production incident", "code review", "reading")'
      ),
  })
  .strict();

server.registerTool(
  "add_lesson",
  {
    title: "Add Lesson",
    description: `Record a lesson learned in /memory/lessons.

Appends a timestamped entry to the lessons section. Captures insights
and hard-won knowledge from debugging, incidents, code reviews, reading,
or any learning moment.

Args:
  - lesson (string): The lesson to record. Be specific and actionable.
  - source (string, optional): Where this lesson came from.

Returns:
  Confirmation with the recorded entry.`,
    inputSchema: AddLessonSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
  },
  async (params: z.infer<typeof AddLessonSchema>) => {
    await reload();

    const entry = params.source
      ? `${params.lesson} (source: ${params.source})`
      : params.lesson;

    const updated = appendToSection(soulDoc.raw, "/memory/lessons", entry);
    await writeSoulFile(soulPath, updated);
    await reload();

    return textResponse(`Lesson recorded in /memory/lessons:\n\n> ${entry}`);
  }
);

// --- update_now ------------------------------------------------------------

const UpdateNowSchema = z
  .object({
    content: z
      .string()
      .min(1)
      .max(2000)
      .describe(
        "New content for the /now section. Use markdown. This replaces the entire /now section."
      ),
  })
  .strict();

server.registerTool(
  "update_now",
  {
    title: "Update Now",
    description: `Replace the /now section with current focus and status.

The /now section captures what the user is currently working on, thinking
about, and prioritizing. This tool replaces it entirely with new content.

Args:
  - content (string): New markdown content for the /now section. Should
    describe current projects, focus areas, blockers, and priorities.

Returns:
  Confirmation with the new content.`,
    inputSchema: UpdateNowSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async (params: z.infer<typeof UpdateNowSchema>) => {
    await reload();

    const updated = replaceSection(soulDoc.raw, "/now", params.content);
    await writeSoulFile(soulPath, updated);
    await reload();

    return textResponse(`/now section updated:\n\n${params.content}`);
  }
);

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  soulPath = resolveSoulPath();

  // Auto-bootstrap a starter template if no soul.md exists yet. Sets a
  // pendingWelcome that surfaces on the first tool call so new users see
  // onboarding conversationally instead of hitting an unfriendly error.
  let bootstrapped = false;
  try {
    const result = await ensureSoulFile(soulPath);
    bootstrapped = result.bootstrapped;
    if (bootstrapped) {
      pendingWelcome = welcomeMessage(soulPath);
    }
  } catch (err) {
    console.error(
      `Error: Could not create soul.md at ${soulPath}\n` +
        `Check that the path is writable, or set SOUL_MD_PATH to a different location.\n\n` +
        `${err instanceof Error ? err.message : String(err)}`
    );
    process.exit(1);
  }

  try {
    await reload();
  } catch (err) {
    console.error(
      `Error: Could not load soul.md from ${soulPath}\n` +
        `Make sure the file is readable and valid soul.md format.\n\n` +
        `${err instanceof Error ? err.message : String(err)}`
    );
    process.exit(1);
  }

  const sectionCount = Object.keys(soulDoc.sections).length;
  const modes = soulDoc.config?.mode_routing
    ? Object.keys(soulDoc.config.mode_routing).join(", ")
    : "none";

  const statusLine = bootstrapped
    ? `Created starter: ${soulPath}`
    : `Loaded: ${soulPath}`;

  console.error(`
  ███╗   ███╗ █████╗ ███╗   ██╗ ██████╗ ███╗   ███╗ █████╗
  ████╗ ████║██╔══██╗████╗  ██║██╔═══██╗████╗ ████║██╔══██╗
  ██╔████╔██║███████║██╔██╗ ██║██║   ██║██╔████╔██║███████║
  ██║╚██╔╝██║██╔══██║██║╚██╗██║██║   ██║██║╚██╔╝██║██╔══██║
  ██║ ╚═╝ ██║██║  ██║██║ ╚████║╚██████╔╝██║ ╚═╝ ██║██║  ██║
  ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝

  manoma-mcp v0.2.1
  ${statusLine}
  Sections: ${sectionCount} | Modes: ${modes}
  Transport: stdio
`);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
