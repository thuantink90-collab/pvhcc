const PUBLIC_CACHE_PATHS = new Set(['apps','config','bootstrap']);
const EDGE_TTL_SECONDS = 300;

function json(data,status=200,extraHeaders={}){
  return new Response(JSON.stringify(data),{
    status,
    headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...extraHeaders}
  });
}
function isAdminPath(path){return path==='admin'||path.startsWith('admin/')}
function accessEmail(request){return request.headers.get('Cf-Access-Authenticated-User-Email')||request.headers.get('cf-access-authenticated-user-email')||''}
function cookieValue(request,name){
  const raw=request.headers.get('Cookie')||'';
  const m=raw.match(new RegExp('(?:^|;\\s*)'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'=([^;]*)'));
  return m?decodeURIComponent(m[1]):'';
}
function cacheRequestFor(request,path){
  const u=new URL(request.url); u.pathname='/api/'+path; u.search='';
  return new Request(u.toString(),{method:'GET'});
}
async function invalidatePublicCache(request){
  try{const cache=caches.default;await Promise.all(['apps','config','bootstrap'].map(p=>cache.delete(cacheRequestFor(request,p))));}catch(_){}
}

async function callGas(env, request, path, method0, session) {

  const gasUrl =
    String(env.GAS_API_URL || '').trim();

  const secret =
    String(env.GAS_API_SECRET || '').trim();

  if (!gasUrl) {
    throw new Error(
      'Chưa cấu hình GAS_API_URL trên Cloudflare.'
    );
  }

  if (!secret) {
    throw new Error(
      'Chưa cấu hình GAS_API_SECRET trên Cloudflare.'
    );
  }


  const incoming =
    new URL(request.url);


  const qs =
    new URLSearchParams(incoming.search);


  qs.set(
    'route',
    path || 'apps'
  );

  qs.set(
    'key',
    secret
  );

  qs.set(
    'session',
    session || ''
  );


  let target =
    gasUrl +
    (gasUrl.includes('?') ? '&' : '?') +
    qs.toString();


  const method =
    method0 === 'DELETE'
      ? 'POST'
      : method0;


  let body = undefined;


  if (
    !['GET', 'HEAD'].includes(method)
  ) {

    body =
      await request.text();
  }


  function makeInit() {

    const headers = {
      'Accept':
        'application/json'
    };


    if (
      !['GET', 'HEAD'].includes(method)
    ) {

      headers['Content-Type'] =
        'application/json';
    }


    const init = {
      method: method,
      headers: headers,
      redirect: 'manual'
    };


    if (
      body !== undefined
    ) {

      init.body = body;
    }


    return init;
  }


  // ==================================================
  // GỌI LẦN 1
  // ==================================================

  let response =
    await fetch(
      target,
      makeInit()
    );


  // ==================================================
  // XỬ LÝ REDIRECT APPS SCRIPT
  // ==================================================

  for (
    let i = 0;
    i < 3;
    i++
  ) {

    if (
      response.status !== 301 &&
      response.status !== 302 &&
      response.status !== 303 &&
      response.status !== 307 &&
      response.status !== 308
    ) {

      break;
    }


    const location =
      response.headers.get(
        'Location'
      );


    if (!location) {

      throw new Error(
        'Apps Script trả redirect nhưng không có Location.'
      );
    }


    target =
      new URL(
        location,
        target
      ).toString();


    // Giữ nguyên POST
    response =
      await fetch(
        target,
        makeInit()
      );
  }


  return response;
}




export async function onRequest(context){
  const {request,env,params}=context;
  const raw=Array.isArray(params.path)?params.path.join('/'):String(params.path||'');
  const path=raw.replace(/^\/+|\/+$/g,'');

  if(!env.GAS_API_URL||!env.GAS_API_SECRET) return json({ok:false,error:'Chưa cấu hình GAS_API_URL/GAS_API_SECRET trên Cloudflare'},500);

  const method0=request.method.toUpperCase();
  const session=cookieValue(request,'PVHCC_SESSION');

  // Auth API: login/logout/me
  if(path==='auth/login' && method0==='POST'){
    const r=await callGas(env,request,path,method0,'');
    const text=await r.text();
    let j; try{j=JSON.parse(text)}catch(_){return json({ok:false,error:'Phản hồi đăng nhập không hợp lệ.'},502)}
    if(!r.ok||j.ok===false) return json(j,r.status||401);
    const token=j?.data?.token;
    if(!token) return json({ok:false,error:'Không tạo được phiên đăng nhập.'},502);
    return json({ok:true,data:{authenticated:true,user:{email:j.data.email,name:j.data.name,role:j.data.role,permissions:j.data.permissions}}},200,{
      'Set-Cookie':`PVHCC_SESSION=${encodeURIComponent(token)}; Path=/; Max-Age=21600; HttpOnly; Secure; SameSite=Lax`
    });
  }

  if(path==='auth/logout' && method0==='POST'){
    const r=await callGas(env,request,path,method0,session);
    const text=await r.text();
    return new Response(text,{status:r.ok?200:r.status,headers:{
      'content-type':'application/json; charset=utf-8',
      'cache-control':'no-store',
      'Set-Cookie':'PVHCC_SESSION=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax'
    }});
  }

  if(path==='auth/me' && method0==='GET'){
    const r=await callGas(env,request,path,method0,session);
    return new Response(await r.text(),{status:r.ok?200:r.status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
  }

  if(isAdminPath(path) && !session){
    return new Response(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Đăng nhập quản trị</title><style>
body{margin:0;background:#f4f7fb;font-family:Arial;color:#17324d;display:grid;place-items:center;min-height:100vh}.box{width:min(420px,calc(100% - 32px));background:#fff;border:1px solid #dce6ef;border-radius:18px;padding:28px;box-shadow:0 12px 40px #17324d18}h1{margin:0 0 6px;color:#075b9d;font-size:24px}p{color:#667788;font-size:14px}label{display:block;margin:16px 0 6px;font-weight:700}input{width:100%;padding:12px;box-sizing:border-box;border:1px solid #ccd9e4;border-radius:10px;font-size:15px}button{width:100%;margin-top:20px;padding:12px;border:0;border-radius:10px;background:#0b6fae;color:#fff;font-weight:700;font-size:15px;cursor:pointer}.err{color:#b42318;margin-top:12px;font-size:14px;min-height:20px}.back{display:inline-block;margin-top:16px;color:#0b6fae;text-decoration:none;font-size:14px}
</style></head><body><form class="box" id="f"><h1>Đăng nhập quản trị</h1><p>Cổng điều phối Trung tâm Phục vụ Hành chính công đặc khu Cô Tô</p><label>Email</label><input id="e" type="email" required autocomplete="username"><label>Mật khẩu</label><input id="p" type="password" required autocomplete="current-password"><div class="err" id="err"></div><button>Đăng nhập</button><a class="back" href="/">← Về Cổng điều phối</a></form><script>
f.onsubmit=async ev=>{ev.preventDefault();err.textContent='Đang kiểm tra...';try{const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:e.value,password:p.value})});const j=await r.json();if(!r.ok||!j.ok)throw Error(j.error||'Đăng nhập thất bại');location.href=${JSON.stringify('/'+path)};}catch(x){err.textContent=x.message||'Đăng nhập thất bại';}};
</script></body></html>`,{status:401,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
  }

  const method=method0;
  const canEdgeCache=method==='GET' && PUBLIC_CACHE_PATHS.has(path);
  if(canEdgeCache){
    try{const cache=caches.default,key=cacheRequestFor(request,path),hit=await cache.match(key);if(hit){const h=new Headers(hit.headers);h.set('x-pvhcc-cache','HIT');return new Response(hit.body,{status:hit.status,headers:h});}}catch(_){}
  }

  // Các API quản trị sẽ được kiểm tra lần nữa tại Apps Script.
  let r;
  try{r=await callGas(env,request,path,method,session);}catch(e){return json({ok:false,error:'Không kết nối được Apps Script: '+e.message},502);}
  const text=await r.text();
  const response=new Response(text,{status:r.ok?r.status:502,headers:{
    'content-type':r.headers.get('content-type')||'application/json; charset=utf-8',
    'cache-control':canEdgeCache?'public, max-age=60, s-maxage=300':'no-store',
    'x-pvhcc-cache':'MISS'
  }});
  if(canEdgeCache && r.ok){try{const cache=caches.default,key=cacheRequestFor(request,path);context.waitUntil(cache.put(key,response.clone()));}catch(_){}}
  if(path.startsWith('admin/') && method!=='GET' && r.ok) context.waitUntil(invalidatePublicCache(request));
  return response;
}
