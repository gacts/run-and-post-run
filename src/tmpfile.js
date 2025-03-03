import { randomBytes } from 'node:crypto'
import { constants as fsConstants, promises as fsp } from 'node:fs'
import { join as pathJoin } from 'node:path'
import { tmpdir } from 'node:os'

const fileMode = fsConstants.S_IRUSR | fsConstants.S_IWUSR | fsConstants.S_IXUSR
const fileFlags = fsConstants.O_CREAT | fsConstants.O_RDWR | fsConstants.O_EXCL

/**
 * Create a temporary file with the given suffix
 *
 * @param suffix{string}
 * @param tmpDir{string} - optional, default is the system tmp directory
 * @return {Promise<{handl: FileHandle, name: string, delete: (function(): Promise<void>)}>}
 *
 * @throws {Error} if the file could not be created
 */
export default async function createTmpFile(suffix, tmpDir = '') {
  if (tmpDir === '') {
    tmpDir = tmpdir()
  }

  const prefix = pathJoin(tmpDir, 'tmpfile-')

  for (let i = 0; i < 10000; i++) {
    const name = prefix + randomBytes(6).toString('hex') + suffix

    try {
      return {
        handl: await fsp.open(name, fileFlags, fileMode),
        name: name,
        delete: async () => fsp.rm(name),
      }
    } catch (err) {
      if (err.code === 'EEXIST') {
        continue
      }

      throw new Error(`Failed to create temporary file, code: ${err.code}`, {
        cause: err,
      })
    }
  }

  throw new Error('Failed to create temporary file, too many attempts')
}
