import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { drive, auth } from '@googleapis/drive';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  async runWeeklyBackup(): Promise<{ success: boolean; message: string }> {
    const folderId = process.env.GOOGLE_DRIVE_BACKUP_FOLDER_ID;
    const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
    if (!folderId || !keyPath) {
      const message = 'GOOGLE_DRIVE_BACKUP_FOLDER_ID or GOOGLE_SERVICE_ACCOUNT_KEY_PATH is not set — skipping database backup.';
      this.logger.warn(message);
      return { success: false, message };
    }
    if (!fs.existsSync(keyPath)) {
      const message = `Google service account key file not found at ${keyPath} — skipping database backup.`;
      this.logger.warn(message);
      return { success: false, message };
    }

    const tempDir = path.join(process.cwd(), '.temp', 'backups');
    fs.mkdirSync(tempDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `theia-gems-backup-${timestamp}.sql.gz`;
    const gzipPath = path.join(tempDir, filename);

    try {
      await this.dumpAndCompress(gzipPath);
      const fileId = await this.uploadToDrive(gzipPath, filename, folderId, keyPath);
      const deletedCount = await this.pruneOldBackups(folderId, keyPath);

      const message = `Database backup "${filename}" uploaded to Google Drive (fileId: ${fileId})` +
        (deletedCount > 0 ? `, pruned ${deletedCount} old backup(s).` : '.');
      this.logger.log(message);
      return { success: true, message };
    } catch (e) {
      this.logger.error('runWeeklyBackup error', e);
      return { success: false, message: e?.message || 'runWeeklyBackup failed' };
    } finally {
      fs.promises.unlink(gzipPath).catch(() => {});
    }
  }

  /** Streams `mysqldump` straight through gzip into a .sql.gz file — no uncompressed dump ever touches disk. */
  private dumpAndCompress(outputGzipPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const mysqldumpPath = process.env.MYSQLDUMP_PATH || 'mysqldump';
      const args = [
        `--host=${process.env.DATABASE_HOST}`,
        `--port=${process.env.DATABASE_PORT || '3306'}`,
        `--user=${process.env.DATABASE_USER}`,
        '--single-transaction',
        '--routines',
        '--triggers',
        process.env.DATABASE_NAME || '',
      ];

      // Password passed via env (MYSQL_PWD), never on the command line, so it can't leak via the process list.
      const child = spawn(mysqldumpPath, args, {
        env: { ...process.env, MYSQL_PWD: process.env.DATABASE_PASSWORD || '' },
      });

      const output = fs.createWriteStream(outputGzipPath);
      const gzip = zlib.createGzip();
      let stderr = '';
      child.stderr.on('data', (chunk) => (stderr += chunk.toString()));
      child.on('error', (err) => reject(new Error(`Failed to start mysqldump: ${err.message}`)));

      output.on('error', reject);
      output.on('finish', resolve);

      child.stdout.pipe(gzip).pipe(output);

      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`mysqldump exited with code ${code}: ${stderr.trim()}`));
        }
      });
    });
  }

  private getDriveClient(keyPath: string) {
    const googleAuth = new auth.GoogleAuth({
      keyFile: keyPath,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });
    return drive({ version: 'v3', auth: googleAuth });
  }

  private async uploadToDrive(filePath: string, filename: string, folderId: string, keyPath: string): Promise<string> {
    const drive = this.getDriveClient(keyPath);
    const res = await drive.files.create({
      requestBody: { name: filename, parents: [folderId] },
      media: { mimeType: 'application/gzip', body: fs.createReadStream(filePath) },
      fields: 'id',
    });
    if (!res.data.id) throw new Error('Google Drive did not return a file id after upload.');
    return res.data.id;
  }

  /** Keeps only the most recent GOOGLE_DRIVE_BACKUP_RETENTION backups in the Drive folder; returns how many were deleted. */
  private async pruneOldBackups(folderId: string, keyPath: string): Promise<number> {
    const retention = parseInt(process.env.GOOGLE_DRIVE_BACKUP_RETENTION || '8', 10);
    const drive = this.getDriveClient(keyPath);
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      orderBy: 'createdTime desc',
      fields: 'files(id, name)',
      pageSize: 100,
    });

    const files = res.data.files || [];
    const stale = files.slice(retention);
    for (const file of stale) {
      if (!file.id) continue;
      await drive.files.delete({ fileId: file.id }).catch((e) =>
        this.logger.warn(`Failed to delete stale backup "${file.name}": ${e?.message}`),
      );
    }
    return stale.length;
  }
}
