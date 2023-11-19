import * as fs from 'fs';

export class FileSystemHandler {
  public fileExists(path: string): boolean {
    return fs.existsSync(path);
  }

  public readContents(path: string): string {
    return fs.readFileSync(path, { encoding: 'utf-8' });
  }
}
