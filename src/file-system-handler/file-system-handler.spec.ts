import { expect } from 'chai';
import { FileSystemHandler } from './file-system-handler';

describe('File system handler', () => {
  const fileSystemHandler = new FileSystemHandler();

  describe('fileExists()', () => {
    it('Should return false if the file does not exist', () => {
      expect(
        fileSystemHandler.fileExists('random/path/to/a/non-existant/file')
      ).to.equal(false);
    });
  });
});
