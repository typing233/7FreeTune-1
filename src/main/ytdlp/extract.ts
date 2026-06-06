import { spawn } from 'child_process'
import { net } from 'electron'

export interface AudioSource {
  name: string
  extractUrl: (videoId: string) => Promise<string>
}

function ytdlpExtract(videoId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', [
      '-f', 'bestaudio[ext=m4a]/bestaudio',
      '--get-url',
      '--no-playlist',
      '--no-warnings',
      `https://www.youtube.com/watch?v=${videoId}`
    ])

    let stdout = ''
    let stderr = ''
    const timeout = setTimeout(() => {
      proc.kill()
      reject(new Error('yt-dlp extraction timed out'))
    }, 20000)

    proc.stdout.on('data', (data: Buffer) => { stdout += data.toString() })
    proc.stderr.on('data', (data: Buffer) => { stderr += data.toString() })

    proc.on('close', () => {
      clearTimeout(timeout)
      const url = stdout.trim()
      if (url && url.startsWith('http')) {
        resolve(url)
      } else {
        reject(new Error(`yt-dlp failed: ${stderr.slice(0, 200) || 'No URL returned'}`))
      }
    })

    proc.on('error', (err) => {
      clearTimeout(timeout)
      reject(new Error(`yt-dlp not found: ${err.message}`))
    })
  })
}

const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://invidious.jing.rocks'
]

function invidiousExtract(videoId: string): Promise<string> {
  return tryInstances(INVIDIOUS_INSTANCES, async (instance) => {
    const url = `${instance}/api/v1/videos/${videoId}`
    const data = await fetchJson(url)
    if (!data.adaptiveFormats || data.adaptiveFormats.length === 0) {
      throw new Error('No adaptive formats')
    }
    const audioFormats = data.adaptiveFormats.filter(
      (f: any) => f.type?.startsWith('audio/')
    )
    if (audioFormats.length === 0) throw new Error('No audio formats found')

    const preferred = audioFormats.find((f: any) => f.container === 'm4a' || f.type?.includes('mp4a'))
      || audioFormats[0]
    if (!preferred.url) throw new Error('No URL in format')
    return preferred.url
  })
}

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://piped-api.lunar.icu',
  'https://api.piped.yt'
]

function pipedExtract(videoId: string): Promise<string> {
  return tryInstances(PIPED_INSTANCES, async (instance) => {
    const url = `${instance}/streams/${videoId}`
    const data = await fetchJson(url)
    if (!data.audioStreams || data.audioStreams.length === 0) {
      throw new Error('No audio streams')
    }
    const sorted = data.audioStreams.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))
    const preferred = sorted.find((s: any) => s.mimeType?.includes('mp4a') || s.format === 'M4A')
      || sorted[0]
    if (!preferred.url) throw new Error('No URL in stream')
    return preferred.url
  })
}

async function tryInstances(instances: string[], fn: (instance: string) => Promise<string>): Promise<string> {
  let lastError: Error | null = null
  for (const instance of instances) {
    try {
      return await fn(instance)
    } catch (err: any) {
      lastError = err
    }
  }
  throw lastError || new Error('All instances failed')
}

function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Request timeout')), 10000)

    const request = net.request(url)
    let body = ''

    request.on('response', (response) => {
      if (response.statusCode !== 200) {
        clearTimeout(timeout)
        reject(new Error(`HTTP ${response.statusCode}`))
        return
      }
      response.on('data', (chunk) => { body += chunk.toString() })
      response.on('end', () => {
        clearTimeout(timeout)
        try {
          resolve(JSON.parse(body))
        } catch {
          reject(new Error('Invalid JSON'))
        }
      })
    })

    request.on('error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })

    request.end()
  })
}

const sources: AudioSource[] = [
  { name: 'yt-dlp', extractUrl: ytdlpExtract },
  { name: 'invidious', extractUrl: invidiousExtract },
  { name: 'piped', extractUrl: pipedExtract }
]

export async function extractAudioUrl(videoId: string): Promise<string> {
  let lastError: Error | null = null

  for (const source of sources) {
    try {
      const url = await source.extractUrl(videoId)
      if (url) return url
    } catch (err: any) {
      lastError = err
      console.error(`[${source.name}] extraction failed for ${videoId}: ${err.message}`)
    }
  }

  throw lastError || new Error('All audio sources failed')
}

export async function extractAudioUrlWithRetry(videoId: string, retries: number = 1): Promise<string> {
  try {
    return await extractAudioUrl(videoId)
  } catch (err) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return extractAudioUrlWithRetry(videoId, retries - 1)
    }
    throw err
  }
}
