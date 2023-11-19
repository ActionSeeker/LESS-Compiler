import { expect } from 'chai';
import { fileURLToPath } from 'url';
import * as path from 'path';
import { FileSystemHandler } from './file-system-handler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('File system handler', () => {
  const fileSystemHandler = new FileSystemHandler();

  describe('fileExists()', () => {
    it('Should return false if the file does not exist', () => {
      expect(
        fileSystemHandler.fileExists('random/path/to/a/non-existant/file')
      ).to.equal(false);
    });

    it('Should return false if the file does not exist', () => {
      expect(
        fileSystemHandler.fileExists(
          path.join(__dirname, 'file-system-handler.ts')
        )
      ).to.equal(true);
    });
  });
});
