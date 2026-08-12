function doGet(e){return handleRequest_(e,'GET')}
function doPost(e){return handleRequest_(e,'POST')}
function handleRequest_(e,method){
 try{
   const route=String((e.parameter&&e.parameter.route)||'apps').replace(/^\/+|\/+$/g,'');
   const secret=String((e.parameter&&e.parameter.key)||'');
   if(secret!==getApiSecret_()) return json_({ok:false,error:'Unauthorized'});
   const user=String((e.parameter&&e.parameter.user)||'unknown');
   if(method==='POST' && e.parameter && e.parameter._method==='DELETE') method='DELETE';
   if(method==='GET'&&route==='apps') return json_({ok:true,data:listApps_(e.parameter&&e.parameter.all==='1')});
   if(method==='GET'&&route==='config') return json_({ok:true,data:getConfig_()});
   if(method==='GET'&&route==='admin/audit') return json_({ok:true,data:listAudit_()});
   if(method==='POST'&&route==='admin/apps'){const b=body_(e);saveApp_(b,user);return json_({ok:true})}
   if(method==='POST'&&route==='admin/config'){const b=body_(e);saveConfig_(b,user);return json_({ok:true})}
   // Apps Script Web App không nhận HTTP DELETE ổn định ở mọi luồng, nên Worker có thể gửi DELETE; dự phòng POST _method.
   if((method==='DELETE'||method==='POST')&&route.indexOf('admin/apps/')===0){const id=decodeURIComponent(route.substring('admin/apps/'.length));deleteApp_(id,user);return json_({ok:true})}
   return json_({ok:false,error:'Route không tồn tại: '+route});
 }catch(err){return json_({ok:false,error:String(err&&err.message||err)})}
}

function body_(e){try{return JSON.parse((e.postData&&e.postData.contents)||'{}')}catch(_){throw new Error('JSON không hợp lệ')}}
function json_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON)}
function getApiSecret_(){const s=PropertiesService.getScriptProperties().getProperty('PORTAL_API_SECRET');if(!s)throw new Error('Chưa cấu hình Script Property PORTAL_API_SECRET');return s}
