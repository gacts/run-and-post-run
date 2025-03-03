import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals'
import { promises as fsp } from 'node:fs'
import { join as pathJoin } from 'node:path'
import { tmpdir } from 'node:os'

const randomBytes = jest.fn()

jest.unstable_mockModule('node:crypto', () => ({
  randomBytes: randomBytes,
}))

const tmpFile = await import('./tmpfile.js').then((a) => a.default)

describe('createTmpFile', () => {
  let tmpDir = ''

  beforeEach(async () => {
    tmpDir = await fsp.mkdtemp(pathJoin(tmpdir(), '/tmp-test'))
  })

  afterEach(async () => {
    jest.resetAllMocks()
    await fsp.rmdir(tmpDir, { recursive: true })
  })

  it('should create and delete a temporary file', async () => {
    randomBytes.mockClear().mockReturnValue(Buffer.from('123456', 'hex'))

    const suffix = '.tmp',
      prefix = pathJoin(tmpDir, 'tmpfile-'),
      name = `${prefix}123456${suffix}`

    const file = await tmpFile(suffix, tmpDir)

    try {
      await file.handl.close()

      expect(file.name).toBe(name)

      expect((await fsp.stat(file.name)).isFile()).toBe(true)
    } finally {
      await file.delete()

      await expect(fsp.stat(name)).rejects.toThrow('ENOENT')
    }
  })

  it('should retry to crate a file', async () => {
    const suffix = '.tmp',
      prefix = pathJoin(tmpDir, 'tmpfile-'),
      existedHex = '111111',
      newHex = '222222',
      existedFilePath = `${prefix}${existedHex}${suffix}`,
      newFilePath = `${prefix}${newHex}${suffix}`

    randomBytes
      .mockClear()
      .mockReturnValueOnce(Buffer.from(existedHex, 'hex'))
      .mockReturnValueOnce(Buffer.from(newHex, 'hex'))

    // write a file with the first name to hit the EEXIST error
    await fsp.writeFile(existedFilePath, 'test')

    try {
      const file = await tmpFile(suffix, tmpDir) // should create the file

      try {
        await file.handl.close()

        expect(file.name).toBe(newFilePath)

        expect((await fsp.stat(file.name)).isFile()).toBe(true)
      } finally {
        await file.delete()
      }
    } finally {
      await fsp.rm(existedFilePath)
    }
  })

  it('should throw an error if the file could not be created', async () => {
    randomBytes.mockClear().mockReturnValue(Buffer.from('123456', 'hex'))

    await expect(tmpFile('.tmp', '/non-existing-dir')).rejects.toThrow(
      'Failed to create temporary file, code: ENOENT'
    )
  })

  it('should throw an error if too many attempts', async () => {
    randomBytes.mockClear().mockReturnValue(Buffer.from('123456', 'hex'))

    const existedFilePath = pathJoin(tmpDir, `tmpfile-123456.tmp`)

    // write a file with the first name to hit the EEXIST error
    await fsp
      .writeFile(existedFilePath, 'test')
      .then(async () => {
        return expect(tmpFile('.tmp', tmpDir)).rejects.toThrow(
          'Failed to create temporary file, too many attempts'
        )
      })
      .finally(() => fsp.rm(existedFilePath))
  })
})

describe('collisions', () => {
  it('should not collide', async () => {
    const dirName = await fsp.mkdtemp('tmp-test')

    for (let i = 0; i < 100_000_000; i++) {
      await fsp.mkdtemp(pathJoin(dirName, 'tmp-test'))
    }

    await fsp.rmdir(dirName, { recursive: true })
  }, 70_000_000)
})
