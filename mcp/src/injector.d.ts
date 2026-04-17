/**
 * Type declarations for injector.js
 */

import type { ParsedSoul } from "./parser.js";

export interface InjectionResult {
  text: string;
  totalTokens: number;
  sectionsUsed: string[];
  mode: string;
  triggeredBy: string[];
  matchedDomains: string[];
  mentionedPeople: string[];
}

export function buildInjection(opts: {
  soul: ParsedSoul;
  mode: string;
  userMessage: string;
}): InjectionResult;
