import fs from 'fs'
import path from 'path'

const GITHUB_API_VERSION = '2022-11-28'

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
  const url = `https://github.com/${repo}/releases/download/${tag}/${asset}`
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
 * @param {string} asset
 * @param {string} tag
 */
function assetName(asset, tag) {
  asset = asset.replace('[tag]', tag.replace('v', ''))

  return `${asset}.zip`
}

/**
 * @param {import("./types").Options} opts
 */
async function download({
  repo,
  userAgent = 'filsnap',
  token,
  tag = 'latest',
  dir = process.cwd(),
  asset,
}) {
  if (tag === 'latest') {
    tag = await getLastestRelease({ repo, userAgent, token })
  }

  if (asset) {
    asset = assetName(asset, tag)
    fs.writeFileSync(
      path.join(dir, asset),
      Buffer.from(await getAsset({ repo, userAgent, token, tag, asset }))
    )
  } else {
    fs.writeFileSync(
      path.join(dir, `${tag}.zip`),
      Buffer.from(await getZipball({ repo, userAgent, token, tag }))
    )
  }
}

function main() {
  const tag = download({
    repo: 'MetaMask/metamask-extension',
    tag: 'latest',
    // asset: 'metamask-flask-chrome-[tag]-flask.0',
  })
  // eslint-disable-next-line no-console
  console.log('🚀 ~ file: index.js:38 ~ main ~ tag:', tag)
}
main()
