const PUBLIC_CACHE_PATHS = new Set(['apps','config','bootstrap']);
const EDGE_TTL_SECONDS = 300;

function json(data,status=200,extraHeaders={}){
  return new Response(JSON.stringify(data),{
    status,
    headers:{
      'content-type':'application/json; charset=utf-8',
      'cache-control':'no-store',
      ...extraHeaders
    }
  });
}
function isAdminPath(path){return path==='admin'||path.startsWith('admin/')}
function accessEmail(request){return request.headers.get('Cf-Access-Authenticated-User-Email')||request.headers.get('cf-access-authenticated-user-email')||''}
function cacheRequestFor(request,path){
  const u=new URL(request.url);
  u.pathname='/api/'+path;
  u.search='';
  return new Request(u.toString(),{method:'GET'});
}
async function invalidatePublicCache(request){
  try{
    const cache=caches.default;
    await Promise.all(['apps','config','bootstrap'].map(p=>cache.delete(cacheRequestFor(request,p))));
  }catch(_){/* cache invalidation is best-effort */}
}

export async function onRequest(context){
  const {request,env,params}=context;
  const raw=Array.isArray(params.path)?params.path.join('/'):String(params.path||'');
  const path=raw.replace(/^\/+|\/+$/g,'');

  if(!env.GAS_API_URL||!env.GAS_API_SECRET){
    return json({ok:false,error:'Chưa cấu hình GAS_API_URL/GAS_API_SECRET trên Cloudflare'},500);
  }
  if(isAdminPath(path) && String(env.REQUIRE_ACCESS||'true').toLowerCase()==='true' && !accessEmail(request)){
    return json({ok:false,error:'Trang quản trị yêu cầu Cloudflare Access.'},401);
  }

  const method0=request.method.toUpperCase();
  const canEdgeCache=method0==='GET' && PUBLIC_CACHE_PATHS.has(path);
  if(canEdgeCache){
    try{
      const cache=caches.default;
      const key=cacheRequestFor(request,path);
      const hit=await cache.match(key);
      if(hit){
        const h=new Headers(hit.headers);
        h.set('x-pvhcc-cache','HIT');
        return new Response(hit.body,{status:hit.status,headers:h});
      }
    }catch(_){/* continue to origin */}
  }

  let target=env.GAS_API_URL;
  const url=new URL(request.url);
  const qs=new URLSearchParams(url.search);
  qs.set('route',path||'apps');
  qs.set('key',env.GAS_API_SECRET);
  qs.set('user',accessEmail(request)||'cloudflare');
  if(method0==='DELETE') qs.set('_method','DELETE');
  target+=(target.includes('?')?'&':'?')+qs.toString();

  const headers={};
  const method=method0==='DELETE'?'POST':method0;
  const init={method,headers,redirect:'follow'};
  if(!['GET','HEAD'].includes(method)){
    headers['Content-Type']='application/json';
    init.body=await request.text();
  }

  try{
    const r=await fetch(target,init);
    const text=await r.text();
    const contentType=r.headers.get('content-type')||'application/json; charset=utf-8';
    const response=new Response(text,{
      status:r.ok?r.status:502,
      headers:{
        'content-type':contentType,
        'cache-control':canEdgeCache?'public, max-age=60, s-maxage=300':'no-store',
        'x-pvhcc-cache':'MISS'
      }
    });

    if(canEdgeCache && r.ok){
      try{
        const cache=caches.default;
        const key=cacheRequestFor(request,path);
        context.waitUntil(cache.put(key,response.clone()));
      }catch(_){/* best-effort */}
    }

    if(isAdminPath(path) && method!=='GET' && r.ok){
      context.waitUntil(invalidatePublicCache(request));
    }
    return response;
  }catch(e){
    return json({ok:false,error:'Không kết nối được Apps Script: '+e.message},502);
  }
}
