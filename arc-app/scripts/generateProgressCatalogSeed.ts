import { createHash } from 'node:crypto';
import {
  createCanonicalPresetTaskCatalog,
  serializeCanonicalPresetTaskCatalog,
} from '../src/utils/presetTaskCatalog';

function sqlText(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

const catalog = createCanonicalPresetTaskCatalog();
const rows = catalog.map((task) => {
  const canonicalRow = JSON.stringify({
    catalogVersion: task.catalogVersion,
    taskKey: task.taskKey,
    canonicalStatKey: task.canonicalStatKey,
    tier: task.tier,
    order: task.order,
    title: task.title,
    description: task.description,
  });
  const contentHash = createHash('sha256').update(canonicalRow, 'utf8').digest('hex');

  return `  (${[
    sqlText(task.catalogVersion),
    sqlText(task.taskKey),
    sqlText(task.canonicalStatKey),
    task.tier,
    task.order,
    sqlText(task.title),
    sqlText(task.description),
    'true',
    sqlText(contentHash),
  ].join(', ')})`;
});

const catalogFingerprint = createHash('sha256')
  .update(serializeCanonicalPresetTaskCatalog(catalog), 'utf8')
  .digest('hex');

process.stdout.write([
  `-- Generated from arc_tasks_v1: ${catalog.length} rows; canonical fingerprint: ${catalogFingerprint}`,
  'insert into public.arc_preset_tasks (',
  '  catalog_version, task_key, canonical_stat_key, tier, sort_order,',
  '  title, description, active, content_hash',
  ') values',
  `${rows.join(',\n')};`,
  '',
].join('\n'));
