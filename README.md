# PVHCC Cô Tô Portal 2.0

Kiến trúc: Cloudflare Pages (frontend + Pages Function API proxy) -> Google Apps Script -> Google Sheet.

## 1. Apps Script backend
1. Mở Apps Script đang gắn với Google Sheet hoặc tạo project mới.
2. Tạo 4 file: Config.gs, App.gs, Database.gs, Setup.gs bằng nội dung trong thư mục `apps-script-backend`.
3. Chạy `setupPortalSheets()` một lần để tạo: Portal_Apps, Portal_Config, Portal_Audit.
4. Chạy `setPortalApiSecret()` một lần, mở Execution log và sao chép PORTAL_API_SECRET.
5. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone.
6. Sao chép URL `/exec`.

## 2. Cloudflare Pages
1. Đưa toàn bộ thư mục Portal 2.0 lên repository GitHub.
2. Cloudflare Pages > Connect to Git.
3. Framework: None. Build command: để trống. Output: `/`.
4. Settings > Variables and Secrets, tạo:
   - GAS_API_URL = URL Apps Script `/exec`
   - GAS_API_SECRET = secret ở bước trên (đặt dạng Secret)
   - REQUIRE_ACCESS = false trong lúc thử nghiệm; đổi thành true khi đã cấu hình Cloudflare Access.
5. Deploy lại.

## 3. Bảo vệ quản trị
Tạo Cloudflare Zero Trust > Access > Applications > Self-hosted application cho:
- `https://TEN-MIEN/admin*`
- `https://TEN-MIEN/api/admin/*`
Chỉ cho phép email/tài khoản cán bộ phù hợp. Sau đó đặt REQUIRE_ACCESS=true.

## 4. Quản lý dữ liệu
- Portal_Apps: mỗi dòng là một tiện ích/app.
- Portal_Config: cấu hình giao diện.
- Portal_Audit: nhật ký thêm/sửa/xóa.
Trang `/admin.html` thao tác trực tiếp với các sheet trên thông qua API.

## 5. Lưu ý
Apps Script không nên chứa mật khẩu người dùng. `PORTAL_API_SECRET` chỉ là khóa máy-máy giữa Cloudflare Function và Apps Script và không xuất hiện trong trình duyệt.
