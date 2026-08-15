/**
 * Phase 17 / T01 (#1287) — Dynamic OG image generator.
 *
 * Edge function using @vercel/og's ImageResponse.
 * Renders 1200×630 PNG with LYC Intelligence brand template:
 *   - LYC wordmark in corner
 *   - Page title in system serif stack (generic serif family)
 *   - Accent color bar at bottom (#C108AB)
 *   - One template, per-page title variable
 *
 * Usage: /api/og?title=Page+Title&subtitle=Optional+Subtitle
 *
 * This is 1 serverless function — well within Vercel Hobby's 12-function limit.
 */
import { ImageResponse } from '@vercel/og';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  runtime: 'edge',
};

const ACCENT = '#C108AB';
// Brand rule: headings use DejaVu Serif / Georgia serif stack (no custom font loading).
// @vercel/og supports CSS generic families; the generic 'serif' resolver on the
// edge runtime picks up platform serifs consistent with the marketing surface.
const HEADING_FONT = 'DejaVu Serif, Georgia, Times, "Times New Roman", serif';
const BODY_FONT_BASE = 'DM Sans';
const BODY_FONT = '"DM Sans", system-ui, sans-serif';

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<ImageResponse> {
  const { searchParams } = new URL(req.url || 'http://localhost');
  const title = (searchParams.get('title') || 'LYC Intelligence').slice(0, 80);
  const subtitle = (searchParams.get('subtitle') || '').slice(0, 120);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          fontFamily: BODY_FONT,
          position: 'relative',
          borderRadius: 0,
        }}
      >
        {/* Logo — top left */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '48px 56px',
            borderRadius: 0,
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
              fontFamily: HEADING_FONT,
              fontWeight: 700,
              fontSize: '22px',
              borderRadius: 0,
            }}
          >
            L
          </div>
          <span
            style={{
              fontFamily: HEADING_FONT,
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
            borderRadius: 0,
          }}
        >
          <div
            style={{
              fontFamily: HEADING_FONT,
              fontSize: title.length > 50 ? '44px' : '56px',
              fontWeight: 700,
              color: '#000000',
              lineHeight: 1.15,
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 3,
              overflow: 'hidden',
              borderRadius: 0,
            }}
          >
            {title}
          </div>
          {subtitle ? (
            <div
              style={{
                fontFamily: BODY_FONT,
                fontSize: '24px',
                color: '#666666',
                marginTop: '20px',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2,
                overflow: 'hidden',
                borderRadius: 0,
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
            borderRadius: 0,
          }}
        >
          <span
            style={{
              fontFamily: BODY_FONT,
              fontSize: '18px',
              color: '#666666',
            }}
          >
            Know where you stand. Know where to go.
          </span>
          <span
            style={{
              fontFamily: BODY_FONT,
              fontSize: '16px',
              color: '#999999',
            }}
          >
            www.lyc-intelligence.app
          </span>
        </div>

        {/* Accent bar */}
        <div
          style={{
            display: 'flex',
            height: '8px',
            width: '100%',
            borderRadius: 0,
          }}
        >
          <div style={{ flex: 1, backgroundColor: ACCENT, borderRadius: 0 }} />
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      // Fonts loaded via Google Fonts CSS in the edge runtime.
      // NOTE: Heading font is the generic 'serif' family — no custom fetch.
      fonts: [
        {
          name: BODY_FONT_BASE,
          data: await fetchFont('DM+Sans:wght@400;500;700'),
          weight: 400,
          style: 'normal',
        },
      ],
    },
  );
}

/** Fetch font from Google Fonts as ArrayBuffer for @vercel/og */
async function fetchFont(cssQuery: string): Promise<ArrayBuffer> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${cssQuery}&display=swap`;
    const cssRes = await fetch(cssUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    const css = await cssRes.text();
    // Extract the first woff2 URL
    const match = css.match(/src:\s*url\(([^)]+)\)/);
    if (match) {
      const fontUrl = match[1].replace(/['"]/g, '');
      const fontRes = await fetch(fontUrl);
      return await fontRes.arrayBuffer();
    }
  } catch (e) {
    // Fallback: let ImageResponse use system fonts
  }
  return new ArrayBuffer(0);
}
