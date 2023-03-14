import fs from 'fs'
import path from 'path'
import { unzipSync } from 'fflate'

const GITHUB_API_VERSION = '2022-11-28'
const defaultDirectory = path.resolve('node_modules', '.cache', '.metamask')

/**
 * @param {import("./types").Options} opts
 */
async function getLastestRelease({ repo, userAgent = 'filsnap', token }) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': GITHUB_API_VERSION,
    'User-Agent': userAgent,
  }
  if (token) {
    // @ts-ignore
    headers.Authorization = `Bearer ${token}`
  }
  const rsp = await fetch(
    `https://api.github.com/repos/${repo}/releases/latest`,
    {
      headers,
    }
  )

  if (!rsp.ok) {
    const msg = await rsp.json()
    throw new Error(msg.message)
  }
  const data = await rsp.json()

  return data.tag_name
}
/**
 * @param {import("./types").Options} opts
 */
async function getZipball({ repo, userAgent = 'filsnap', token, tag }) {
  const url = `https://api.github.com/repos/${repo}/zipball/${tag}`
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': GITHUB_API_VERSION,
    'User-Agent': userAgent,
  }
  if (token) {
    // @ts-ignore
    headers.Authorization = `Bearer ${token}`
  }
  const rsp = await fetch(url, {
    headers,
    redirect: 'follow',
  })
  if (!rsp.ok) {
    const msg = await rsp.json()
    throw new Error(msg.message)
  }

  return rsp.arrayBuffer()
}

/**
 * @param {import('type-fest').SetRequired<import("./types").Options, 'tag' | 'asset'>} opts
 */
async function getAsset({ repo, userAgent = 'filsnap', token, tag, asset }) {
  const url = `https://github.com/${repo}/releases/download/${tag}/${asset}.zip`
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': GITHUB_API_VERSION,
    'User-Agent': userAgent,
  }
  if (token) {
    // @ts-ignore
    headers.Authorization = `Bearer ${token}`
  }
  const rsp = await fetch(url, {
    headers,
    redirect: 'follow',
  })

  if (rsp.status === 404) {
    throw new Error(`${asset} not found`)
  }

  if (!rsp.ok) {
    const msg = await rsp.json()
    throw new Error(msg.message)
  }

  return rsp.arrayBuffer()
}

/**
 * @param {string} tag
 * @param {string} [asset]
 */
function assetName(tag, asset) {
  return asset
    ? asset.replace('[tag]', tag.replace('v', ''))
    : `source-${tag.replace('v', '')}`
}

/**
 * @param {import("./types").Options} opts
 */
export async function download({
  repo,
  userAgent = 'filsnap',
  token,
  tag = 'latest',
  dir = defaultDirectory,
  asset,
}) {
  if (tag === 'latest') {
    tag = await getLastestRelease({ repo, userAgent, token })
  }

  asset = assetName(tag, asset)
  const outFolder = path.join(dir, asset)

  if (fs.existsSync(outFolder)) {
    return outFolder
  }

  if (asset.startsWith('source')) {
    unzip(await getZipball({ repo, userAgent, token, tag }), outFolder)
  } else {
    unzip(await getAsset({ repo, userAgent, token, tag, asset }), outFolder)
  }

  return outFolder
}

/**
 *
 * @param {ArrayBuffer} data
 * @param {string} outDir
 */
function unzip(data, outDir) {
  const decompressed = unzipSync(new Uint8Array(data))

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  for (const [relativePath, content] of Object.entries(decompressed)) {
    const file = path.join(outDir, relativePath)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    if (content.byteLength) {
      fs.writeFileSync(file, content)
    }
  }
}

// function main() {
//   const tag = download({
//     repo: 'MetaMask/metamask-extension',
//     tag: 'latest',
//     // asset: 'metamask-flask-chrome-[tag]-flask.0',
//   })
//   // eslint-disable-next-line no-console
//   console.log('🚀 ~ file: index.js:38 ~ main ~ tag:', tag)
// }
// main()
