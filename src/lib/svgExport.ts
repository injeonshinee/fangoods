// Web fonts that must be embedded as base64 @font-face data URIs before PNG
// export, since an <img> rendering an SVG blob can't load external font files.
export const FONT_EMBEDS: Record<string, { name: string; url: string; format: string }> = {
  pretendard: {
    name: 'Pretendard',
    url: 'https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/static/woff2/Pretendard-Bold.woff2',
    format: 'woff2',
  },
  blackhansans: {
    name: 'Black Han Sans',
    url: 'https://fonts.gstatic.com/s/blackhansans/v24/ea8Aad44WunzF9a-dL6toA8r8nqV.ttf',
    format: 'truetype',
  },
  jua: {
    name: 'Jua',
    url: 'https://fonts.gstatic.com/s/jua/v18/co3KmW9ljjAjcw.ttf',
    format: 'truetype',
  },
}

export function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function getSvgPixelSize(svgContent: string): { width: number; height: number } {
  const m = svgContent.match(/viewBox="[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)"/)
  return m ? { width: parseFloat(m[1]), height: parseFloat(m[2]) } : { width: 800, height: 800 }
}

// Cache fetched font files as base64 data URIs so repeat downloads don't refetch.
const fontDataUriCache = new Map<string, Promise<string>>()

function getFontDataUri(url: string): Promise<string> {
  let cached = fontDataUriCache.get(url)
  if (!cached) {
    cached = fetch(url)
      .then((res) => res.arrayBuffer())
      .then((buf) => {
        let binary = ''
        const bytes = new Uint8Array(buf)
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
        const mime = url.endsWith('.woff2') ? 'font/woff2' : 'font/ttf'
        return `data:${mime};base64,${btoa(binary)}`
      })
    fontDataUriCache.set(url, cached)
  }
  return cached
}

// An <img> rendering an SVG blob can't load external @font-face files, so any
// non-system fonts used in the SVG must be embedded as base64 data URIs before
// rasterizing. Fonts in use are detected by scanning for their family name.
export async function embedFonts(svgContent: string): Promise<string> {
  const ids = Object.keys(FONT_EMBEDS).filter((id) => svgContent.includes(FONT_EMBEDS[id].name))
  if (ids.length === 0) return svgContent

  const faces = await Promise.all(
    ids.map(async (id) => {
      const { name, url, format } = FONT_EMBEDS[id]
      const dataUri = await getFontDataUri(url)
      return `@font-face{font-family:'${name}';font-weight:bold;src:url(${dataUri}) format('${format}');}`
    }),
  )
  return svgContent.replace('<defs>', `<defs><style>${faces.join('')}</style>`)
}

export async function downloadPng(svgContent: string, filename: string, scale = 8) {
  const enrichedSvg = await embedFonts(svgContent)
  const { width, height } = getSvgPixelSize(enrichedSvg)
  const svgUrl = URL.createObjectURL(new Blob([enrichedSvg], { type: 'image/svg+xml;charset=utf-8' }))
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(height * scale)
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => {
        if (blob) triggerDownload(URL.createObjectURL(blob), filename)
      }, 'image/png')
    }
    URL.revokeObjectURL(svgUrl)
  }
  img.src = svgUrl
}
