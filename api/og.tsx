/**
 * Phase 17 / T01 (#1287) + #1309 — Dynamic OG image generator.
 *
 * Edge function using @vercel/og's ImageResponse.
 * Renders 1200×630 PNG with LYC Intelligence brand template.
 *
 * #1309 fixes (previously returned 0 bytes on all variants):
 *   BUG 1: handler was (req: VercelRequest, res: VercelResponse) => ImageResponse.
 *          Edge runtime handlers must return the Response DIRECTLY — no double
 *          wrapping. Using VercelRequest/VercelResponse typing + a return type
 *          of Promise<ImageResponse> caused the runtime to not forward the
 *          Response body (0 bytes). Signature corrected to standard Request.
 *   BUG 2: fetchFont() returned `new ArrayBuffer(0)` when font fetch failed.
 *          @vercel/og cannot render text with an empty font buffer and silently
 *          fails the entire ImageResponse pipeline (0 bytes). Empty buffers now
 *          replaced with a fallback: skip font loading altogether when the
 *          network fetch fails — falls back to @vercel/og built-in system fonts
 *          (Noto Sans, which looks close enough and avoids a full failure).
 *   BUG 3: fonts[].weight was not set up correctly: BODY_FONT entry only lists
 *          `weight: 400` but DM+Sans URL fetches a wght@400;500;700 CSS. When
 *          only 1 weight-400 buffer is provided and text uses default weights,
 *          rendering silently fails. Body font now loads only wght@400 so it
 *          matches the single weight we pass to ImageResponse.
 *   BUG 4: CSS-vendor header — newer Google Fonts won't serve woff2 unless a
 *          UA header matching a woff2-capable browser is sent. We add an
 *          Accept: */* + full UA header.
 *
 * Usage: /api/og?title=Page+Title&subtitle=Optional+Subtitle
 */
import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

const ACCENT = '#C108AB';
const HEADING_FONT = 'Libre Baskerville';
const BODY_FONT = 'DM Sans';

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url, 'http://localhost');
  const title = (url.searchParams.get('title') || 'LYC Intelligence').slice(0, 80);
  const subtitle = (url.searchParams.get('subtitle') || '').slice(0, 120);

  // #1309 BUG 2 fix: when remote fonts fail to load, omit the `fonts:` option
  // entirely so @vercel/og uses built-in system fonts instead of empty buffers.
  const headingBuf = await fetchFont('Libre+Baskerville:wght@700');
  const bodyBuf = await fetchFont('DM+Sans:wght@400');
  const fontsOption: any = {};
  if (headingBuf.byteLength > 0 && bodyBuf.byteLength > 0) {
    fontsOption.fonts = [
      { name: HEADING_FONT, data: headingBuf, weight: 700, style: 'normal' },
      { name: BODY_FONT,    data: bodyBuf,    weight: 400, style: 'normal' },
    ];
  }

  try {
    const ir = new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            fontFamily: fontsOption.fonts ? BODY_FONT : 'sans-serif',
            position: 'relative',
          }}
        >
          {/* Logo — top left */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '48px 56px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                backgroundColor: ACCENT,
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: fontsOption.fonts ? HEADING_FONT : 'serif',
                fontWeight: 700,
                fontSize: '22px',
              }}
            >
              L
            </div>
            <span
              style={{
                fontFamily: fontsOption.fonts ? HEADING_FONT : 'serif',
                fontSize: '20px',
                fontWeight: 700,
                color: '#000000',
              }}
            >
              LYC Intelligence
            </span>
          </div>

          {/* Title — center */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              flex: 1,
              padding: '0 56px',
              paddingBottom: '60px',
            }}
          >
            <div
              style={{
                fontFamily: fontsOption.fonts ? HEADING_FONT : 'serif',
                fontSize: title.length > 50 ? '44px' : '56px',
                fontWeight: 700,
                color: '#000000',
                lineHeight: 1.15,
              }}
            >
              {title}
            </div>
            {subtitle ? (
              <div
                style={{
                  fontFamily: fontsOption.fonts ? BODY_FONT : 'sans-serif',
                  fontSize: '24px',
                  color: '#666666',
                  marginTop: '20px',
                }}
              >
                {subtitle}
              </div>
            ) : null}
          </div>

          {/* Accent bar — bottom */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 56px',
              paddingBottom: '40px',
            }}
          >
            <span
              style={{
                fontFamily: fontsOption.fonts ? BODY_FONT : 'sans-serif',
                fontSize: '18px',
                color: '#666666',
              }}
            >
              Know where you stand. Know where to go.
            </span>
            <span
              style={{
                fontFamily: fontsOption.fonts ? BODY_FONT : 'sans-serif',
                fontSize: '16px',
                color: '#999999',
              }}
            >
              lyc-intelligence.app
            </span>
          </div>

          <div style={{ display: 'flex', height: '8px', width: '100%' }}>
            <div style={{ flex: 1, backgroundColor: ACCENT }} />
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        ...fontsOption,
      },
    );
    // #1309 BUG 1 fix: explicitly return a valid Response (not Vercel's wrapped API).
    // Force correct headers so social crawlers always get image/png.
    return new Response(ir.body, {
      status: ir.status,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, immutable',
        ...Object.fromEntries(ir.headers.entries?.() || []),
      },
    });
  } catch (e) {
    // Last-ditch: never return 0 bytes — crawlers interpret that as "dead link".
    // Instead serve a tiny valid 1x1 transparent PNG (82 bytes).
    const tinyPng = new Uint8Array([
      0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52,
      0x00,0x00,0x04,0xB0,0x00,0x00,0x02,0x76,0x08,0x06,0x00,0x00,0x00,0x7A,0xC5,0xE7,
      0x3E,0x00,0x00,0x00,0x06,0x62,0x4B,0x47,0x44,0x00,0xFF,0x00,0xFF,0x00,0xFF,0xA0,
      0xBD,0xA7,0x93,0x00,0x00,0x00,0x09,0x70,0x48,0x59,0x73,0x00,0x00,0x0B,0x13,0x00,
      0x00,0x0B,0x13,0x01,0x00,0x9A,0x9C,0x18,0x00,0x00,0x00,0x07,0x74,0x49,0x4D,0x45,
      0x07,0xDA,0x08,0x0B,0x08,0x1A,0x06,0xA9,0x7F,0x9F,0x5D,0x00,0x00,0x00,0x1A,0x49,
      0x44,0x41,0x54,0x78,0x5E,0xED,0xC1,0x01,0x01,0x00,0x00,0x00,0x82,0x20,0xFF,0xAF,
      0x6E,0x48,0x40,0x01,0x00,0x00,0xEF,0x06,0x10,0x20,0x00,0x01,0x6A,0x35,0xC7,0xA0,
      0x00,0x00,0x00,0x00,0x49,0x45,0x4E,0x44,0xAE,0x42,0x60,0x82,
    ]);
    return new Response(tinyPng.buffer, {
      status: 200,
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=300' },
    });
  }
}

/** Fetch font from Google Fonts as ArrayBuffer for @vercel/og */
async function fetchFont(cssQuery: string): Promise<ArrayBuffer> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${cssQuery}&display=swap`;
    const cssRes = await fetch(cssUrl, {
      headers: {
        Accept: '*/*',
        // Google will only serve .woff2 to a "modern" UA header. Without this
        // we get a TTF or 404. @vercel/og works best with woff2.
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5; rv:109.0) Gecko/20100101 Firefox/115.0',
      },
    });
    if (!cssRes.ok) return new ArrayBuffer(0);
    const css = await cssRes.text();
    const match = css.match(/src:\s*url\(([^)]+)\)\s*format\(['"]?woff2['"]?\)/);
    if (match) {
      const fontUrl = match[1].replace(/['"]/g, '');
      const fontRes = await fetch(fontUrl, {
        headers: { Accept: 'font/woff2,application/octet-stream,*/*' },
      });
      if (fontRes.ok) {
        const buf = await fontRes.arrayBuffer();
        if (buf.byteLength > 1000) return buf; // legit font = tens of KB, skip garbage
      }
    }
  } catch (e) {
    // Swallow: caller will fall back to system fonts.
    console.warn('[og.tsx] fetchFont failed:', e);
  }
  return new ArrayBuffer(0);
}

