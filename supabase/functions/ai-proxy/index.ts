// 상담매직 — 본사 AI 프록시 (Supabase Edge Function)
// 키: 서버 비밀값(OPENAI_API_KEY / ANTHROPIC_API_KEY) 또는 관리자 화면에서 저장한 lm_secret 테이블(읽기 불가, 이 함수만 서비스 키로 읽음)
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type, apikey, authorization, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const ALLOWED_MODELS = new Set(['gpt-4o-mini', 'gpt-4o', 'claude-haiku-5-5', 'claude-sonnet-5-5']);
let cache: { at: number; v: Record<string, string> } = { at: 0, v: {} };
let lastErr = '';
async function secret(name: 'openai' | 'anthropic'): Promise<string> {
  const env = Deno.env.get(name === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY');
  if (env) return env;
  if (Date.now() - cache.at > 60000) {
    const url = Deno.env.get('SUPABASE_URL'), sk = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (url && sk) {
      const r = await fetch(url + '/rest/v1/lm_secret?select=name,value', { headers: { apikey: sk, Authorization: 'Bearer ' + sk } });
      if (r.ok) { const rows = await r.json(); cache = { at: Date.now(), v: Object.fromEntries(rows.map((x: { name: string; value: string }) => [x.name, x.value])) }; lastErr = ''; }
      else { lastErr = 'db ' + r.status + ' ' + (await r.text()).slice(0, 120); }
    } else { lastErr = 'env ' + (url ? '' : 'SUPABASE_URL ') + (sk ? '' : 'SUPABASE_SERVICE_ROLE_KEY'); }
  }
  return cache.v[name] || '';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return new Response('method', { status: 405, headers: CORS });
  try {
    const b = await req.json();
    if (b.ping) { const o = await secret('openai'), a = await secret('anthropic'); return Response.json({ ok: true, openai: !!o, anthropic: !!a, note: lastErr }, { headers: CORS }); }
    const provider = b.provider === 'anthropic' ? 'anthropic' : 'openai';
    let model = String(b.model || (provider === 'openai' ? 'gpt-4o-mini' : 'claude-haiku-5-5'));
    if (!ALLOWED_MODELS.has(model)) model = provider === 'openai' ? 'gpt-4o-mini' : 'claude-haiku-5-5';
    const system = String(b.system || '').slice(0, 8000);
    const user = String(b.user || '').slice(0, 24000);
    if (provider === 'openai') {
      const key = await secret('openai'); if (!key) throw new Error('OPENAI_API_KEY missing');
      const content = b.image ? [{ type: 'text', text: user }, { type: 'image_url', image_url: { url: `data:${b.image.mime || 'image/png'};base64,${b.image.data}` } }] : user;
      const messages = system ? [{ role: 'system', content: system }, { role: 'user', content }] : [{ role: 'user', content }];
      const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify({ model, messages, temperature: 0.3, response_format: b.json ? { type: 'json_object' } : undefined }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error?.message || 'openai ' + r.status);
      return Response.json({ text: j.choices[0].message.content, model, usage: { input: j.usage?.prompt_tokens, output: j.usage?.completion_tokens } }, { headers: CORS });
    }
    const key = await secret('anthropic'); if (!key) throw new Error('ANTHROPIC_API_KEY missing');
    const content = b.image ? [{ type: 'image', source: { type: 'base64', media_type: b.image.mime || 'image/png', data: b.image.data } }, { type: 'text', text: user }] : user;
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model, max_tokens: 2000, system: system || undefined, messages: [{ role: 'user', content }] }) });
    const j = await r.json(); if (!r.ok) throw new Error(j.error?.message || 'anthropic ' + r.status);
    return Response.json({ text: (j.content || []).map((c: { text?: string }) => c.text || '').join(''), model, usage: { input: j.usage?.input_tokens, output: j.usage?.output_tokens } }, { headers: CORS });
  } catch (e) {
    return Response.json({ error: String((e as Error).message || e) }, { status: 500, headers: CORS });
  }
});
