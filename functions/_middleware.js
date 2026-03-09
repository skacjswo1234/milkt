// milkt2-ulsan.com 접속 시 root(/) 요청을 milkt-ver2 폴더 내용으로 서빙 (도메인 유지)
const MILKT2_HOST = 'milkt2-ulsan.com';
const MILKT2_PREFIX = '/milkt-ver2';

function isMilkt2Host(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === MILKT2_HOST || host === 'www.' + MILKT2_HOST;
  } catch {
    return false;
  }
}

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // milkt2 도메인이 아니면 그대로 통과
  if (!isMilkt2Host(request.url)) {
    return next();
  }

  // /api, /milkt-ver2 경로는 그대로 (이미 올바른 경로 또는 API)
  if (path.startsWith('/api') || path.startsWith('/functions') || path.startsWith(MILKT2_PREFIX)) {
    return next();
  }

  // milkt2 도메인: / → /milkt-ver2/index.html, 그 외 → /milkt-ver2/... (URL은 그대로 유지)
  const rewritePath = path === '/' || path === '' ? MILKT2_PREFIX + '/index.html' : MILKT2_PREFIX + path;
  const fetchUrl = url.origin + rewritePath;

  const res = await fetch(fetchUrl, {
    method: request.method,
    headers: request.headers,
  });

  // 리다이렉트 응답이면 Location을 / 기준으로 정리 (milkt2-ulsan.com/ 로 보이도록)
  if (res.status >= 301 && res.status < 400) {
    const loc = res.headers.get('Location');
    if (loc && loc.includes(MILKT2_PREFIX)) {
      const newLoc = loc.replace(MILKT2_PREFIX, '') || '/';
      const newHeaders = new Headers(res.headers);
      newHeaders.set('Location', newLoc);
      return new Response(res.body, { status: res.status, headers: newHeaders });
    }
  }

  return res;
}
