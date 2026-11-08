import { ResearchJob } from '../types';

type GroundedFact = NonNullable<ResearchJob['result']>['known_facts'][number];

function normalizeResearchText(value: string): string {
  return value.replace(/^\s*(?:[-*•]|\d+[.)])\s*/u, '').replace(/\s+/gu, ' ').trim().toLocaleLowerCase();
}

export function uniqueResearchText(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalizeResearchText(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function uniqueResearchLines(value: string): string {
  return uniqueResearchText(value.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean)).join('\n');
}

export function consolidateGroundedFacts(items: GroundedFact[]): GroundedFact[] {
  const groups = new Map<string, GroundedFact>();
  for (const item of items) {
    const key = normalizeResearchText(item.claim);
    if (!key) continue;
    const itemSources = item.sources?.length
      ? item.sources
      : [{ source_name: item.source_name, source_url: item.source_url }];
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, { ...item, sources: [...itemSources] });
      continue;
    }
    const sources = existing.sources || [];
    for (const source of itemSources) {
      if (!sources.some((candidate) => candidate.source_url === source.source_url)) sources.push(source);
    }
    existing.sources = sources;
  }
  return [...groups.values()];
}
