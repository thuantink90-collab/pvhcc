function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})}
function isAdminPath(path){return path==='admin'||path.startsWith('admin/')}
function accessEmail(request){return request.headers.get('Cf-Access-Authenticated-User-Email')||request.headers.get('cf-access-authenticated-user-email')||''}
export async function onRequest(context){
 const {request,env,params}=context; const raw=Array.isArray(params.path)?params.path.join('/'):String(params.path||''); const path=raw.replace(/^\/+|\/+$/g,'');
 if(!env.GAS_API_URL||!env.GAS_API_SECRET)return json({ok:false,error:'Chưa cấu hình GAS_API_URL/GAS_API_SECRET trên Cloudflare'},500);
 if(isAdminPath(path) && String(env.REQUIRE_ACCESS||'true').toLowerCase()==='true' && !accessEmail(request)) return json({ok:false,error:'Trang quản trị yêu cầu Cloudflare Access.'},401);
 let target=env.GAS_API_URL; const url=new URL(request.url); const qs=new URLSearchParams(url.search); qs.set('route',path||'apps'); qs.set('key',env.GAS_API_SECRET); qs.set('user',accessEmail(request)||'cloudflare'); if(request.method==='DELETE') qs.set('_method','DELETE'); const q=qs.toString(); target+=(target.includes('?')?'&':'?')+q;
 const headers={};
 const method=request.method==='DELETE'?'POST':request.method; const init={method,headers,redirect:'follow'}; if(!['GET','HEAD'].includes(method)) {headers['Content-Type']='application/json';init.body=await request.text()}
 try{const r=await fetch(target,init);const text=await r.text();return new Response(text,{status:r.ok?r.status:502,headers:{'content-type':r.headers.get('content-type')||'application/json; charset=utf-8','cache-control':'no-store'}})}catch(e){return json({ok:false,error:'Không kết nối được Apps Script: '+e.message},502)}
}
