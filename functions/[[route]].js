const ROUTES = {
  'xep-hang/kiosk':    { page: 'kiosk',    title: 'Kiosk lấy số', access: 'public' },
  'xep-hang/mobile':   { page: 'mobile',   title: 'Lấy số trực tuyến', access: 'public' },
  'xep-hang/dat-lich': { page: 'booking',  title: 'Đặt lịch trực tuyến', access: 'public' },
  'xep-hang/quay':     { page: 'staff',    title: 'Điều hành quầy', access: 'protected' },
  'xep-hang/hien-thi': { page: 'display',  title: 'Màn hình gọi số', access: 'public' },
  'xep-hang/danh-gia': { page: 'feedback', title: 'Đánh giá cán bộ', access: 'public' },
  'xep-hang/admin':    { page: 'admin',    title: 'Quản trị xếp hàng', access: 'protected' }
};

function esc(s='') {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function accessEmail(request) {
  return request.headers.get('Cf-Access-Authenticated-User-Email') ||
         request.headers.get('cf-access-authenticated-user-email') || '';
}

function htmlShell(targetUrl, title) {
  const safeUrl = esc(targetUrl);
  const safeTitle = esc(title);
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${safeTitle} | PVHCC Cô Tô</title>
<style>
html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif}
#loading{position:fixed;inset:0;z-index:2;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;background:#f4f7fb;color:#0b5fa5;font-weight:700}
.spinner{width:38px;height:38px;border:4px solid #d9e6f2;border-top-color:#0b5fa5;border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
iframe{position:fixed;inset:0;width:100%;height:100%;border:0;background:white}
</style>
</head>
<body>
<div id="loading"><div class="spinner"></div><div>Đang mở ${safeTitle}...</div></div>
<iframe id="appFrame" src="${safeUrl}" allow="clipboard-read; clipboard-write; autoplay" referrerpolicy="strict-origin-when-cross-origin"></iframe>
<script>
const f=document.getElementById('appFrame'),l=document.getElementById('loading');
f.addEventListener('load',()=>{l.style.display='none'});
setTimeout(()=>{l.style.display='none'},8000);
</script>
</body>
</html>`;
}

function menu(base) {
  const items = Object.entries(ROUTES).map(([path,r]) =>
    `<a href="/${path}"><b>${esc(r.title)}</b><small>/${path}</small></a>`).join('');
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hệ thống xếp hàng</title><style>body{font-family:Arial;background:#f4f7fb;margin:0;padding:28px;color:#17324d}.wrap{max-width:980px;margin:auto}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px}a{display:flex;flex-direction:column;gap:8px;text-decoration:none;color:#0b5fa5;background:white;padding:20px;border-radius:14px;border:1px solid #dce6ef;box-shadow:0 3px 12px #0000000a}small{color:#718096}</style></head><body><div class="wrap"><h1>Hệ thống xếp hàng tự động</h1><div class="grid">${items}</div></div></body></html>`;
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const arr = Array.isArray(params.route) ? params.route : [params.route].filter(Boolean);
  const path = arr.join('/').replace(/^\/+|\/+$/g,'');

  // Không can thiệp các route khác của Portal.
  if (!path.startsWith('xep-hang')) return context.next();

  if (path === 'xep-hang') {
    return new Response(menu(new URL(request.url).origin), {headers:{'content-type':'text/html; charset=utf-8','cache-control':'public, max-age=300'}});
  }

  const route = ROUTES[path];
  if (!route) return new Response('Không tìm thấy trang chức năng.', {status:404});

  const baseUrl = String(env.QUEUE_APP_URL || '').trim();
  if (!baseUrl) {
    return new Response('Chưa cấu hình QUEUE_APP_URL trên Cloudflare.', {status:500});
  }

  const requireAccess = String(env.REQUIRE_ACCESS || 'false').toLowerCase() === 'true';
  if (route.access === 'protected' && requireAccess && !accessEmail(request)) {
    return new Response('Trang này yêu cầu đăng nhập cán bộ qua Cloudflare Access.', {status:401});
  }

  const incoming = new URL(request.url);
  const target = new URL(baseUrl);
  target.searchParams.set('page', route.page);

  // Chuyển tiếp query string cần thiết: counter, services, ticket...
  for (const [k,v] of incoming.searchParams.entries()) {
    if (!['page'].includes(k)) target.searchParams.set(k,v);
  }

  return new Response(htmlShell(target.toString(), route.title), {
    status: 200,
    headers: {
      'content-type':'text/html; charset=utf-8',
      'cache-control':'no-store',
      'x-frame-options':'SAMEORIGIN'
    }
  });
}
