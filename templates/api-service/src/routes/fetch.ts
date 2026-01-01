import express from 'express'
import http from 'http'
import https from 'https'
import ssrfProtection from '../middleware/ssrfProtection'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()

const MAX_RESPONSE_BYTES = 1024 * 1024

function requestText(
  url: URL,
  agent?: http.Agent | https.Agent
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const client = url.protocol === 'https:' ? https : http
    const req = client.request(
      url,
      { method: 'GET', agent },
      (res) => {
        const chunks: Buffer[] = []
        let size = 0

        res.on('data', (chunk: Buffer) => {
          size += chunk.length
          if (size > MAX_RESPONSE_BYTES) {
            req.destroy()
            reject(new Error('Response too large'))
            return
          }
          chunks.push(chunk)
        })

        res.on('error', (err) => {
          req.destroy()
          reject(err)
        })

        res.on('end', () => {
          resolve({
            status: res.statusCode ?? 502,
            headers: res.headers,
            body: Buffer.concat(chunks).toString('utf8'),
          })
        })
      }
    )

    req.on('error', reject)
    req.end()
  })
}

// Example: fetch external content safely using the pinned agent created by ssrfProtection.
// Requires authentication to prevent abuse as a proxy service.
router.get('/fetch', authenticateToken, ssrfProtection(), async (req, res) => {
  const reqWithUrl = req as express.Request & {
    validatedUrl?: URL
    validatedUrlAgent?: http.Agent | https.Agent
  }

  if (!reqWithUrl.validatedUrl) {
    return res.status(400).json({ error: 'URL is required' })
  }

  try {
    const result = await requestText(
      reqWithUrl.validatedUrl,
      reqWithUrl.validatedUrlAgent
    )
    const contentType = result.headers['content-type'] || 'text/plain; charset=utf-8'
    return res.status(result.status).type(contentType).send(result.body)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed'
    return res.status(502).json({ error: message })
  }
})

export default router
