function setupPortalSheets(){
 const ss=ss_();
 create_(ss,PORTAL.SHEETS.APPS,['id','audience','category','name','icon','description','url','access','permission','featured','order','status','updatedAt','updatedBy']);
 create_(ss,PORTAL.SHEETS.CONFIG,['key','value','updatedAt','updatedBy']);
 create_(ss,PORTAL.SHEETS.AUDIT,['time','user','action','target','detail']);
 seedApps_(); seedConfig_(); SpreadsheetApp.flush();
}
function create_(ss,name,headers){let s=ss.getSheetByName(name);if(!s)s=ss.insertSheet(name);if(s.getLastRow()===0){s.getRange(1,1,1,headers.length).setValues([headers]).setFontWeight('bold');s.setFrozenRows(1)}return s}
function seedConfig_(){const s=sh_(PORTAL.SHEETS.CONFIG);if(s.getLastRow()>1)return;s.getRange(2,1,3,4).setValues([
 ['heroTitle','Một điểm truy cập cho các dịch vụ và tiện ích hành chính công',new Date(),'setup'],
 ['heroText','Truy cập nhanh dịch vụ dành cho người dân hoặc không gian làm việc số dành cho cán bộ Trung tâm.',new Date(),'setup'],
 ['staffLoginUrl','/staff/',new Date(),'setup']])}
function seedApps_(){const s=sh_(PORTAL.SHEETS.APPS);if(s.getLastRow()>1)return;const now=new Date();const R=(id,aud,cat,name,icon,desc,url,access,perm,featured,order)=>[id,aud,cat,name,icon,desc,url,access,perm,featured,order,'ACTIVE',now,'setup'];const rows=[
 R('queue-online','citizen','Thực hiện thủ tục','Lấy số trực tuyến','🎫','Lấy số trước khi đến Trung tâm, giảm thời gian chờ.','#','public','',true,1),
 R('dvcqg','citizen','Thực hiện thủ tục','Cổng Dịch vụ công Quốc gia','🌐','Nộp hồ sơ, tra cứu, thanh toán và sử dụng dịch vụ công trực tuyến.','https://dichvucong.gov.vn/','public','',true,2),
 R('handbook','citizen','Hướng dẫn & tra cứu','Sổ tay TTHC điện tử','📚','Tra cứu thành phần hồ sơ, quy trình, video và hướng dẫn thủ tục.','#','public','',true,3),
 R('lookup','citizen','Hướng dẫn & tra cứu','Tra cứu hồ sơ','🔎','Kiểm tra tình trạng xử lý hồ sơ và kết quả giải quyết.','https://dichvucong.gov.vn/','public','',true,4),
 R('service-rating','citizen','Đánh giá & phản ánh','Đánh giá chất lượng giải quyết TTHC','⭐','Đánh giá quá trình tiếp nhận, xử lý và trả kết quả.','#','public','',true,5),
 R('staff-rating','citizen','Đánh giá & phản ánh','Đánh giá cán bộ HCC','👨‍💼','Góp ý, đánh giá thái độ và chất lượng phục vụ của cán bộ.','#','public','',true,6),
 R('assistant','citizen','Hướng dẫn & tra cứu','Trợ lý TTHC','🤖','Hỏi đáp nhanh về hồ sơ, thủ tục và dịch vụ công.','#','public','',false,7),
 R('home-service','citizen','Hỗ trợ người dân','Hỗ trợ TTHC tại nhà','🏠','Thông tin hỗ trợ nhóm người khó khăn trong việc đi lại.','#','public','',false,8),
 R('thanh-lan','citizen','Hỗ trợ người dân','Dịch vụ tại Thanh Lân','🏝️','Thông tin hỗ trợ, tiếp nhận và trả kết quả tại điểm Thanh Lân.','#','public','',false,9),
 R('no-appointment','citizen','Hỗ trợ người dân','Ngày thứ Năm không hẹn','📅','Danh sách thủ tục được hỗ trợ giải quyết ngay trong ngày.','#','public','',false,10),
 R('feedback','citizen','Đánh giá & phản ánh','Phản ánh, kiến nghị','📢','Gửi phản ánh, kiến nghị về thủ tục và quá trình phục vụ.','https://dichvucong.gov.vn/','public','',false,11),
 R('staff-qn','staff','Hệ thống giải quyết TTHC','Hệ thống giải quyết TTHC Quảng Ninh','🏛️','Truy cập hệ thống thông tin giải quyết TTHC của tỉnh Quảng Ninh.','#','public','',false,1),
 R('staff-dvcqg','staff','Cổng DVC Quốc gia','Cổng Dịch vụ công Quốc gia','🌐','Tra cứu, hỗ trợ người dân và khai thác các tiện ích DVCQG.','https://dichvucong.gov.vn/','public','',false,2),
 R('ministry-systems','staff','Hệ thống Bộ, ngành','Hệ thống TTHC Bộ, ngành','🏢','Danh mục liên kết hệ thống thông tin, cổng và nền tảng của các Bộ, ngành.','#','public','',false,3),
 R('specialized','staff','Phần mềm chuyên ngành','Phần mềm chuyên ngành','🧩','Tư pháp - hộ tịch, đất đai, xây dựng, BHXH, thuế và các hệ thống chuyên ngành.','#','public','',false,4),
 R('queue-dashboard','staff','Hệ thống Trung tâm','Xếp hàng + Đánh giá cán bộ','🎛️','Điều hành quầy, gọi số, theo dõi lượt phục vụ và đánh giá cán bộ.','#','protected','QUEUE_VIEW',false,5),
 R('evaluation-dashboard','staff','Hệ thống Trung tâm','Đánh giá giải quyết TTHC','📊','Dashboard tổng hợp mức độ hài lòng, cảnh báo và phản ánh.','#','protected','EVALUATION_VIEW',false,6),
 R('handbook-admin','staff','Hệ thống Trung tâm','Quản trị Sổ tay điện tử','📘','Quản lý lĩnh vực, thủ tục, nội dung hướng dẫn, video và liên kết.','#','protected','HANDBOOK_VIEW',false,7),
 R('portal-admin','staff','Quản trị & Dashboard','Quản trị Cổng điều phối','⚙️','Quản lý ứng dụng, liên kết và cấu hình Portal.','/admin.html','protected','PORTAL_ADMIN',false,8)
 ];s.getRange(2,1,rows.length,rows[0].length).setValues(rows)}
function setPortalApiSecret(){const secret=Utilities.getUuid()+'-'+Utilities.getUuid();PropertiesService.getScriptProperties().setProperty('PORTAL_API_SECRET',secret);Logger.log('PORTAL_API_SECRET = '+secret)}
