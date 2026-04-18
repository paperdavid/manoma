/**
 * File operations for soul.md
 *
 * Handles reading, writing, and section-level mutations.
 * Write-back tools modify specific sections while preserving
 * the rest of the document.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { homedir } from "node:os";
import { STARTER_TEMPLATE } from "./template.js";

const TIMESTAMP_FORMAT: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
};

/**
 * Resolve the soul.md file path.
 * Priority: SOUL_MD_PATH env → ./soul.md → ~/soul.md
 */
export function resolveSoulPath(): string {
  if (process.env.SOUL_MD_PATH) {
    return resolve(process.env.SOUL_MD_PATH);
  }

  const localPath = resolve("soul.md");
  if (existsSync(localPath)) return localPath;

  return resolve(homedir(), "soul.md");
}

export interface EnsureResult {
  path: string;
  bootstrapped: boolean;
}

/**
 * Ensure soul.md exists at the given path. If missing, write the starter
 * template. Returns whether bootstrapping occurred so the server can surface
 * a first-run welcome message.
 *
 * Creates parent directories if needed. If the file already exists it's left
 * completely untouched — we never overwrite user content.
 */
export async function ensureSoulFile(path: string): Promise<EnsureResult> {
  if (existsSync(path)) return { path, bootstrapped: false };

  const parent = dirname(path);
  if (!existsSync(parent)) {
    await mkdir(parent, { recursive: true });
  }

  await writeFile(path, STARTER_TEMPLATE, "utf-8");
  return { path, bootstrapped: true };
}

/**
 * Read soul.md from disk
 */
export async function readSoulFile(path: string): Promise<string> {
  if (!existsSync(path)) {
    throw new Error(
      `soul.md not found at ${path}. ` +
        `Create one or set SOUL_MD_PATH environment variable.`
    );
  }
  return readFile(path, "utf-8");
}

/**
 * Write soul.md back to disk
 */
export async function writeSoulFile(
  path: string,
  content: string
): Promise<void> {
  await writeFile(path, content, "utf-8");
}

/**
 * Find a section in the raw markdown by its heading.
 * Returns start/end line indices (inclusive/exclusive).
 */
interface SectionRange {
  start: number;
  end: number;
  headingDepth: number;
}

export function findSectionRange(
  lines: string[],
  sectionPath: string
): SectionRange | null {
  // Determine what heading to look for
  const parts = sectionPath.split("/").filter(Boolean);
  const sectionName = parts[parts.length - 1];

  // Find the heading line
  let startLine = -1;
  let headingDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{2,4})\s+(.+)/);
    if (!match) continue;

    const depth = match[1].length;
    const text = match[2].trim().toLowerCase().replace(/\s+/g, "_");

    // Match by explicit path or by name
    if (
      text === sectionPath.toLowerCase() ||
      text === sectionName.toLowerCase() ||
      text === `/${sectionName}` ||
      text === `/${parts.join("/")}`
    ) {
      startLine = i;
      headingDepth = depth;
      break;
    }
  }

  if (startLine === -1) return null;

  // Find the end: next heading at same or higher level
  let endLine = lines.length;
  for (let i = startLine + 1; i < lines.length; i++) {
    const match = lines[i].match(/^(#{2,4})\s+/);
    if (match && match[1].length <= headingDepth) {
      endLine = i;
      break;
    }
  }

  return { start: startLine, end: endLine, headingDepth };
}

const MAX_ENTRIES = 15;

/**
 * Prepend a timestamped entry to a section's content (newest first).
 * Trims to MAX_ENTRIES to prevent unbounded growth.
 * Used for add_decision and add_lesson.
 */
export function appendToSection(
  raw: string,
  sectionPath: string,
  entry: string
): string {
  const lines = raw.split("\n");
  const range = findSectionRange(lines, sectionPath);

  const date = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
  const newEntry = `- [${date}] ${entry}`;

  if (range) {
    // Find first content line after heading + meta
    let insertAt = range.start + 1;

    // Skip meta comment line if present
    if (insertAt < range.end && lines[insertAt].match(/<!--\s*meta:/)) {
      insertAt++;
    }
    // Skip trigger comment line if present
    if (insertAt < range.end && lines[insertAt].match(/<!--\s*Triggers?:/i)) {
      insertAt++;
    }
    // Skip blank lines after meta/triggers
    while (insertAt < range.end && lines[insertAt].trim() === "") {
      insertAt++;
    }

    // Insert new entry at the top of the section content (newest first)
    lines.splice(insertAt, 0, newEntry, "");

    // Trim to MAX_ENTRIES: count list items (lines starting with "- ") and remove excess from end
    const updatedRange = findSectionRange(lines, sectionPath);
    if (updatedRange) {
      const entryIndices: number[] = [];
      for (let i = updatedRange.start + 1; i < updatedRange.end; i++) {
        if (lines[i].match(/^- /)) {
          entryIndices.push(i);
        }
      }

      if (entryIndices.length > MAX_ENTRIES) {
        // Remove oldest entries (at the bottom) — splice from end to preserve indices
        const toRemove = entryIndices.slice(MAX_ENTRIES);
        for (let i = toRemove.length - 1; i >= 0; i--) {
          lines.splice(toRemove[i], 1);
        }
      }
    }

    return lines.join("\n");
  }

  // Section doesn't exist — create it
  const parts = sectionPath.split("/").filter(Boolean);
  const depth = Math.min(parts.length + 1, 4); // ## for top-level, ### for nested
  const heading = "#".repeat(depth) + " " + sectionPath;

  return raw + `\n\n${heading}\n\n${newEntry}\n`;
}

/**
 * Replace a section's content entirely.
 * Used for update_now.
 */
export function replaceSection(
  raw: string,
  sectionPath: string,
  newContent: string
): string {
  const lines = raw.split("\n");
  const range = findSectionRange(lines, sectionPath);

  if (range) {
    // Keep the heading line, replace everything between heading and next section
    const headingLine = lines[range.start];
    // Check for meta comment on next line
    let contentStart = range.start + 1;
    if (
      contentStart < range.end &&
      lines[contentStart].match(/<!--\s*meta:/)
    ) {
      contentStart++;
    }

    const before = lines.slice(0, contentStart);
    const after = lines.slice(range.end);
    return [...before, "", newContent, "", ...after].join("\n");
  }

  // Section doesn't exist — create it
  const parts = sectionPath.split("/").filter(Boolean);
  const depth = Math.min(parts.length + 1, 4);
  const heading = "#".repeat(depth) + " " + sectionPath;

  return raw + `\n\n${heading}\n\n${newContent}\n`;
}
