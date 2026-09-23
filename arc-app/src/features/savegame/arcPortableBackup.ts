import { isArcSaveEnvelope } from './arcSaveValidation';
import type { ArcSaveEnvelope } from './arcSaveGame';
import { ARC_SAVEGAME_SCHEMA_VERSION } from './arcSaveGame';

export const ARC_BACKUP_FILE_EXTENSION = '.arcbackup';
export const ARC_BACKUP_MAX_BYTES = 20 * 1024 * 1024;

export function serializeArcBackup(envelope: ArcSaveEnvelope): string {
  if (!isArcSaveEnvelope(envelope)) throw new Error('arc_backup_invalid');
  return JSON.stringify(envelope, null, 2);
}

export function parseArcBackup(raw: string): ArcSaveEnvelope {
  if (new TextEncoder().encode(raw).byteLength > ARC_BACKUP_MAX_BYTES) throw new Error('arc_backup_too_large');
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error('arc_backup_malformed'); }
  if (parsed && typeof parsed === 'object' && Reflect.get(parsed, 'format') === 'arc-savegame'
    && Number(Reflect.get(parsed, 'formatVersion')) > 1) throw new Error('arc_backup_newer_version');
  const nestedSave = parsed && typeof parsed === 'object' ? Reflect.get(parsed, 'save') : null;
  if (nestedSave && typeof nestedSave === 'object'
    && Number(Reflect.get(nestedSave, 'schemaVersion')) > ARC_SAVEGAME_SCHEMA_VERSION) throw new Error('arc_backup_newer_version');
  if (!isArcSaveEnvelope(parsed)) throw new Error('arc_backup_invalid');
  return parsed;
}

export function createArcBackupFileName(exportedAt: string): string {
  return `arc-backup-${exportedAt.replace(/[:.]/g, '-')}${ARC_BACKUP_FILE_EXTENSION}`;
}
