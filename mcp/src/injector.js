/**
 * injector.js — The core algorithm.
 *
 * Takes parsed soul + user message + mode → returns injection string.
 *
 * Three tiers:
 *   ALWAYS  — identity, values, voice, skills.summary, intuition, writing, tools, preferences
 *   BY MODE — now, memory.positions, active mode block
 *   TRIGGER — skill domains (keyword match), memory.decisions, memory.lessons, people
 *
 * Uses section metadata (priority, max_tokens) for intelligent truncation.
 * High-priority sections (personality, expertise) are never cut.
 * Section triggers from soul.md are merged with built-in keyword triggers.
 */

import { estimateTokens } from "./parser.js";

const TOKEN_BUDGET = 2500;

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

// ─── Voice dial → behavioral instruction conversion ───────────────────

const DIAL_INSTRUCTIONS = {
  humor: {
    0: "Be strictly professional. No humor.",
    30: "Light, occasional humor only when appropriate.",
    50: "Be naturally conversational. Humor when it fits.",
    70: "Use wit and levity naturally. Occasional jokes.",
    90: "Be genuinely funny. Roast when deserved.",
    100: "Maximum humor. Will roast freely.",
  },
  sarcasm: {
    0: "Always earnest. No sarcasm.",
    30: "Mild dry wit only.",
    50: "Dry wit is welcome. Understatement over exaggeration.",
    70: "Sarcasm is a tool. Use it.",
    100: "Everything is slightly ironic.",
  },
  directness: {
    0: "Be diplomatic. Soften everything. Lead with positives.",
    30: "Be tactful but honest.",
    50: "Be straightforward but not blunt.",
    70: "Be direct. Don't pad. Say what you mean.",
    90: "No hedging. No sugarcoating. State your view.",
    100: "Brutally direct. Skip disclaimers entirely.",
  },
  patience: {
    0: "Cut to the answer. No preamble. Assume I know the basics.",
    30: "Brief context only when essential.",
    50: "Explain when it adds value. Skip when obvious.",
    70: "Be thorough. Provide context and reasoning.",
    100: "Explain everything step by step. Assume nothing.",
  },
  formality: {
    0: "Text like a friend. Casual, informal. Contractions, fragments ok.",
    30: "Conversational but clean.",
    50: "Professional but not stiff.",
    70: "Polished and professional.",
    100: "Formal writing. Full sentences. Proper structure.",
  },
  creativity: {
    0: "Stick to conventional, proven approaches.",
    30: "Mostly conventional with occasional alternatives.",
    50: "Balance proven approaches with fresh ideas.",
    70: "Offer creative angles. Suggest unexpected approaches.",
    100: "Go wild. Weird ideas welcome. Break conventions.",
  },
  challenge: {
    0: "Agree and support. Don't push back.",
    30: "Gently note alternatives when important.",
    50: "Offer counterpoints when relevant.",
    70: "Push back when you disagree. Play devil's advocate.",
    100: "Challenge everything. Steel-man the other side.",
  },
  warmth: {
    0: "Purely transactional. No small talk.",
    30: "Friendly but focused.",
    50: "Warm and professional.",
    70: "Genuinely caring. Check in on context.",
    100: "Deeply warm. Empathetic. Human connection first.",
  },
  confidence: {
    0: "Hedge everything. Present options without preference.",
    30: "Lean toward options but acknowledge uncertainty.",
    50: "Share views with appropriate caveats.",
    70: "State opinions clearly. Minimal hedging.",
    100: "State opinions like facts. Full conviction.",
  },
  verbosity: {
    0: "Three words if possible. Minimum viable response.",
    30: "Short and tight. One paragraph max.",
    50: "Moderate length. Cover what matters.",
    70: "Thorough. Provide context and nuance.",
    100: "Comprehensive. Full detail on everything.",
  },
};

function dialToInstruction(name, value) {
  const thresholds = Object.keys(DIAL_INSTRUCTIONS[name] || {})
    .map(Number)
    .sort((a, b) => a - b);

  if (thresholds.length === 0) return "";

  let closest = thresholds[0];
  for (const t of thresholds) {
    if (value >= t) closest = t;
  }

  return DIAL_INSTRUCTIONS[name][closest];
}

function parseVoiceDials(voiceContent) {
  const dials = {};
  const regex = /(\w+):\s*(\d+)\s*\/\s*100/g;
  let match;

  while ((match = regex.exec(voiceContent)) !== null) {
    dials[match[1]] = parseInt(match[2]);
  }

  return dials;
}

function buildVoiceInstructions(voiceContent, modeOverrides) {
  const dials = parseVoiceDials(voiceContent);

  // Apply mode overrides
  if (modeOverrides) {
    const overrideRegex = /(\w+):\s*(\d+)/g;
    let m;
    while ((m = overrideRegex.exec(modeOverrides)) !== null) {
      dials[m[1]] = parseInt(m[2]);
    }
  }

  const instructions = [];
  for (const [name, value] of Object.entries(dials)) {
    const inst = dialToInstruction(name, value);
    if (inst) instructions.push(inst);
  }

  // Extract ai_personality freetext
  const personalityMatch = voiceContent.match(/### ai_personality[\s\S]*?```\n([\s\S]*?)```/);
  if (personalityMatch && personalityMatch[1].trim()) {
    instructions.push(`Personality: ${personalityMatch[1].trim()}`);
  }

  return instructions.join("\n");
}

// ─── Keyword triggers ─────────────────────────────────────────────────

const KEYWORD_TRIGGERS = [
  {
    patterns: ["email", "reply", "write to", "follow up", "outreach", "send to"],
    add: ["writing", "people"],
  },
  {
    patterns: ["decide", "decision", "choose", "tradeoff", "pick", "strategy", "should i", "should we"],
    add: ["memory/decisions"],
  },
  {
    patterns: ["mistake", "learned", "last time", "don't repeat", "went wrong", "failed"],
    add: ["memory/lessons"],
  },
  {
    patterns: ["plan", "roadmap", "next steps", "priorities", "what's next", "schedule"],
    add: ["now", "memory/positions"],
  },
  {
    patterns: ["write", "rewrite", "tone", "style", "draft", "rephrase"],
    add: ["writing", "preferences"],
  },
  {
    patterns: ["review", "feedback", "opinion", "what do you think"],
    add: ["intuition"],
  },
];

/**
 * Find triggered section IDs by checking both:
 * 1. Built-in keyword triggers (KEYWORD_TRIGGERS)
 * 2. Section-level triggers from soul.md (section.triggers parsed from <!-- Triggers: ... -->)
 */
function findKeywordTriggers(message, sections) {
  const lower = message.toLowerCase();
  const triggered = new Set();

  // Built-in keyword triggers
  for (const trigger of KEYWORD_TRIGGERS) {
    for (const pattern of trigger.patterns) {
      if (lower.includes(pattern)) {
        trigger.add.forEach((s) => triggered.add(s));
        break;
      }
    }
  }

  // Section-level triggers from soul.md metadata
  if (sections) {
    for (const [id, section] of Object.entries(sections)) {
      if (section.triggers && section.triggers.length > 0) {
        for (const trigger of section.triggers) {
          if (lower.includes(trigger)) {
            triggered.add(id);
            break;
          }
        }
      }
    }
  }

  return triggered;
}

// ─── Skill-level behavior rules ──────────────────────────────────────

const SKILL_LEVEL_BEHAVIOR = {
  expert: "Skip basics, go deep, jargon is fine, challenge assumptions.",
  senior: "Go deep, explain edge cases, minimal hand-holding.",
  competent: "Explain when needed, don't assume mastery.",
  working_knowledge: "Explain more, link to known domains for analogies.",
  building_toward: "Teach patiently, use analogies from known domains, connect to existing skills.",
};

/**
 * Build a skill-level behavioral instruction for matched domains.
 * Uses the level from skillIndex (expert/senior/etc.) to tell the LLM
 * how to calibrate its responses.
 */
function buildSkillBehaviorHint(matchedDomainIds, skillIndex, sections) {
  const hints = [];

  for (const domainId of matchedDomainIds) {
    const section = sections[domainId];
    if (!section) continue;

    const domainName = section.domainName || domainId;

    // Find the matching domain in skillIndex to get its level
    const indexEntry = skillIndex.domains.find(
      (d) => `skills.domain.${d.name.toLowerCase().replace(/\s+/g, "_")}` === domainId
    );

    if (indexEntry) {
      const level = indexEntry.level?.toLowerCase() || "competent";
      const behavior = SKILL_LEVEL_BEHAVIOR[level] || SKILL_LEVEL_BEHAVIOR.competent;
      hints.push(`${domainName} (${level}): ${behavior}`);
    }
  }

  // Also check working_knowledge and building_toward for general context
  if (skillIndex.working && skillIndex.working.length > 0) {
    for (const item of skillIndex.working) {
      const name = item.skill || item.name || "";
      if (name) {
        hints.push(`${name} (working knowledge): ${SKILL_LEVEL_BEHAVIOR.working_knowledge}`);
      }
    }
  }

  if (skillIndex.building && skillIndex.building.length > 0) {
    for (const item of skillIndex.building) {
      const name = item.skill || item.name || "";
      if (name) {
        hints.push(`${name} (building toward): ${SKILL_LEVEL_BEHAVIOR.building_toward}`);
      }
    }
  }

  return hints.length > 0
    ? "Calibrate depth by skill level:\n" + hints.map((h) => `- ${h}`).join("\n")
    : "";
}

// ─── Skill domain matching ────────────────────────────────────────────

function findMatchingSkillDomains(message, skillIndex, sections) {
  const lower = message.toLowerCase();
  const words = lower.split(/\W+/).filter(Boolean);
  const matched = [];

  for (const domain of skillIndex.domains) {
    let found = false;
    for (const keyword of domain.keywords) {
      // Check both directions: message contains keyword OR keyword contains a message word
      // This handles singular/plural (api/apis, database/databases)
      if (lower.includes(keyword) || words.some((w) => keyword.includes(w) && w.length >= 3)) {
        found = true;
        break;
      }
    }

    if (found) {
      const domainId = `skills.domain.${domain.name.toLowerCase().replace(/\s+/g, "_")}`;
      if (sections[domainId]) {
        matched.push(domainId);
      }
    }
  }

  return matched;
}

// ─── Person matching ──────────────────────────────────────────────────

function findMentionedPeople(message, personNames) {
  const lower = message.toLowerCase();
  return personNames.filter((name) => lower.includes(name));
}

// ─── Section content cleaning ─────────────────────────────────────────

function cleanSection(content) {
  // Remove meta comments and HTML comments for injection
  return content
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^## \/\S+\s*/gm, "")
    .replace(/^### \/\S+\s*/gm, "")
    .replace(/^### domain:\s*.+\s*/gm, "")
    .replace(/^### skills\.summary\s*/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ─── Priority & meta helpers ──────────────────────────────────────────

function getPriorityRank(section) {
  const p = section?.meta?.priority || "medium";
  return PRIORITY_ORDER[p] ?? 1;
}

function getMaxTokens(section, fallback) {
  if (section?.meta?.max_tokens && typeof section.meta.max_tokens === "number") {
    return section.meta.max_tokens;
  }
  return fallback;
}

// ─── Main injection builder ───────────────────────────────────────────

export function buildInjection({ soul, mode, userMessage }) {
  const { config, sections, skillIndex, personNames, personBlocks } = soul;
  const activeMode = mode || config.active_mode || config.default_mode || "work";

  // Get mode routing
  const modeRoute = config.mode_routing[activeMode] || [];

  // Get keyword triggers from message (built-in + section-level)
  const keywordTriggers = findKeywordTriggers(userMessage, sections);

  // Get matching skill domains
  const matchedDomains = findMatchingSkillDomains(userMessage, skillIndex, sections);

  // Get mentioned people
  const mentionedPeople = findMentionedPeople(userMessage, personNames);

  // ─── Collect candidates into tiers ─────────────────────────────────

  const tier1 = []; // ALWAYS — personality and expertise, never cut
  const tier2 = []; // BY MODE
  const tier3 = []; // ON TRIGGER

  // TIER 1: Always inject (core identity)
  if (sections.identity) {
    tier1.push({ label: "IDENTITY", section: sections.identity, maxTokens: getMaxTokens(sections.identity, 250) });
  }
  if (sections.values) {
    tier1.push({ label: "VALUES", section: sections.values, maxTokens: getMaxTokens(sections.values, 350) });
  }

  // Voice — convert dials to instructions (special: content is generated, not raw)
  let voiceContent = null;
  if (sections.voice) {
    let modeOverride = null;
    const overrideRegex = new RegExp(`\\*\\*${activeMode}:\\*\\*[\\s\\S]*?\`\`\`yaml\\n([\\s\\S]*?)\`\`\``, "i");
    const overrideMatch = sections.voice.content.match(overrideRegex);
    if (overrideMatch) modeOverride = overrideMatch[1];
    voiceContent = buildVoiceInstructions(sections.voice.content, modeOverride);
  }

  if (sections["skills.summary"]) {
    tier1.push({ label: "SKILLS", section: sections["skills.summary"], maxTokens: getMaxTokens(sections["skills.summary"], 200) });
  }
  if (sections.intuition) {
    tier1.push({ label: "INTUITION", section: sections.intuition, maxTokens: getMaxTokens(sections.intuition, 300) });
  }
  if (sections.writing) {
    tier1.push({ label: "WRITING VOICE", section: sections.writing, maxTokens: getMaxTokens(sections.writing, 400) });
  }
  if (sections.tools) {
    tier1.push({ label: "TOOLS", section: sections.tools, maxTokens: getMaxTokens(sections.tools, 100) });
  }
  if (sections.preferences) {
    tier1.push({ label: "PREFERENCES", section: sections.preferences, maxTokens: getMaxTokens(sections.preferences, 200) });
  }

  // TIER 2: By mode
  if (modeRoute.includes("now") && sections.now) {
    tier2.push({ label: "ACTIVE CONTEXT", section: sections.now, maxTokens: getMaxTokens(sections.now, 500) });
  }
  if (modeRoute.includes("memory.positions") && sections["memory/positions"]) {
    tier2.push({ label: "POSITIONS", section: sections["memory/positions"], maxTokens: getMaxTokens(sections["memory/positions"], 200) });
  }

  // Active mode block
  if (sections.modes) {
    const modeBlockRegex = new RegExp(`### mode: ${activeMode}[\\s\\S]*?(?=### mode:|$)`, "i");
    const modeBlock = sections.modes.content.match(modeBlockRegex);
    if (modeBlock) {
      tier2.push({
        label: `MODE: ${activeMode.toUpperCase()}`,
        section: { content: modeBlock[0], meta: sections.modes.meta || {} },
        maxTokens: getMaxTokens(sections.modes, 200),
      });
    }
  }

  // TIER 3: On trigger

  // Skill domains (full depth when keywords match)
  for (const domainId of matchedDomains) {
    if (sections[domainId]) {
      tier3.push({
        label: `SKILL DEPTH: ${sections[domainId].domainName || domainId}`,
        section: sections[domainId],
        maxTokens: getMaxTokens(sections[domainId], 300),
      });
    }
  }

  // Skill-level behavior hint (calibrate AI depth per skill level)
  if (matchedDomains.length > 0) {
    const skillHint = buildSkillBehaviorHint(matchedDomains, skillIndex, sections);
    if (skillHint) {
      tier3.push({
        label: "SKILL BEHAVIOR",
        section: { content: skillHint, meta: { priority: "high" } },
        maxTokens: 150,
      });
    }
  }

  // Memory decisions (triggered by built-in keywords or section.triggers)
  if (keywordTriggers.has("memory/decisions") && sections["memory/decisions"]) {
    tier3.push({ label: "DECISIONS LOG", section: sections["memory/decisions"], maxTokens: getMaxTokens(sections["memory/decisions"], 300) });
  }

  // Memory lessons
  if (keywordTriggers.has("memory/lessons") && sections["memory/lessons"]) {
    tier3.push({ label: "LESSONS", section: sections["memory/lessons"], maxTokens: getMaxTokens(sections["memory/lessons"], 200) });
  }

  // People — specific person blocks if mentioned
  if (mentionedPeople.length > 0) {
    for (const name of mentionedPeople) {
      if (personBlocks[name]) {
        tier3.push({
          label: `PERSON: ${name.toUpperCase()}`,
          section: { content: personBlocks[name], meta: sections.people?.meta || {} },
          maxTokens: 150,
        });
      }
    }
  } else if (keywordTriggers.has("people") && sections.people) {
    tier3.push({ label: "PEOPLE", section: sections.people, maxTokens: getMaxTokens(sections.people, 300) });
  }

  // Any other sections triggered by section.triggers but not already collected
  const collectedSections = new Set([
    ...tier1.map((t) => t.section),
    ...tier2.map((t) => t.section),
    ...tier3.map((t) => t.section),
  ]);
  for (const triggeredId of keywordTriggers) {
    if (sections[triggeredId] && !collectedSections.has(sections[triggeredId])) {
      tier3.push({
        label: triggeredId.toUpperCase().replace(/\//g, " > "),
        section: sections[triggeredId],
        maxTokens: getMaxTokens(sections[triggeredId], 200),
      });
    }
  }

  // Sort tier2 and tier3 by priority (high first, low last — low gets dropped first when budget runs out)
  const sortByPriority = (a, b) => getPriorityRank(a.section) - getPriorityRank(b.section);
  tier2.sort(sortByPriority);
  tier3.sort(sortByPriority);

  // ─── Build output with budget tracking ─────────────────────────────

  const assembled = [];
  let totalTokens = 0;

  function addEntry(label, content, maxTokens) {
    if (!content || !content.trim()) return false;
    const cleaned = cleanSection(content);
    const tokens = estimateTokens(cleaned);
    const trimmed = tokens > maxTokens
      ? cleaned.slice(0, maxTokens * 4) + "\n[...trimmed]"
      : cleaned;
    const finalTokens = Math.min(tokens, maxTokens);

    if (totalTokens + finalTokens > TOKEN_BUDGET) return false;

    assembled.push({ label, content: trimmed, tokens: finalTokens });
    totalTokens += finalTokens;
    return true;
  }

  // Tier 1: always inject (personality and expertise — never cut)
  for (const item of tier1) {
    addEntry(item.label, item.section.content, item.maxTokens);
  }

  // Voice is special — generated instructions, not raw section content
  if (voiceContent) {
    addEntry("VOICE", voiceContent, getMaxTokens(sections.voice, 250));
  }

  // Tier 2: by mode (sorted by priority)
  for (const item of tier2) {
    addEntry(item.label, item.section.content, item.maxTokens);
  }

  // Tier 3: on trigger (sorted by priority — low-priority dropped first when budget runs out)
  for (const item of tier3) {
    addEntry(item.label, item.section.content, item.maxTokens);
  }

  // ─── Compose final injection ────────────────────────────────────────

  const header = `You are assisting ${getSectionValue(sections.identity, "name") || "the user"}. Use the following curated context from their soul.md — their portable AI identity layer. Adapt your behavior to match their values, voice, and skill levels.\n`;

  const body = assembled
    .map((s) => `=== ${s.label} ===\n${s.content}`)
    .join("\n\n");

  return {
    text: header + "\n" + body,
    totalTokens,
    sectionsUsed: assembled.map((s) => s.label),
    mode: activeMode,
    triggeredBy: [...keywordTriggers],
    matchedDomains,
    mentionedPeople,
  };
}

// ─── Helper ───────────────────────────────────────────────────────────

function getSectionValue(section, key) {
  if (!section) return null;
  const match = section.content.match(new RegExp(`${key}:\\s*(.+)`));
  return match ? match[1].trim() : null;
}
