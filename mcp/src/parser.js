/**
 * parser.js — Parses soul.md into structured sections.
 *
 * Returns:
 *   config        — mode routing, active mode
 *   sections      — map of section ID → { content, meta, triggers }
 *   skillIndex    — parsed skills.summary for keyword matching
 *   personNames   — extracted names from /people for trigger matching
 */

import { readFileSync } from "fs";

// ─── Meta & trigger parsing ───────────────────────────────────────────

function parseMeta(text) {
  const match = text.match(/<!--\s*meta:\s*(.+?)\s*-->/);
  if (!match) return { priority: "medium", stability: "stable", inject: "by_mode", max_tokens: 200 };

  const meta = {};
  match[1].split("|").forEach((pair) => {
    const [key, val] = pair.split("=").map((s) => s.trim());
    if (key && val) meta[key] = key === "max_tokens" ? parseInt(val) : val;
  });

  return {
    priority: meta.priority || "medium",
    stability: meta.stability || "stable",
    inject: meta.inject || "by_mode",
    max_tokens: meta.max_tokens || 200,
  };
}

function parseTriggers(text) {
  const match = text.match(/<!--\s*Triggers?:\s*(.+?)\s*-->/i);
  if (!match) return [];
  return match[1]
    .replace(/"/g, "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

// ─── Config parsing ───────────────────────────────────────────────────

/**
 * Parse the /config section from soul.md.
 *
 * Uses targeted regex extraction (not a full YAML parser) to keep
 * @manoma/core zero-dependency. This handles the soul.md config format:
 *   - Simple key: value pairs (version, default_mode, active_mode)
 *   - mode_routing map with bracket arrays (work: [identity, values, ...])
 *   - YAML code fences, comments, and quoted values
 *
 * Limitations: does not handle nested YAML objects, multi-line values,
 * anchors/aliases, or other advanced YAML features. If you need those,
 * keep the config section simple or pre-process with a real YAML parser.
 */
function parseConfig(text) {
  const config = {
    version: "1.4",
    default_mode: "work",
    active_mode: "work",
    mode_routing: {},
  };

  // Strip YAML code fences, closing fences, inline comments, and full-line comments
  const cleaned = text
    .replace(/```ya?ml\n?/g, "")
    .replace(/```\n?/g, "")
    .replace(/[ \t]+#[^'"]*$/gm, "")  // inline comments ([ \t] not \s to avoid crossing lines)
    .replace(/^\s*#[^#].*$/gm, "");   // full-line YAML comments (single # only, not ## headings)

  // Parse mode routing: key: [val1, val2, ...]
  // Handles quoted values, extra whitespace, and trailing commas
  const routingLines = cleaned.match(/^\s*(\w+):\s*\[(.+)\]/gm);
  if (routingLines) {
    routingLines.forEach((line) => {
      const m = line.match(/^\s*(\w+):\s*\[(.+)\]/);
      if (m) {
        config.mode_routing[m[1].trim()] = m[2]
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
      }
    });
  }

  // Parse simple key: value pairs (handles optional quotes)
  const activeMatch = cleaned.match(/active_mode:\s*["']?(\w+)["']?/);
  if (activeMatch) config.active_mode = activeMatch[1];

  const defaultMatch = cleaned.match(/default_mode:\s*["']?(\w+)["']?/);
  if (defaultMatch) config.default_mode = defaultMatch[1];

  const versionMatch = cleaned.match(/version:\s*["']?([\d.]+)["']?/);
  if (versionMatch) config.version = versionMatch[1];

  return config;
}

// ─── Skills summary parsing ───────────────────────────────────────────

function parseSkillsSummary(text) {
  const domains = [];
  const working = [];
  const building = [];

  // Parse domain entries
  const domainBlocks = text.split(/- name:/g).slice(1);
  domainBlocks.forEach((block) => {
    const name = block.split("\n")[0].trim().replace(/^["']|["']$/g, "");
    const levelMatch = block.match(/level:\s*(.+)/);
    const yearsMatch = block.match(/years:\s*(.+)/);
    const keywordsMatch = block.match(/keywords:\s*["']?(.+?)["']?\s*$/m);

    if (name) {
      domains.push({
        name,
        level: levelMatch ? levelMatch[1].trim() : "competent",
        years: yearsMatch ? yearsMatch[1].trim() : "",
        keywords: keywordsMatch
          ? keywordsMatch[1].split(",").map((k) => k.trim().toLowerCase()).filter(Boolean)
          : [],
      });
    }
  });

  // Parse working knowledge
  const workingMatch = text.match(/working_knowledge:\s*\n([\s\S]*?)(?=building_toward:|$)/);
  if (workingMatch) {
    const lines = workingMatch[1].match(/- skill:\s*(.+)/g);
    if (lines) {
      lines.forEach((line) => {
        const s = line.match(/- skill:\s*(.+)/);
        if (s) working.push(s[1].trim());
      });
    }
  }

  // Parse building toward
  const buildingMatch = text.match(/building_toward:\s*\n([\s\S]*?)(?=```|$)/);
  if (buildingMatch) {
    const lines = buildingMatch[1].match(/- skill:\s*(.+)/g);
    if (lines) {
      lines.forEach((line) => {
        const s = line.match(/- skill:\s*(.+)/);
        if (s) building.push(s[1].trim());
      });
    }
  }

  return { domains, working, building };
}

// ─── Person name extraction ───────────────────────────────────────────

function extractPersonNames(text) {
  const names = [];
  const regex = /^### (.+)/gm;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const name = match[1].trim().replace(/[{}]/g, "");
    if (name && !name.startsWith("/") && name !== "PERSON_NAME") {
      names.push(name.toLowerCase());
    }
  }
  return names;
}

// ─── Individual person block extraction ───────────────────────────────

function extractPersonBlocks(text) {
  const blocks = {};
  const regex = /^### (.+)/gm;
  const matches = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    const name = match[1].trim().replace(/[{}]/g, "");
    if (name && !name.startsWith("/") && name !== "PERSON_NAME") {
      matches.push({ name: name.toLowerCase(), start: match.index });
    }
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].start;
    const end = i + 1 < matches.length ? matches[i + 1].start : text.length;
    blocks[matches[i].name] = text.slice(start, end).trim();
  }

  return blocks;
}

// ─── Main parser ──────────────────────────────────────────────────────

/**
 * Parse soul.md content (string). Use this when you have the content in memory
 * (e.g. from onboarding form, API). No filesystem access.
 */
export function parseSoulFromString(raw) {
  // Split by ## headers
  const sectionRegex = /^## \/(\S+)/gm;
  const splits = [];
  let match;

  while ((match = sectionRegex.exec(raw)) !== null) {
    splits.push({ id: match[1], start: match.index });
  }

  const sections = {};

  for (let i = 0; i < splits.length; i++) {
    const start = splits[i].start;
    const end = i + 1 < splits.length ? splits[i + 1].start : raw.length;
    const content = raw.slice(start, end).trim();
    const id = splits[i].id;

    // Check for subsections (### /memory/decisions, etc.)
    const subRegex = /^### \/(\S+)/gm;
    const subs = [];
    let subMatch;

    while ((subMatch = subRegex.exec(content)) !== null) {
      subs.push({ id: subMatch[1], start: subMatch.index });
    }

    if (subs.length > 0) {
      // Parse subsections independently
      for (let j = 0; j < subs.length; j++) {
        const subStart = subs[j].start;
        const subEnd = j + 1 < subs.length ? subs[j + 1].start : content.length;
        const subContent = content.slice(subStart, subEnd).trim();

        sections[subs[j].id] = {
          id: subs[j].id,
          parent: id,
          content: subContent,
          meta: parseMeta(subContent),
          triggers: parseTriggers(subContent),
        };
      }

      // Store parent intro
      const introEnd = subs[0].start;
      sections[id] = {
        id,
        content: content.slice(0, introEnd).trim(),
        meta: parseMeta(content),
        triggers: parseTriggers(content),
        children: subs.map((s) => s.id),
      };
    } else {
      sections[id] = {
        id,
        content,
        meta: parseMeta(content),
        triggers: parseTriggers(content),
      };
    }
  }

  // Handle skills — look for ### domain: and ### skills.summary blocks
  if (sections.skills) {
    const skillsContent = raw.slice(
      splits.find((s) => s.id === "skills")?.start || 0,
      splits[splits.findIndex((s) => s.id === "skills") + 1]?.start || raw.length
    );

    // Extract skills.summary block
    const summaryMatch = skillsContent.match(/### skills\.summary[\s\S]*?```yaml\n([\s\S]*?)```/);
    if (summaryMatch) {
      const summaryStart = skillsContent.indexOf("### skills.summary");
      const domainStart = skillsContent.indexOf("\n### domain:", summaryStart);
      const summaryEnd = domainStart > -1 ? domainStart : skillsContent.length;

      sections["skills.summary"] = {
        id: "skills.summary",
        parent: "skills",
        content: skillsContent.slice(summaryStart, summaryEnd).trim(),
        meta: { priority: "high", stability: "stable", inject: "always", max_tokens: 200 },
        triggers: [],
      };
    }

    // Extract individual domain blocks
    const domainRegex = /### domain: (.+)/g;
    const domainSplits = [];
    let dMatch;

    while ((dMatch = domainRegex.exec(skillsContent)) !== null) {
      domainSplits.push({ name: dMatch[1].trim(), start: dMatch.index });
    }

    for (let i = 0; i < domainSplits.length; i++) {
      const dStart = domainSplits[i].start;
      const dEnd = i + 1 < domainSplits.length ? domainSplits[i + 1].start : skillsContent.length;
      const domainContent = skillsContent.slice(dStart, dEnd).trim();
      const domainId = `skills.domain.${domainSplits[i].name.toLowerCase().replace(/\s+/g, "_")}`;

      sections[domainId] = {
        id: domainId,
        parent: "skills",
        content: domainContent,
        meta: parseMeta(domainContent) || { priority: "high", stability: "stable", inject: "on_trigger", max_tokens: 300 },
        triggers: [],
        domainName: domainSplits[i].name,
      };
    }
  }

  // Parse config
  const config = sections.config ? parseConfig(sections.config.content) : {
    default_mode: "work",
    active_mode: "work",
    mode_routing: {},
  };

  // Parse skill index for keyword matching
  const skillIndex = sections["skills.summary"]
    ? parseSkillsSummary(sections["skills.summary"].content)
    : { domains: [], working: [], building: [] };

  // Extract person names and blocks
  const personNames = sections.people ? extractPersonNames(sections.people.content) : [];
  const personBlocks = sections.people ? extractPersonBlocks(sections.people.content) : {};

  return { raw, config, sections, skillIndex, personNames, personBlocks };
}

/**
 * Parse soul.md from file path. Convenience wrapper for parseSoulFromString.
 */
export function parseSoul(filePath) {
  const raw = readFileSync(filePath, "utf-8");
  return parseSoulFromString(raw);
}

// ─── Token estimator ──────────────────────────────────────────────────

export function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}
