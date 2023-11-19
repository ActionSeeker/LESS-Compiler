import { FileSystemHandler } from './file-system-handler/file-system-handler';

export default class LessCompiler {
  private path: string;

  // private target?: string;

  private contents: string;

  private fsHandler: FileSystemHandler;

  public constructor(path: string) {
    this.initConstructors();

    if (!this.fsHandler.fileExists(path)) {
      throw new Error(`ENOENT: FIle ${path} path is invalid`);
    }

    this.path = path;
  }

  public parse(): this {
    this.contents = this.fsHandler.readContents(this.path);
    return this;
  }

  private initConstructors(): this {
    this.fsHandler = new FileSystemHandler();
    return this;
  }
}
