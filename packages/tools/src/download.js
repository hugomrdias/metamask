// @ts-ignore
import Conf from 'conf'
import { unzipSync } from 'fflate'
import fs from 'fs'
import { writeFile } from 'fs/promises'
import path from 'path'

const GITHUB_API_VERSION = '2022-11-28'
const defaultDirectory = path.resolve('node_modules', '.cache', '.metamask')

/**
 * Get the latest tag for a repo
 *
 * @param {import("./types.js").DownloadMetamaskOptions} opts
 */
async function getLastestTag({ repo, userAgent = 'metamask', token }) {
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
 * Download release asset array buffer
 *
 * @param {import('type-fest').SetRequired<import("./types.js").DownloadMetamaskOptions, 'tag' | 'asset'>} opts
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

  const buf = await rsp.arrayBuffer()

  return new Uint8Array(buf)
}

/**
 * Download and unzip a Metamask release file
 *
 * @param {import("./types.js").DownloadMetamaskOptions} opts
 */
export async function download({
  repo = 'MetaMask/metamask-extension',
  userAgent = 'metamask',
  token = process.env.GITHUB_TOKEN,
  tag = process.env.METAMASK_TAG || 'latest',
  dir = defaultDirectory,
  flask = false,
  browser = 'chrome',
  extensionsIds: extensions = [],
}) {
  /** @type {Conf<{ latestTag: string; latestCheck: number; }>} */
  const config = new Conf({
    cwd: defaultDirectory,
    defaults: {
      latestCheck: 0,
      latestTag: 'v0.0.0',
    },
  })

  const threshold = 7200 * 1000 // 2 hours

  if (tag === 'latest' && Date.now() > config.get('latestCheck') + threshold) {
    tag = await getLastestTag({ repo, userAgent, token })
    config.set('latestCheck', Date.now())
    config.set('latestTag', tag)
  } else if (tag === 'latest') {
    tag = config.get('latestTag')
  }

  let asset = 'metamask-'
  asset += flask
    ? `flask-${browser}-${tag.replace('v', '')}-flask.0`
    : `${browser}-${tag.replace('v', '')}`

  const metamaskOutFolder = path.join(dir, asset)
  const outFolders = [metamaskOutFolder]

  if (extensions.length > 0) {
    for (const extension of extensions) {
      const extensionOutFolder = path.join(dir, extension)

      if (fs.existsSync(extensionOutFolder)) {
        outFolders.push(extensionOutFolder)
        continue
      }
      const crxPath = await downloadExtensionById(extension, dir)
      extractCrxFile(crxPath, extensionOutFolder)

      outFolders.push(extensionOutFolder)
    }
  }

  if (fs.existsSync(metamaskOutFolder)) {
    return outFolders
  }

  unzip(
    await getAsset({ repo, userAgent, token, tag, asset }),
    metamaskOutFolder
  )

  return outFolders
}

/**
 * Unzip a zip file into the given directory
 *
 * @param {Uint8Array} data
 * @param {string} outDir
 */
function unzip(data, outDir) {
  const decompressed = unzipSync(data)

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

/**
 * Downloads a Chrome extension (.crx file) and extracts it to a specified directory.
 *
 * @param {string} extensionId - The ID of the Chrome extension to download.
 * @param {string} dir - The directory where the .crx file will be downloaded and extracted.
 * @returns {Promise<string>} The path to the extracted directory or null if an error occurs.
 */
const downloadExtensionById = async (extensionId, dir = defaultDirectory) => {
  const url = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=130.0&acceptformat=crx3&x=id%3D${extensionId}%26installsource%3Dondemand%26uc`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Error fetching the extension: ${response.statusText}`)
  }

  const filePath = path.resolve(dir, `${extensionId}.crx`)

  if (fs.existsSync(filePath)) {
    return filePath
  }
  const buf = await response.arrayBuffer()
  await writeFile(filePath, new Uint8Array(buf))

  return filePath
}

/**
 * Strips the CRX header from the file data.
 *
 * @param {Buffer} data - The original .crx file data.
 * @returns {Buffer} The ZIP data with the CRX header removed.
 */
function stripCrxHeader(data) {
  // CRX3 files start with "Cr24", followed by version, public key length, and signature length
  if (data.subarray(0, 4).toString() === 'Cr24') {
    // Skipping the CRX header to reach the ZIP part
    // The header size varies, so we need to calculate it
    const version = data.readUInt32LE(4)
    if (version === 2 || version === 3) {
      // For CRX3, the header is more complex; we might need additional parsing
      // This example skips directly to the ZIP part for simplicity
      const publicKeyLength = data.readUInt32LE(8)
      const signatureLength = data.readUInt32LE(12)
      const headerSize = 16 + publicKeyLength + signatureLength // Basic CRX3 header size calculation
      return data.subarray(headerSize)
    }
  }
  // If not a CRX file or unable to process, return the original data
  return data
}

/**
 * Extracts a .crx file using fflate by first stripping its header.
 *
 * @param {string} crxFilePath - The path to the .crx file to be extracted.
 * @param {string} extractToDirectory - The directory where the .crx file will be extracted.
 */
function extractCrxFile(crxFilePath, extractToDirectory) {
  fs.mkdirSync(extractToDirectory, { recursive: true })
  const data = fs.readFileSync(crxFilePath)

  const zipHeaderIndex = data.indexOf(Buffer.from([0x50, 0x4b, 0x03, 0x04]))
  if (zipHeaderIndex === -1) {
    throw new Error('ZIP header not found in CRX file.')
  }

  const zipData = stripCrxHeader(data.subarray(zipHeaderIndex))
  unzip(zipData, extractToDirectory)
  return extractToDirectory
}
