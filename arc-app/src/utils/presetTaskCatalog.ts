import {
  ARC_PRESET_TASK_CATALOG_VERSION,
  CANONICAL_STAT_KEYS,
  CanonicalStatKey,
} from '../config/progression';
import { get365PresetTasksForStat } from '../data/taskDatabase';

export type PresetCatalogLanguage = 'de' | 'en';

export interface CanonicalPresetTask {
  catalogVersion: typeof ARC_PRESET_TASK_CATALOG_VERSION;
  taskKey: string;
  canonicalStatKey: CanonicalStatKey;
  tier: number;
  order: number;
  title: string;
  description: string;
}

export interface PresetCatalogValidationIssue {
  code: string;
  path: string;
  message: string;
}

const DEFAULT_STAT_NAMES: Record<CanonicalStatKey, string> = {
  wissen: 'Wissen',
  muskeln: 'Muskeln',
  geist: 'Geist',
  beweglichkeit: 'Beweglichkeit',
  business: 'Business',
  geld: 'Geld',
};

/**
 * Produces the frozen canonical seed representation. German is the current
 * source-language content; localization never participates in task identity.
 */
export function createCanonicalPresetTaskCatalog(): CanonicalPresetTask[] {
  return createPresetTaskCatalogForLanguage('de');
}

/** Produces a localized content variant with the same stable task keys. */
export function createPresetTaskCatalogForLanguage(
  language: PresetCatalogLanguage,
): CanonicalPresetTask[] {
  return CANONICAL_STAT_KEYS.flatMap((canonicalStatKey) =>
    get365PresetTasksForStat(
      canonicalStatKey,
      DEFAULT_STAT_NAMES[canonicalStatKey],
      language,
    ).map((task) => ({
      catalogVersion: ARC_PRESET_TASK_CATALOG_VERSION,
      taskKey: task.id,
      canonicalStatKey,
      tier: task.tier as number,
      order: task.order,
      title: task.title,
      description: task.description,
    })),
  );
}

/**
 * Canonical serialization rules:
 * - sort by the fixed CANONICAL_STAT_KEYS order, then numeric order, then taskKey;
 * - emit the seven fields below in exactly this order;
 * - JSON.stringify with no whitespace; callers hash its UTF-8 bytes;
 * - include no locale sorting, timestamps, or runtime-generated values.
 */
export function serializeCanonicalPresetTaskCatalog(
  catalog: readonly CanonicalPresetTask[] = createCanonicalPresetTaskCatalog(),
): string {
  const statOrder = new Map(CANONICAL_STAT_KEYS.map((key, index) => [key, index]));
  const ordered = [...catalog].sort((a, b) => {
    const statDifference = (statOrder.get(a.canonicalStatKey) ?? Number.MAX_SAFE_INTEGER)
      - (statOrder.get(b.canonicalStatKey) ?? Number.MAX_SAFE_INTEGER);
    if (statDifference !== 0) return statDifference;
    if (a.order !== b.order) return a.order - b.order;
    return a.taskKey < b.taskKey ? -1 : a.taskKey > b.taskKey ? 1 : 0;
  });

  return JSON.stringify(ordered.map((task) => ({
    catalogVersion: task.catalogVersion,
    taskKey: task.taskKey,
    canonicalStatKey: task.canonicalStatKey,
    tier: task.tier,
    order: task.order,
    title: task.title,
    description: task.description,
  })));
}

export async function fingerprintCanonicalPresetTaskCatalog(
  catalog: readonly CanonicalPresetTask[] = createCanonicalPresetTaskCatalog(),
): Promise<string> {
  const bytes = new TextEncoder().encode(serializeCanonicalPresetTaskCatalog(catalog));
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function validateCanonicalPresetTaskCatalog(
  input: unknown,
): PresetCatalogValidationIssue[] {
  const issues: PresetCatalogValidationIssue[] = [];
  if (!Array.isArray(input)) {
    return [{ code: 'catalog_not_array', path: '$', message: 'Catalog must be an array.' }];
  }

  const knownStats = new Set<string>(CANONICAL_STAT_KEYS);
  const taskKeys = new Set<string>();
  const orders = new Set<string>();

  input.forEach((candidate, index) => {
    const path = `$[${index}]`;
    if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) {
      issues.push({ code: 'task_malformed', path, message: 'Task must be an object.' });
      return;
    }

    const task = candidate as Partial<CanonicalPresetTask>;
    if (typeof task.taskKey !== 'string' || task.taskKey.length === 0) {
      issues.push({ code: 'task_key_missing', path: `${path}.taskKey`, message: 'Task key must be a non-empty string.' });
    } else if (taskKeys.has(task.taskKey)) {
      issues.push({ code: 'task_key_duplicate', path: `${path}.taskKey`, message: `Duplicate task key: ${task.taskKey}` });
    } else {
      taskKeys.add(task.taskKey);
    }

    if (typeof task.canonicalStatKey !== 'string' || !knownStats.has(task.canonicalStatKey)) {
      issues.push({ code: 'canonical_stat_unknown', path: `${path}.canonicalStatKey`, message: `Unknown canonical stat: ${String(task.canonicalStatKey)}` });
    }
    if (!Number.isInteger(task.tier) || (task.tier as number) < 0 || (task.tier as number) > 12) {
      issues.push({ code: 'tier_invalid', path: `${path}.tier`, message: 'Tier must be an integer from 0 through 12.' });
    }
    if (!Number.isFinite(task.order) || !Number.isInteger(task.order) || (task.order as number) < 1) {
      issues.push({ code: 'order_invalid', path: `${path}.order`, message: 'Order must be a positive finite integer.' });
    }
    if (typeof task.title !== 'string' || task.title.trim().length === 0) {
      issues.push({ code: 'title_empty', path: `${path}.title`, message: 'Title must be a non-empty string.' });
    }
    if (typeof task.description !== 'string') {
      issues.push({ code: 'description_invalid', path: `${path}.description`, message: 'Description must be a string.' });
    }

    if (typeof task.canonicalStatKey === 'string' && Number.isInteger(task.tier) && Number.isInteger(task.order)) {
      const orderKey = `${task.canonicalStatKey}:${task.tier}:${task.order}`;
      if (orders.has(orderKey)) {
        issues.push({ code: 'order_duplicate', path: `${path}.order`, message: `Duplicate order within stat/tier: ${orderKey}` });
      } else {
        orders.add(orderKey);
      }
    }
  });

  return issues;
}
