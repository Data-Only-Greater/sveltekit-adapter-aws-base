import * as fs from 'fs'
import * as url from 'url'
import { join, dirname } from 'path'

import pkg from 'fs-extra'
const { copyFileSync, unlinkSync, existsSync, mkdirSync, emptyDirSync } = pkg
import * as esbuild from 'esbuild'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

let STUB = 1

/**
 * @typedef {Object} SiteProps
 * @property {string} server_directory location of files for the SSR server
 * @property {string} edge_directory location of files for the routing edge function
 * @property {string} static_directory location of static page files
 * @property {string} prerendered_directory location of prerendered page files
 */
STUB = 1

type SiteProps = {
  server_directory: string
  edge_directory: string
  static_directory: string
  prerendered_directory: string
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

  const edge_directory = join(artifactPath, 'edge')
  if (!existsSync(edge_directory)) {
    mkdirSync(edge_directory, { recursive: true })
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
    target: esbuildOptions?.target ?? 'node18',
  })

  builder.log.minor('Prerendering static pages.')
  const prerenderedFiles = await builder.writePrerendered(prerendered_directory)

  console.log('Building router')
  copyFileSync(`${__dirname}/lambda/router.js`, `${edge_directory}/_router.js`)
  let files = JSON.stringify([
    ...getAllFiles(static_directory),
    ...getAllFiles(prerendered_directory),
  ])
  fs.writeFileSync(`${edge_directory}/static.js`, `export default ${files}`)

  esbuild.buildSync({
    entryPoints: [`${edge_directory}/_router.js`],
    outfile: `${edge_directory}/router.js`,
    format: 'cjs',
    bundle: true,
    platform: 'node',
  })

  builder.log.minor('Cleanup project.')
  unlinkSync(`${server_directory}/_index.js`)
  unlinkSync(`${edge_directory}/_router.js`)
  unlinkSync(`${artifactPath}/index.js`)

  return {
    server_directory,
    edge_directory,
    static_directory,
    prerendered_directory,
  }
}

const getAllFiles = function (
  dirPath: string,
  basePath?: string,
  arrayOfFiles?: string[]
) {
  const files = fs.readdirSync(dirPath)

  arrayOfFiles = arrayOfFiles || []
  basePath = basePath || dirPath

  files.forEach(function (file) {
    if (fs.statSync(dirPath + '/' + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + '/' + file, basePath, arrayOfFiles)
    } else {
      arrayOfFiles!.push(join('/', dirPath.replace(basePath!, ''), '/', file))
    }
  })

  return arrayOfFiles
}
