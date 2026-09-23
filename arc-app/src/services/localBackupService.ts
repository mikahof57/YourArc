import { localSaveRepository } from './localSaveService';
import { createArcBackupFileName, parseArcBackup, serializeArcBackup } from '../features/savegame/arcPortableBackup';
import type { ArcSaveGame } from '../features/savegame/arcSaveGame';

export async function exportLocalArcBackup(): Promise<{ fileName: string; contents: string }> {
  const envelope = await localSaveRepository.export();
  return { fileName: createArcBackupFileName(envelope.exportedAt), contents: serializeArcBackup(envelope) };
}

export async function importLocalArcBackup(contents: string): Promise<ArcSaveGame> {
  return localSaveRepository.import(parseArcBackup(contents));
}

export async function shareOrDownloadArcBackup(): Promise<void> {
  const backup = await exportLocalArcBackup();
  const file = new File([backup.contents], backup.fileName, { type: 'application/json' });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'ARC Backup' });
    return;
  }
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = backup.fileName; anchor.click();
  URL.revokeObjectURL(url);
}
