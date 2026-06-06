import { spawn } from 'child_process'
import { net } from 'electron'

let healthyInvidiousInstances: string[] = []
let healthyPipedInstances: string[] = []
let lastInstanceRefresh = 0
const INSTANCE_REFRESH_INTERVAL = 30 * 60 * 1000

async function refreshInstances(): Promise<void> {
  const now = Date.now()
  if (now - lastInstanceRefresh < INSTANCE_REFRESH_INTERVAL) return
  lastInstanceRefresh = now

  try {
    const invData = await fetchJsonExternal('https://api.invidious.io/instances.json')
    if (Array.isArray(invData)) {
      const candidates = invData
        .filter((d: any) => d[1]?.api && d[1]?.type === 'https' && !d[1]?.monitor?.down)
        .map((d: any) => `https://${d[0]}`)
      healthyInvidiousInstances = await filterHealthy(candidates, '/api/v1/stats')
    }
  } catch {
    healthyInvidiousInstances = []
  }

  try {
    const pipedData = await fetchJsonExternal('https://piped-instances.kavin.rocks/')
    if (Array.isArray(pipedData)) {
      const candidates = pipedData
        .filter((d: any) => d.api_url)
        .map((d: any) => d.api_url.replace(/\/$/, ''))
      healthyPipedInstances = await filterHealthy(candidates, '/healthcheck')
    }
  } catch {
    healthyPipedInstances = []
  }

  console.log(`[sources] Healthy: ${healthyInvidiousInstances.length} Invidious, ${healthyPipedInstances.length} Piped`)
}

async function filterHealthy(instances: string[], healthPath: string): Promise<string[]> {
  const checks = instances.slice(0, 8).map(async (inst) => {
    try {
      const ok = await headCheck(`${inst}${healthPath}`, 5000)
      return ok ? inst : null
    } catch {
      return null
    }
  })
  const results = await Promise.all(checks)
  return results.filter((r): r is string => r !== null)
}

function headCheck(url: string, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), timeoutMs)
    const request = net.request({ url, method: 'HEAD' })
    request.on('response', (response) => {
      clearTimeout(timeout)
      resolve(response.statusCode >= 200 && response.statusCode < 400)
    })
    request.on('error', () => { clearTimeout(timeout); resolve(false) })
    request.end()
  })
}

function fetchJsonExternal(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('timeout')), 8000)
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
        try { resolve(JSON.parse(body)) } catch { reject(new Error('Invalid JSON')) }
      })
    })
    request.on('error', (err) => { clearTimeout(timeout); reject(err) })
    request.end()
  })
}

function fetchJson(url: string, timeoutMs = 10000): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { request.abort(); reject(new Error('timeout')) }, timeoutMs)
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
        try { resolve(JSON.parse(body)) } catch { reject(new Error('Invalid JSON')) }
      })
    })
    request.on('error', (err) => { clearTimeout(timeout); reject(err) })
    request.end()
  })
}

function verifyUrl(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(false), 6000)
    const request = net.request({ url, method: 'HEAD' })
    request.on('response', (response) => {
      clearTimeout(timeout)
      const code = response.statusCode
      resolve(code === 200 || code === 206)
    })
    request.on('error', () => { clearTimeout(timeout); resolve(false) })
    request.end()
  })
}

// --- Source 1: yt-dlp (primary, most reliable) ---

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

// --- Source 2: Invidious (dynamic healthy instances) ---

async function invidiousExtract(videoId: string): Promise<string> {
  await refreshInstances()
  if (healthyInvidiousInstances.length === 0) {
    throw new Error('No healthy Invidious instances')
  }

  let lastError: Error | null = null
  for (const instance of healthyInvidiousInstances.slice(0, 3)) {
    try {
      const data = await fetchJson(`${instance}/api/v1/videos/${videoId}`, 10000)
      const audioFormats = (data.adaptiveFormats || []).filter(
        (f: any) => f.type?.startsWith('audio/')
      )
      if (audioFormats.length === 0) continue

      const preferred = audioFormats.find((f: any) =>
        f.type?.includes('mp4a') || f.container === 'm4a'
      ) || audioFormats[0]

      if (preferred.url) return preferred.url
    } catch (err: any) {
      lastError = err
    }
  }
  throw lastError || new Error('Invidious extraction failed')
}

// --- Source 3: Piped (dynamic healthy instances) ---

async function pipedExtract(videoId: string): Promise<string> {
  await refreshInstances()
  if (healthyPipedInstances.length === 0) {
    throw new Error('No healthy Piped instances')
  }

  let lastError: Error | null = null
  for (const instance of healthyPipedInstances.slice(0, 3)) {
    try {
      const data = await fetchJson(`${instance}/streams/${videoId}`, 10000)
      const streams = data.audioStreams || []
      if (streams.length === 0) continue

      const sorted = streams.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))
      const preferred = sorted.find((s: any) =>
        s.mimeType?.includes('mp4a') || s.format === 'M4A'
      ) || sorted[0]

      if (preferred.url) return preferred.url
    } catch (err: any) {
      lastError = err
    }
  }
  throw lastError || new Error('Piped extraction failed')
}

// --- Fallback chain with URL verification ---

interface ExtractSource {
  name: string
  extract: (videoId: string) => Promise<string>
}

const sources: ExtractSource[] = [
  { name: 'yt-dlp', extract: ytdlpExtract },
  { name: 'invidious', extract: invidiousExtract },
  { name: 'piped', extract: pipedExtract }
]

export async function extractAudioUrl(videoId: string): Promise<string> {
  let lastError: Error | null = null

  for (const source of sources) {
    try {
      const url = await source.extract(videoId)
      if (!url) continue

      const valid = await verifyUrl(url)
      if (valid) {
        console.log(`[audio] Extracted from ${source.name}: verified OK`)
        return url
      } else {
        console.log(`[audio] ${source.name} URL failed verification, trying next...`)
      }
    } catch (err: any) {
      lastError = err
      console.log(`[audio] ${source.name} failed: ${err.message}`)
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
