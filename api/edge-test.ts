export const config = { runtime: 'edge' };

export default function handler(_req: Request) {
  return new Response(JSON.stringify({ ok: true, message: 'edge test works' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
