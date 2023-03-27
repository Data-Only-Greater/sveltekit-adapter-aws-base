import { writeFileSync } from 'fs'
import { join, dirname } from 'path'

import {
  copyFileSync,
  unlinkSync,
  existsSync,
  mkdirSync,
  emptyDirSync,
} from 'fs-extra'
import * as esbuild from 'esbuild'

let STUB = 1

/**
 * @typedef {Object} SiteProps
 * @property {string} server_directory location of files for the SSR server
 * @property {string} static_directory location of static page files
 * @property {string} prerendered_directory location of prerendered page files
 * @property {string[]} routes routes to static and prerendered pages
 */
STUB = 1

type SiteProps = {
  server_directory: string
  static_directory: string
  prerendered_directory: string
  routes: string[]
}

/**
 * Prepare SvelteKit files for deployment to AWS services
 * @param {any} builder The SvelteKit provided [Builder]{@link https://kit.svelte.dev/docs/types#public-types-builder} object
 * @param {string} artifactPath The path where to place to SvelteKit files
 * @param {any} esbuildOptions Options to pass to esbuild
 * @returns {Promise<SiteProps>}
 */
export default async function (
  builder: any,
  artifactPath: string = 'build',
  esbuildOptions: any = {}
): Promise<SiteProps> {
  emptyDirSync(artifactPath)

  const static_directory = join(artifactPath, 'assets')
  if (!existsSync(static_directory)) {
    mkdirSync(static_directory, { recursive: true })
  }

  const prerendered_directory = join(artifactPath, 'prerendered')
  if (!existsSync(prerendered_directory)) {
    mkdirSync(prerendered_directory, { recursive: true })
  }

  const server_directory = join(artifactPath, 'server')
  if (!existsSync(server_directory)) {
    mkdirSync(server_directory, { recursive: true })
  }

  builder.log.minor('Copying asset files.')
  const clientFiles = await builder.writeClient(static_directory)

  builder.log.minor('Copying server files.')
  await builder.writeServer(artifactPath)
  copyFileSync(
    `${__dirname}/lambda/serverless.js`,
    `${server_directory}/_index.js`
  )
  copyFileSync(`${__dirname}/lambda/shims.js`, `${server_directory}/shims.js`)

  builder.log.minor('Building AWS Lambda server function.')
  esbuild.buildSync({
    entryPoints: [`${server_directory}/_index.js`],
    outfile: `${server_directory}/index.js`,
    inject: [join(`${server_directory}/shims.js`)],
    external: ['node:*', ...(esbuildOptions?.external ?? [])],
    format: esbuildOptions?.format ?? 'cjs',
    banner: esbuildOptions?.banner ?? {},
    bundle: true,
    platform: 'node',
    target: esbuildOptions?.target ?? 'node16',
    treeShaking: true,
  })

  builder.log.minor('Prerendering static pages.')
  const prerenderedFiles = await builder.writePrerendered(prerendered_directory)

  builder.log.minor('Cleanup project.')
  unlinkSync(`${server_directory}/_index.js`)
  unlinkSync(`${artifactPath}/index.js`)

  builder.log.minor('Exporting routes.')

  const routes: string[] = [
    ...new Set(
      [...clientFiles, ...prerenderedFiles]
        .map((x) => {
          const z = dirname(x)
          if (z === '.') return x
          if (z.includes('/')) return undefined
          return `${z}/*`
        })
        .filter(Boolean)
    ),
  ]

  writeFileSync(join(artifactPath, 'routes.json'), JSON.stringify(routes))

  return {
    server_directory,
    static_directory,
    prerendered_directory,
    routes,
  }
}
