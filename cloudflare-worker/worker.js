export default {
  async fetch(request, env) {
    const origin = request.headers.get('origin') || '';
    const allow = env.ALLOW_ORIGIN || '*';
    const multi = env.ALLOW_ORIGINS || '';
    const allowedList = multi ? multi.split(',').map(s => s.trim()) : [];
    const isAllowed = allow === '*' || origin === allow || allowedList.includes(origin);
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': isAllowed ? origin : '*',
          'Access-Control-Allow-Methods': 'POST,OPTIONS',
          'Access-Control-Allow-Headers': 'content-type',
          'Access-Control-Max-Age': '86400'
        }
      });
    }
    if (!isAllowed) return new Response('Forbidden', { status: 403 });
    if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    const { url, options } = await request.json();
    const u = new URL(url);
    u.searchParams.set('key', env.API_KEY);
    const res = await fetch(u.toString(), options);
    const text = await res.text();
    const headers = new Headers({ 'Access-Control-Allow-Origin': origin });
    const ct = res.headers.get('content-type');
    if (ct) headers.set('Content-Type', ct);
    return new Response(text, { status: res.status, headers });
  }
}
