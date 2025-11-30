export async function onRequestOptions({ request, env }) {
  const origin = request.headers.get('origin') || '';
  const allowed = (env.ALLOW_ORIGINS || '').split(',').map(s => s.trim());
  const isAllowed = !allowed.length || allowed.includes(origin);
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': isAllowed ? origin : '*',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
      'Access-Control-Allow-Headers': 'content-type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('origin') || '';
  const allowed = (env.ALLOW_ORIGINS || '').split(',').map(s => s.trim());
  const isAllowed = !allowed.length || allowed.includes(origin);
  if (!isAllowed) return new Response('Forbidden', { status: 403 });
  try {
    const { url, options } = await request.json();
    const u = new URL(url);
    u.searchParams.set('key', env.API_KEY);
    const res = await fetch(u.toString(), options);
    const text = await res.text();
    const headers = new Headers({ 'Access-Control-Allow-Origin': origin });
    const ct = res.headers.get('content-type');
    if (ct) headers.set('Content-Type', ct);
    return new Response(text, { status: res.status, headers });
  } catch (e) {
    return new Response('Bad Request', { status: 400 });
  }
}
