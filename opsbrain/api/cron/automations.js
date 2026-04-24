export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const cronSecret = process.env.AUTOMATIONS_CRON_SECRET;

  if (!supabaseUrl) {
    res.status(500).json({ error: 'Missing VITE_SUPABASE_URL env' });
    return;
  }
  if (!cronSecret) {
    res.status(500).json({ error: 'Missing AUTOMATIONS_CRON_SECRET env' });
    return;
  }

  const functionsBase = supabaseUrl.replace('.supabase.co', '.functions.supabase.co');
  const url = `${functionsBase}/runAutomations`;

  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-opsbrain-cron': cronSecret,
    },
    body: JSON.stringify({}),
  });

  const text = await r.text();
  res.status(r.status).send(text);
}

