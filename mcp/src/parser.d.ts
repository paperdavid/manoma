/**
 * Type declarations for parser.js
 */

export interface SectionMeta {
  priority: string;
  stability: string;
  inject: string;
  max_tokens: number;
}

export interface Section {
  id: string;
  parent?: string;
  content: string;
  meta: SectionMeta;
  triggers: string[];
  children?: string[];
  domainName?: string;
}

export interface SkillDomain {
  name: string;
  level: string;
  years: string;
  keywords: string[];
}

export interface SkillIndex {
  domains: SkillDomain[];
  working: string[];
  building: string[];
}

export interface SoulConfig {
  version?: string;
  default_mode: string;
  active_mode: string;
  mode_routing: Record<string, string[]>;
}

export interface ParsedSoul {
  raw: string;
  config: SoulConfig;
  sections: Record<string, Section>;
  skillIndex: SkillIndex;
  personNames: string[];
  personBlocks: Record<string, string>;
}

export function parseSoul(filePath: string): ParsedSoul;
export function parseSoulFromString(raw: string): ParsedSoul;
export function estimateTokens(text: string): number;
