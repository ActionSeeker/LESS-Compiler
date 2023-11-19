import { FileSystemHandler } from './file-system-handler/file-system-handler';

export class LessCompiler {
  private path: string;
  private target?: string;
  private contents: string;

  private _fsHandler: FileSystemHandler;

  public constructor(path: string, target?: string) {
    this.initConstructors();

    if (!this._fsHandler.fileExists(path)) {
      throw new Error(`ENOENT: FIle ${path} path is invalid`);
    }

    this.path = path;
    return this;
  }

  public parse() {
    this.contents = this._fsHandler.readContents(this.path);
  }

  private initConstructors(): this {
    this._fsHandler = new FileSystemHandler();
    return this;
  }
}
