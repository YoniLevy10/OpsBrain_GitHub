/**
 * Vercel Serverless: POST https://api.v0.dev/v1/chat/completions
 * Env: V0_API_KEY (server only — never VITE_*)
 */
const V0_URL = 'https://api.v0.dev/v1/chat/completions';
const CACHE_CONTROL = 'public, max-age=86400, s-maxage=86400';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ ok: false, text: null, error: 'method_not_allowed' });
  }

  const key = process.env.V0_API_KEY;
  if (!key || !String(key).trim()) {
    return res.status(200).json({
      ok: false,
      text: null,
      error: 'missing_key',
      message: 'V0_API_KEY is not set on the server',
    });
  }

  try {
    const r = await fetch(V0_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'v0-1.5-md',
        max_completion_tokens: 120,
        messages: [
          {
            role: 'user',
            content:
              'Hebrew only. Plain text, no markdown, no HTML, no emojis. Exactly 2 short sentences welcoming the user to OpsBrain (business operations app). Friendly, professional.',
          },
        ],
      }),
    });

    const raw = await r.text();
    if (!r.ok) {
      return res.status(200).json({
        ok: false,
        text: null,
        error: 'v0_http',
        status: r.status,
        detail: raw.slice(0, 280),
      });
    }

    let json;
    try {
      json = JSON.parse(raw);
    } catch {
      return res.status(200).json({ ok: false, text: null, error: 'v0_bad_json' });
    }

    const content = json?.choices?.[0]?.message?.content;
    const text =
      typeof content === 'string'
        ? content.trim()
        : Array.isArray(content)
          ? content
              .map((p) => (typeof p?.text === 'string' ? p.text : ''))
              .join('')
              .trim()
          : '';

    res.setHeader('Cache-Control', CACHE_CONTROL);
    return res.status(200).json({ ok: true, text: text || null, error: null });
  } catch (e) {
    return res.status(200).json({
      ok: false,
      text: null,
      error: 'fetch_failed',
      message: e?.message || String(e),
    });
  }
}
