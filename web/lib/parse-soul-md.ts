/**
 * Parses soul.md template content into a structure matching SoulData from OnboardingFlow.tsx.
 * Uses regex-based extraction - no external YAML library. Handles missing sections gracefully.
 */

export type ParsedSoulData = {
  identity: {
    name: string;
    role: string;
    company: string;
    one_liner: string;
    timezone: string;
    languages: string;
  };
  how_i_think: {
    thinking_mode: string;
    decision_style: string;
    risk_tolerance: string;
    blind_spots: string;
  };
  values: {
    core_principles: string[];
    speed_vs_quality: string;
    growth_vs_profit: string;
    team_vs_outcome: string;
    non_negotiables: string[];
    definition_of_success: string;
  };
  voice: Record<string, number | string>;
  skills: {
    domains: { name: string; level: string; years: string; keywords: string }[];
    working_knowledge: { skill: string; context: string }[];
    building_toward: { skill: string; context: string }[];
  };
};

const EMPTY_IDENTITY = {
  name: "",
  role: "",
  company: "",
  one_liner: "",
  timezone: "",
  languages: "",
};

const EMPTY_HOW_I_THINK = {
  thinking_mode: "",
  decision_style: "",
  risk_tolerance: "",
  blind_spots: "",
};

const EMPTY_VALUES = {
  core_principles: [] as string[],
  speed_vs_quality: "",
  growth_vs_profit: "",
  team_vs_outcome: "",
  non_negotiables: [] as string[],
  definition_of_success: "",
};

const VOICE_DIAL_KEYS = [
  "humor",
  "sarcasm",
  "directness",
  "patience",
  "formality",
  "creativity",
  "challenge",
  "warmth",
  "confidence",
  "verbosity",
];

const DEFAULT_VOICE: Record<string, number> = {
  humor: 50,
  sarcasm: 30,
  directness: 70,
  patience: 50,
  formality: 30,
  creativity: 50,
  challenge: 60,
  warmth: 50,
  confidence: 70,
  verbosity: 40,
};

function extractSection(content: string, startMarker: string, endMarker?: string): string {
  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) return "";
  const searchFrom = startIdx + startMarker.length;
  const endIdx = endMarker ? content.indexOf(endMarker, searchFrom) : content.length;
  const end = endIdx === -1 ? content.length : endIdx;
  return content.slice(searchFrom, end).trim();
}


function parseYamlBlock(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = text.split("\n");
  for (const line of lines) {
    const match = line.match(/^(\w[\w_]*):\s*(.*)$/);
    if (match) {
      const [, key, value] = match;
      result[key] = (value ?? "").trim();
    }
  }
  return result;
}

function parseDialValue(value: string): number | null {
  const match = value.match(/(\d+)\s*\/\s*100/);
  return match ? parseInt(match[1], 10) : null;
}

function extractBulletList(section: string): string[] {
  const bullets: string[] = [];
  const lines = section.split("\n");
  for (const line of lines) {
    const match = line.match(/^\s*-\s+(.*)$/);
    if (match) {
      bullets.push(match[1].trim());
    }
  }
  return bullets;
}

function extractFencedBlock(section: string): string {
  const match = section.match(/```\s*\n?([\s\S]*?)```/);
  return match ? match[1].trim() : "";
}

function parseIdentity(content: string): ParsedSoulData["identity"] {
  const identitySection = extractSection(content, "## /identity", "\n## ");
  const yamlMatch = identitySection.match(/```yaml\s*\n([\s\S]*?)```/);
  if (!yamlMatch) return { ...EMPTY_IDENTITY };

  const parsed = parseYamlBlock(yamlMatch[1]);
  return {
    name: parsed.name ?? "",
    role: parsed.role ?? "",
    company: parsed.company ?? "",
    one_liner: parsed.one_liner ?? "",
    timezone: parsed.timezone ?? "",
    languages: parsed.languages ?? "",
  };
}

function parseHowIThink(content: string): ParsedSoulData["how_i_think"] {
  const identitySection = extractSection(content, "## /identity", "\n## ");
  const howIThinkSection = extractSection(identitySection, "### how_i_think", "### ");
  const yamlMatch = howIThinkSection.match(/```yaml\s*\n([\s\S]*?)```/);
  if (!yamlMatch) return { ...EMPTY_HOW_I_THINK };

  const parsed = parseYamlBlock(yamlMatch[1]);
  return {
    thinking_mode: parsed.thinking_mode ?? "",
    decision_style: parsed.decision_style ?? "",
    risk_tolerance: parsed.risk_tolerance ?? "",
    blind_spots: parsed.blind_spots ?? "",
  };
}

function parseValues(content: string): ParsedSoulData["values"] {
  const valuesSection = extractSection(content, "## /values", "\n## ");
  const result = { ...EMPTY_VALUES };

  // core_principles: bullets between ### core_principles and ### when_values_conflict
  const coreSection = extractSection(valuesSection, "### core_principles", "### ");
  result.core_principles = extractBulletList(coreSection).filter(Boolean);

  // when_values_conflict: yaml block
  const conflictSection = extractSection(valuesSection, "### when_values_conflict", "### ");
  const conflictYaml = conflictSection.match(/```yaml\s*\n([\s\S]*?)```/);
  if (conflictYaml) {
    const parsed = parseYamlBlock(conflictYaml[1]);
    result.speed_vs_quality = parsed.speed_vs_quality ?? "";
    result.growth_vs_profit = parsed.growth_vs_profit ?? "";
    result.team_vs_outcome = parsed.team_vs_outcome ?? "";
  }

  // non_negotiables: bullets
  const nonNegSection = extractSection(valuesSection, "### non_negotiables", "### ");
  result.non_negotiables = extractBulletList(nonNegSection).filter(Boolean);

  // definition_of_success: fenced block
  const defSection = extractSection(valuesSection, "### definition_of_success", "## ");
  result.definition_of_success = extractFencedBlock(defSection);

  return result;
}

function parseVoice(content: string): ParsedSoulData["voice"] {
  const voiceSection = extractSection(content, "## /voice", "\n## ");
  const result: Record<string, number | string> = { ...DEFAULT_VOICE };

  // personality_dials: extract numbers from "65/100" format
  const dialsSection = extractSection(voiceSection, "### personality_dials", "### ");
  const dialsYaml = dialsSection.match(/```yaml\s*\n([\s\S]*?)```/);
  if (dialsYaml) {
    const lines = dialsYaml[1].split("\n");
    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.*)$/);
      if (match && VOICE_DIAL_KEYS.includes(match[1])) {
        const num = parseDialValue(match[2]);
        if (num !== null) result[match[1]] = num;
      }
    }
  }

  // ai_personality: fenced block
  const aiSection = extractSection(voiceSection, "### ai_personality", "### ");
  const aiPersonality = extractFencedBlock(aiSection);
  result.ai_personality = aiPersonality;

  return result;
}

function parseSkills(content: string): ParsedSoulData["skills"] {
  const skillsSection = extractSection(content, "## /skills", "\n## ");
  const summarySection = extractSection(skillsSection, "### skills.summary", "### ");
  const yamlMatch = summarySection.match(/```yaml\s*\n([\s\S]*?)```/);

  const result = {
    domains: [] as { name: string; level: string; years: string; keywords: string }[],
    working_knowledge: [] as { skill: string; context: string }[],
    building_toward: [] as { skill: string; context: string }[],
  };

  if (!yamlMatch) return result;

  const block = yamlMatch[1];

  // Parse domains: - name: X \n level: Y \n years: Z \n keywords: W
  const domainsBlock = extractSection(block, "domains:", "working_knowledge:");
  const domainMatches = domainsBlock.matchAll(
    /-\s*name:\s*([^\n]*)\s*\n\s*level:\s*([^\n]*)\s*\n\s*years:\s*([^\n]*)\s*\n\s*keywords:\s*([^\n]*)/g
  );
  for (const m of domainMatches) {
    result.domains.push({
      name: (m[1] ?? "").trim(),
      level: (m[2] ?? "").trim(),
      years: (m[3] ?? "").trim(),
      keywords: (m[4] ?? "").trim(),
    });
  }

  // Parse working_knowledge: - skill: X \n context: Y
  const wkBlock = extractSection(block, "working_knowledge:", "building_toward:");
  const wkMatches = wkBlock.matchAll(
    /-\s*skill:\s*([^\n]*)\s*\n\s*context:\s*([^\n]*)/g
  );
  for (const m of wkMatches) {
    result.working_knowledge.push({
      skill: (m[1] ?? "").trim(),
      context: (m[2] ?? "").trim(),
    });
  }

  // Parse building_toward: - skill: X \n context: Y
  const btBlock = block.slice(block.indexOf("building_toward:"));
  const btMatches = btBlock.matchAll(
    /-\s*skill:\s*([^\n]*)\s*\n\s*context:\s*([^\n]*)/g
  );
  for (const m of btMatches) {
    result.building_toward.push({
      skill: (m[1] ?? "").trim(),
      context: (m[2] ?? "").trim(),
    });
  }

  return result;
}

/**
 * Parses soul.md template content into a structure matching SoulData.
 * Handles missing sections gracefully - returns empty strings/arrays for missing data.
 */
export function parseSoulMd(content: string): ParsedSoulData {
  return {
    identity: parseIdentity(content),
    how_i_think: parseHowIThink(content),
    values: parseValues(content),
    voice: parseVoice(content),
    skills: parseSkills(content),
  };
}
