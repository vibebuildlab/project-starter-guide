import dns from 'dns'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { validateURL } from '../../src/middleware/ssrfProtection'

describe('ssrfProtection', () => {
  const lookupSpy = vi.spyOn(dns.promises, 'lookup')

  beforeEach(() => {
    lookupSpy.mockReset()
  })

  afterEach(() => {
    lookupSpy.mockReset()
  })

  it('blocks metadata hostnames when enabled', async () => {
    lookupSpy.mockResolvedValue([{ address: '93.184.216.34', family: 4 }])

    const result = await validateURL('http://metadata.google.internal', {
      blockMetadataEndpoints: true,
    })

    expect(result.valid).toBe(false)
    expect(result.error).toBe('Hostname is blocked')
    expect(lookupSpy).not.toHaveBeenCalled()
  })

  it('allows metadata hostnames when disabled', async () => {
    lookupSpy.mockResolvedValue([{ address: '93.184.216.34', family: 4 }])

    const result = await validateURL('http://metadata.google.internal', {
      blockMetadataEndpoints: false,
    })

    expect(result.valid).toBe(true)
    expect(result.url?.hostname).toBe('metadata.google.internal')
  })

  it('enforces allowed ports when provided', async () => {
    lookupSpy.mockResolvedValue([{ address: '93.184.216.34', family: 4 }])

    const result = await validateURL('https://example.com:444', {
      allowedPorts: [443],
    })

    expect(result.valid).toBe(false)
    expect(result.error).toBe('Port 444 is not allowed')
  })

  it('blocks when any resolved address is private', async () => {
    lookupSpy.mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
      { address: '10.0.0.1', family: 4 },
    ])

    const result = await validateURL('https://example.com', {})

    expect(result.valid).toBe(false)
    expect(result.error).toBe('URL resolves to a blocked IP address')
  })
})
