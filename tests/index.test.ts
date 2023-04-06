import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { randomUUID } from 'crypto'

vi.mock('esbuild')

describe('index.ts', async () => {
  let index: typeof import('..')

  const builder = {
    log: {
      minor: vi.fn((x) => console.log(x)),
    },
    writeClient: vi.fn(() => {
      return ['assets/a', 'assets/b', 'assets/c']
    }),
    writePrerendered: vi.fn(() => {
      return ['prerendered/a', 'prerendered/b', 'prerendered/c']
    }),
    writeServer: vi.fn(async (x) => {
      await fs.promises.appendFile(path.join(x, 'index.js'), '')
    }),
  }

  beforeEach(async () => {
    vi.resetModules()
    index = await import('..')
  })

  it('buildServer', async () => {
    const tmpDir = getTempDir()

    const { server_directory, static_directory, prerendered_directory } =
      await index.buildServer(builder, tmpDir)

    expect(server_directory).toMatch(path.join(tmpDir, 'server'))
    expect(static_directory).toMatch(path.join(tmpDir, 'assets'))
    expect(prerendered_directory).toMatch(path.join(tmpDir, 'prerendered'))

    fs.rmSync(tmpDir, { recursive: true })
  })
})

function getTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), randomUUID()))
}
