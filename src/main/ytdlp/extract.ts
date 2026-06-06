import { spawn } from 'child_process'

export function extractAudioUrl(videoId: string): Promise<string> {
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
      reject(new Error('Audio URL extraction timed out'))
    }, 20000)

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString()
    })

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    proc.on('close', (code) => {
      clearTimeout(timeout)
      const url = stdout.trim()
      if (url && url.startsWith('http')) {
        resolve(url)
      } else {
        reject(new Error(`Failed to extract audio URL: ${stderr || 'No URL returned'}`))
      }
    })

    proc.on('error', (err) => {
      clearTimeout(timeout)
      reject(new Error(`yt-dlp not found: ${err.message}`))
    })
  })
}

export function extractAudioUrlWithRetry(videoId: string, retries: number = 1): Promise<string> {
  return extractAudioUrl(videoId).catch((err) => {
    if (retries > 0) {
      return new Promise((resolve) => setTimeout(resolve, 1000)).then(() =>
        extractAudioUrlWithRetry(videoId, retries - 1)
      )
    }
    throw err
  })
}
