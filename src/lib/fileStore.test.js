import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./appwrite', () => ({
  account: { createJWT: vi.fn(async () => ({ jwt: 'jwt-1' })) },
  client: { config: { project: 'wswpk' } },
  storage: {
    getFile: vi.fn(async (bucket, id) => ({ $id: id, name: `legacy-${id}.pdf` })),
    getFileDownload: vi.fn((bucket, id) => `https://appwrite.test/${bucket}/${id}/download`),
    getFileView: vi.fn((bucket, id) => `https://appwrite.test/${bucket}/${id}/view`),
    deleteFile: vi.fn(async () => {}),
  },
}))

const { account, storage } = await import('./appwrite')
const fileStore = await import('./fileStore')

const BASE = 'https://dateien.wpk-prozesstechnik.de/v1/wswpk'

function jsonResponse(status, body, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers })
}

describe('fileStore', () => {
  let fetchMock

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    localStorage.clear()
    fileStore.clearFileServiceAuth()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uploads with the JWT, encoded name and create-only precondition', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { $id: 'abc' }))
    const file = new File(['%PDF'], 'Überprüfungsbericht 1.pdf', { type: 'application/pdf' })

    await fileStore.uploadFile('abc', file, { owner: 'user-1' })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(`${BASE}/files/abc`)
    expect(init.method).toBe('PUT')
    expect(init.headers).toMatchObject({
      'X-Appwrite-JWT': 'jwt-1',
      'Content-Type': 'application/pdf',
      'X-File-Name': encodeURIComponent('Überprüfungsbericht 1.pdf'),
      'If-None-Match': '*',
      'X-File-Owner': 'user-1',
    })
  })

  it('reuses the JWT across requests', async () => {
    fetchMock.mockImplementation(async () => jsonResponse(200, { name: 'a.pdf' }))
    await fileStore.getFile('a')
    await fileStore.getFile('b')
    expect(account.createJWT).toHaveBeenCalledTimes(1)
  })

  it('returns blob and decoded name from the download', async () => {
    fetchMock.mockResolvedValue(
      new Response('%PDF', {
        status: 200,
        headers: { 'X-File-Name': encodeURIComponent('Stunden ä.pdf') },
      }),
    )
    const { blob, name } = await fileStore.getFileBlob('abc')
    expect(fetchMock.mock.calls[0][0]).toBe(`${BASE}/files/abc/download`)
    expect(blob.size).toBe('%PDF'.length)
    expect(name).toBe('Stunden ä.pdf')
  })

  it('falls back to Appwrite for files that are not migrated yet', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(404, { message: 'Datei nicht gefunden' }))
      .mockResolvedValueOnce(new Response('%PDF-alt', { status: 200 }))

    const { blob, name } = await fileStore.getFileBlob('old')

    expect(fetchMock.mock.calls[1][0]).toBe('https://appwrite.test/storage/old/download')
    expect(blob.size).toBe('%PDF-alt'.length)
    expect(name).toBe('legacy-old.pdf')
  })

  it('throws an AppwriteException-compatible error with the HTTP status', async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { message: 'Sitzung ungültig' }))
    await expect(fileStore.deleteFile('abc')).rejects.toMatchObject({
      code: 401,
      message: 'Sitzung ungültig',
    })
    expect(storage.deleteFile).not.toHaveBeenCalled()
  })

  it('builds image URLs with the stored read token', async () => {
    const expiresAt = Math.floor(Date.now() / 1000) + 3 * 86400
    fetchMock.mockResolvedValue(jsonResponse(200, { token: 'tok.sig', expiresAt }))

    await fileStore.ensureReadToken()
    await fileStore.ensureReadToken() // still valid, no second request

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe(`${BASE}/token`)
    expect(fileStore.getFileViewUrl('img1')).toBe(`${BASE}/files/img1/view?t=tok.sig`)
  })
})
