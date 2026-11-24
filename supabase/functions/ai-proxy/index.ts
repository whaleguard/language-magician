// 상담매직 — 본사 AI 프록시 (Supabase Edge Function)
// 키는 서버 비밀값에만 둡니다: supabase secrets set OPENAI_API_KEY=... ANTHROPIC_API_KEY=...
// 배포: supabase functions deploy ai-proxy --no-verify-jwt
// 요청: { provider: 'openai'|'anthropic', model?, system, user, json?, image?: { data(base64), mime } }
// 응답: { text, model, usage: { input, output } }
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const ALLOWED_MODELS = new Set(['gpt-4o-mini', 'gpt-4o', 'claude-haiku-5-5', 'claude-sonnet-5-5']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return new Response('method', { status: 405, headers: CORS });
  try {
    const b = await req.json();
    const provider = b.provider === 'anthropic' ? 'anthropic' : 'openai';
    let model = String(b.model || (provider === 'openai' ? 'gpt-4o-mini' : 'claude-haiku-5-5'));
    if (!ALLOWED_MODELS.has(model)) model = provider === 'openai' ? 'gpt-4o-mini' : 'claude-haiku-5-5';
    const system = String(b.system || '').slice(0, 8000);
    const user = String(b.user || '').slice(0, 24000);
    if (provider === 'openai') {
      const key = Deno.env.get('OPENAI_API_KEY'); if (!key) throw new Error('OPENAI_API_KEY missing');
      const content = b.image ? [{ type: 'text', text: user }, { type: 'image_url', image_url: { url: `data:${b.image.mime || 'image/png'};base64,${b.image.data}` } }] : user;
      const messages = system ? [{ role: 'system', content: system }, { role: 'user', content }] : [{ role: 'user', content }];
      const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify({ model, messages, temperature: 0.3, response_format: b.json ? { type: 'json_object' } : undefined }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error?.message || 'openai ' + r.status);
      return Response.json({ text: j.choices[0].message.content, model, usage: { input: j.usage?.prompt_tokens, output: j.usage?.completion_tokens } }, { headers: CORS });
    }
    const key = Deno.env.get('ANTHROPIC_API_KEY'); if (!key) throw new Error('ANTHROPIC_API_KEY missing');
    const content = b.image ? [{ type: 'image', source: { type: 'base64', media_type: b.image.mime || 'image/png', data: b.image.data } }, { type: 'text', text: user }] : user;
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model, max_tokens: 2000, system: system || undefined, messages: [{ role: 'user', content }] }) });
    const j = await r.json(); if (!r.ok) throw new Error(j.error?.message || 'anthropic ' + r.status);
    return Response.json({ text: (j.content || []).map((c: { text?: string }) => c.text || '').join(''), model, usage: { input: j.usage?.input_tokens, output: j.usage?.output_tokens } }, { headers: CORS });
  } catch (e) {
    return Response.json({ error: String((e as Error).message || e) }, { status: 500, headers: CORS });
  }
});
