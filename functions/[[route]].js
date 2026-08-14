const ROUTES = {
  // =====================================================
  // HỆ THỐNG XẾP HÀNG
  // =====================================================

  'xep-hang/kiosk': {
    page: 'kiosk',
    title: 'Kiosk lấy số',
    access: 'public'
  },

  'xep-hang/mobile': {
    page: 'mobile',
    title: 'Lấy số trực tuyến',
    access: 'public'
  },

  'xep-hang/dat-lich': {
    page: 'booking',
    title: 'Đặt lịch trực tuyến',
    access: 'public'
  },

  'xep-hang/quay': {
    page: 'staff',
    title: 'Điều hành quầy',
    access: 'protected'
  },

  'xep-hang/hien-thi': {
    page: 'display',
    title: 'Màn hình gọi số',
    access: 'public'
  },

  'xep-hang/danh-gia': {
    page: 'feedback',
    title: 'Đánh giá cán bộ',
    access: 'public'
  },

  'xep-hang/admin': {
    page: 'admin',
    title: 'Quản trị xếp hàng',
    access: 'protected'
  },


  // =====================================================
  // SỔ TAY ĐIỆN TỬ
  // =====================================================

  // Công dân
  // pvhcc.pages.dev/so-tay
  // → Apps Script /exec
  'so-tay': {
    app: 'handbook',
    view: '',
    title: 'Sổ tay điện tử TTHC',
    access: 'public'
  },

  // Cán bộ
  // pvhcc.pages.dev/so-tay/quan-tri
  // → Apps Script /exec?view=admin
  'so-tay/quan-tri': {
    app: 'handbook',
    view: 'admin',
    title: 'Quản trị Sổ tay điện tử',
    access: 'protected'
  }
};


// =====================================================
// TIỆN ÍCH
// =====================================================

function esc(s = '') {
  return String(s).replace(
    /[&<>"']/g,
    c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c])
  );
}


function accessEmail(request) {
  return (
    request.headers.get('Cf-Access-Authenticated-User-Email') ||
    request.headers.get('cf-access-authenticated-user-email') ||
    ''
  );
}


// =====================================================
// IFRAME SHELL
// =====================================================

function htmlShell(targetUrl, title) {

  const safeUrl = esc(targetUrl);
  const safeTitle = esc(title);

  return `<!doctype html>
<html lang="vi">

<head>

<meta charset="utf-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1,viewport-fit=cover"
>

<title>${safeTitle} | PVHCC Cô Tô</title>

<style>

html,
body {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #f4f7fb;
  font-family: Arial, Helvetica, sans-serif;
}

#loading {
  position: fixed;
  inset: 0;
  z-index: 2;

  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;

  gap: 12px;

  background: #f4f7fb;

  color: #0b5fa5;

  font-weight: 700;
}

.spinner {
  width: 38px;
  height: 38px;

  border: 4px solid #d9e6f2;
  border-top-color: #0b5fa5;

  border-radius: 50%;

  animation: spin .8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

iframe {
  position: fixed;
  inset: 0;

  width: 100%;
  height: 100%;

  border: 0;

  background: white;
}

</style>

</head>

<body>

<div id="loading">

  <div class="spinner"></div>

  <div>
    Đang mở ${safeTitle}...
  </div>

</div>


<iframe
  id="appFrame"
  src="${safeUrl}"
  allow="clipboard-read; clipboard-write; autoplay"
  referrerpolicy="strict-origin-when-cross-origin">
</iframe>


<script>

const frame = document.getElementById('appFrame');
const loading = document.getElementById('loading');

frame.addEventListener('load', () => {
  loading.style.display = 'none';
});

// tránh màn hình loading treo vĩnh viễn
setTimeout(() => {
  loading.style.display = 'none';
}, 8000);

</script>

</body>

</html>`;
}


// =====================================================
// MENU HỆ THỐNG XẾP HÀNG
// =====================================================

function menu() {

  const items = Object.entries(ROUTES)

    .filter(([path]) => path.startsWith('xep-hang/'))

    .map(([path, route]) => {

      return `
        <a href="/${path}">

          <b>
            ${esc(route.title)}
          </b>

          <small>
            /${path}
          </small>

        </a>
      `;

    })

    .join('');


  return `<!doctype html>

<html lang="vi">

<head>

<meta charset="utf-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1"
>

<title>
Hệ thống xếp hàng
</title>

<style>

* {
  box-sizing: border-box;
}

body {

  font-family: Arial, Helvetica, sans-serif;

  background: #f4f7fb;

  margin: 0;

  color: #17324d;
}

.header {

  background:
    linear-gradient(
      135deg,
      #075b9d,
      #0b76bd
    );

  color: white;

  padding: 28px 20px;
}

.header-inner,
.wrap {

  max-width: 1080px;

  margin: auto;
}

.header h1 {

  margin: 0 0 6px;

  font-size: 27px;
}

.header p {

  margin: 0;

  color: #e8f5ff;
}

.back {

  color: #dff2ff;

  text-decoration: none;

  display: inline-block;

  margin-bottom: 15px;

  font-size: 14px;
}

.wrap {

  padding: 28px 20px;
}

.grid {

  display: grid;

  grid-template-columns:
    repeat(
      auto-fit,
      minmax(230px,1fr)
    );

  gap: 14px;
}

.grid a {

  display: flex;

  flex-direction: column;

  gap: 8px;

  text-decoration: none;

  color: #0b5fa5;

  background: white;

  padding: 20px;

  border-radius: 14px;

  border: 1px solid #dce6ef;

  box-shadow:
    0 3px 12px
    rgba(0,0,0,.04);

  transition: .18s;
}

.grid a:hover {

  transform: translateY(-3px);

  border-color: #69a9d7;

  box-shadow:
    0 8px 22px
    rgba(11,95,165,.12);
}

.grid b {

  font-size: 17px;
}

.grid small {

  color: #718096;
}

</style>

</head>

<body>


<header class="header">

<div class="header-inner">

<a
  class="back"
  href="/">
← Cổng điều phối
</a>

<h1>
Hệ thống xếp hàng tự động
</h1>

<p>
Trung tâm Phục vụ Hành chính công
</p>

</div>

</header>


<main class="wrap">

<div class="grid">

${items}

</div>

</main>

</body>

</html>`;
}


// =====================================================
// LẤY DANH SÁCH QUẦY TỪ APPS SCRIPT
// =====================================================

async function loadCounters(env) {

  // fallback khi API quầy tạm lỗi
  const fallback = () => {

    const raw =
      String(env.QUEUE_COUNTERS || '')
        .trim();


    // nếu vẫn còn cấu hình fallback trên Cloudflare
    if (raw) {

      return raw

        .split(';')

        .map((item, index) => {

          const [
            id0,
            name0
          ] = item.split('|');


          const id =
            String(
              id0 ||
              index + 1
            ).trim();


          const name =
            String(
              name0 ||
              `Quầy ${id}`
            ).trim();


          return {
            id,
            name,
            services: ''
          };

        })

        .filter(x => x.id);

    }


    return [
      {
        id: '1',
        name: 'Quầy 1',
        services: ''
      },
      {
        id: '2',
        name: 'Quầy 2',
        services: ''
      },
      {
        id: '3',
        name: 'Quầy 3',
        services: ''
      }
    ];
  };


  const base =
    String(
      env.QUEUE_APP_URL || ''
    ).trim();


  if (!base) {
    return fallback();
  }


  try {

    const url =
      new URL(base);


    url.searchParams.set(
      'api',
      'counters'
    );


    const response =
      await fetch(
        url.toString(),
        {
          headers: {
            'accept':
              'application/json'
          },

          cf: {
            cacheTtl: 300,
            cacheEverything: true
          }
        }
      );


    if (!response.ok) {
      return fallback();
    }


    const payload =
      await response.json();


    let arr =

      Array.isArray(payload)
        ? payload

        : Array.isArray(payload?.data)
          ? payload.data

          : Array.isArray(payload?.counters)
            ? payload.counters

            : [];


    arr = arr

      .map((x, index) => {

        if (
          typeof x === 'string'
        ) {

          const id =
            String(index + 1);

          return {
            id,
            name: x,
            services: ''
          };

        }


        const id =
          String(
            x.id ??
            x.counter ??
            x.soQuay ??
            x.code ??
            index + 1
          ).trim();


        const name =
          String(
            x.name ??
            x.ten ??
            x.tenQuay ??
            x.label ??
            `Quầy ${id}`
          ).trim();


        const services =
          String(
            x.services ??
            x.allowedServices ??
            ''
          ).trim();


        return {
          id,
          name,
          services
        };

      })

      .filter(x => x.id);


    return (
      arr.length
        ? arr
        : fallback()
    );

  }
  catch (error) {

    console.error(
      'Không lấy được danh sách quầy:',
      error
    );

    return fallback();

  }
}


// =====================================================
// DANH SÁCH QUẦY ĐIỀU HÀNH
// =====================================================

function counterMenu(counters) {

  const cards = counters

    .map(counter => {

      const params =
        new URLSearchParams();


      params.set(
        'counter',
        counter.id
      );


      // nếu sheet Counters có cấu hình services
      if (counter.services) {

        params.set(
          'services',
          counter.services
        );

      }


      return `

      <a
        class="counter"
        href="/xep-hang/quay?${params.toString()}"
      >

        <span class="counter-icon">
          🖥️
        </span>

        <span class="counter-name">
          ${esc(counter.name)}
        </span>

        <span class="counter-sub">
          Mở trang gọi số
        </span>

        <span class="open">
          Điều hành →
        </span>

      </a>

      `;

    })

    .join('');


  return `<!doctype html>

<html lang="vi">

<head>

<meta charset="utf-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1"
>

<title>
Điều hành quầy | PVHCC Cô Tô
</title>

<style>

* {
  box-sizing: border-box;
}

body {

  margin: 0;

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  background: #f4f7fb;

  color: #17324d;
}

.top {

  background:
    linear-gradient(
      135deg,
      #075b9d,
      #0b76bd
    );

  color: #fff;

  padding: 22px 20px;
}

.topin,
.wrap {

  max-width: 1080px;

  margin: auto;
}

.back {

  color: #dff2ff;

  text-decoration: none;

  font-size: 14px;
}

h1 {

  font-size: 26px;

  margin:
    12px
    0
    5px;
}

.lead {

  margin: 0;

  color: #e8f5ff;
}

.wrap {

  padding:
    28px
    20px;
}

.title {

  font-size: 17px;

  font-weight: 800;

  margin-bottom: 16px;
}

.grid {

  display: grid;

  grid-template-columns:
    repeat(
      auto-fit,
      minmax(220px,1fr)
    );

  gap: 16px;
}

.counter {

  min-height: 185px;

  background: #fff;

  border:
    1px solid
    #d9e5ef;

  border-radius: 16px;

  padding: 22px;

  text-decoration: none;

  color: #17324d;

  box-shadow:
    0 4px 14px
    rgba(0,0,0,.05);

  transition: .18s;
}

.counter:hover {

  transform:
    translateY(-3px);

  border-color:
    #69a9d7;

  box-shadow:
    0 9px 24px
    rgba(11,95,165,.12);
}

.counter-icon {

  display: flex;

  width: 54px;

  height: 54px;

  border-radius: 14px;

  background: #eaf5fd;

  align-items: center;

  justify-content: center;

  font-size: 28px;

  margin-bottom: 16px;
}

.counter-name {

  display: block;

  font-size: 20px;

  font-weight: 800;

  color: #0b5fa5;
}

.counter-sub {

  display: block;

  color: #6c7e8f;

  margin-top: 7px;

  font-size: 14px;
}

.open {

  display: block;

  margin-top: 20px;

  color: #0b6fae;

  font-weight: 700;

  font-size: 14px;
}

.note {

  margin-top: 22px;

  padding:
    14px
    16px;

  border-radius: 12px;

  background: #fff8e6;

  border:
    1px solid
    #f1d89b;

  color: #735b1b;

  font-size: 14px;
}

@media(max-width:600px) {

  h1 {
    font-size: 22px;
  }

  .wrap {
    padding:
      20px
      14px;
  }

  .grid {
    grid-template-columns:
      1fr
      1fr;

    gap: 10px;
  }

  .counter {

    min-height: 160px;

    padding: 16px;
  }

  .counter-name {
    font-size: 17px;
  }

}

</style>

</head>

<body>


<header class="top">

<div class="topin">

<a
  class="back"
  href="/xep-hang"
>
← Hệ thống xếp hàng
</a>

<h1>
Điều hành quầy
</h1>

<p class="lead">
Chọn quầy làm việc để mở màn hình gọi số.
</p>

</div>

</header>


<main class="wrap">

<div class="title">
DANH SÁCH QUẦY
</div>

<div class="grid">

${cards}

</div>

<div class="note">

Mỗi máy tại quầy có thể lưu đường dẫn riêng để mở thẳng màn hình điều hành.

</div>

</main>

</body>

</html>`;
}


// =====================================================
// DANH SÁCH QUẦY MÀN HÌNH HIỂN THỊ
// =====================================================

function displayMenu(counters) {

  const cards =
    counters

      .map(counter => {

        return `

        <a
          class="counter"
          href="/xep-hang/hien-thi?counter=${encodeURIComponent(counter.id)}"
        >

          <span class="counter-icon">
            📺
          </span>

          <span class="counter-name">
            ${esc(counter.name)}
          </span>

          <span class="counter-sub">
            Mở màn hình số đang gọi
          </span>

          <span class="open">
            Hiển thị →
          </span>

        </a>

        `;

      })

      .join('');


  return `<!doctype html>

<html lang="vi">

<head>

<meta charset="utf-8">

<meta
  name="viewport"
  content="width=device-width,initial-scale=1"
>

<title>
Màn hình hiển thị | PVHCC Cô Tô
</title>

<style>

* {
  box-sizing: border-box;
}

body {

  margin: 0;

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  background: #f4f7fb;

  color: #17324d;
}

.top {

  background:
    linear-gradient(
      135deg,
      #075b9d,
      #0b76bd
    );

  color: #fff;

  padding: 22px 20px;
}

.topin,
.wrap {

  max-width: 1080px;

  margin: auto;
}

.back {

  color: #dff2ff;

  text-decoration: none;

  font-size: 14px;
}

h1 {

  font-size: 26px;

  margin:
    12px
    0
    5px;
}

.lead {

  margin: 0;

  color: #e8f5ff;
}

.wrap {

  padding:
    28px
    20px;
}

.title {

  font-size: 17px;

  font-weight: 800;

  margin-bottom: 16px;
}

.grid {

  display: grid;

  grid-template-columns:
    repeat(
      auto-fit,
      minmax(220px,1fr)
    );

  gap: 16px;
}

.counter {

  min-height: 185px;

  background: #fff;

  border:
    1px solid
    #d9e5ef;

  border-radius: 16px;

  padding: 22px;

  text-decoration: none;

  color: #17324d;

  box-shadow:
    0 4px 14px
    rgba(0,0,0,.05);

  transition: .18s;
}

.counter:hover {

  transform:
    translateY(-3px);

  border-color:
    #69a9d7;

  box-shadow:
    0 9px 24px
    rgba(11,95,165,.12);
}

.counter-icon {

  display: flex;

  width: 54px;

  height: 54px;

  border-radius: 14px;

  background: #eaf5fd;

  align-items: center;

  justify-content: center;

  font-size: 28px;

  margin-bottom: 16px;
}

.counter-name {

  display: block;

  font-size: 20px;

  font-weight: 800;

  color: #0b5fa5;
}

.counter-sub {

  display: block;

  color: #6c7e8f;

  margin-top: 7px;

  font-size: 14px;
}

.open {

  display: block;

  margin-top: 20px;

  color: #0b6fae;

  font-weight: 700;

  font-size: 14px;
}

.note {

  margin-top: 18px;

  padding:
    14px
    16px;

  border-radius: 12px;

  background: #eef8ff;

  border:
    1px solid
    #c9e6f7;

  color: #315c76;

  font-size: 14px;
}

@media(max-width:600px) {

  h1 {
    font-size: 22px;
  }

  .wrap {
    padding:
      20px
      14px;
  }

  .grid {

    grid-template-columns:
      1fr
      1fr;

    gap: 10px;
  }

  .counter {

    min-height: 160px;

    padding: 16px;
  }

  .counter-name {
    font-size: 17px;
  }

}

</style>

</head>

<body>


<header class="top">

<div class="topin">

<a
  class="back"
  href="/xep-hang"
>
← Hệ thống xếp hàng
</a>

<h1>
Màn hình hiển thị
</h1>

<p class="lead">
Chọn quầy để mở màn hình theo dõi số đang được phục vụ.
</p>

</div>

</header>


<main class="wrap">

<div class="title">
DANH SÁCH QUẦY
</div>

<div class="grid">

${cards}

</div>


<div class="note">

Có thể lưu đường dẫn riêng trên TV hoặc màn hình tại từng quầy.

</div>

</main>

</body>

</html>`;
}


// =====================================================
// CLOUDFLARE PAGES FUNCTION
// =====================================================

export async function onRequest(context) {

  const {
    request,
    env,
    params
  } = context;


  const arr =
    Array.isArray(params.route)
      ? params.route
      : [params.route]
          .filter(Boolean);


  const path =
    arr
      .join('/')
      .replace(
        /^\/+|\/+$/g,
        ''
      );


  // ===================================================
  // Chỉ xử lý các app đã đăng ký
  // ===================================================

  if (
    !path.startsWith('xep-hang') &&
    !path.startsWith('so-tay')
  ) {

    return context.next();

  }


  // ===================================================
  // TRANG CHÍNH XẾP HÀNG
  // ===================================================

  if (
    path === 'xep-hang'
  ) {

    return new Response(
      menu(),
      {
        headers: {
          'content-type':
            'text/html; charset=utf-8',

          'cache-control':
            'public, max-age=300'
        }
      }
    );

  }


  // ===================================================
  // CHỌN QUẦY ĐIỀU HÀNH
  // ===================================================

  if (
    path ===
    'xep-hang/quay'
  ) {

    const incomingUrl =
      new URL(
        request.url
      );


    if (
      !incomingUrl
        .searchParams
        .get('counter')
    ) {

      const counters =
        await loadCounters(env);


      return new Response(
        counterMenu(counters),
        {
          headers: {

            'content-type':
              'text/html; charset=utf-8',

            'cache-control':
              'public, max-age=300'

          }
        }
      );

    }

  }


  // ===================================================
  // CHỌN QUẦY HIỂN THỊ
  // ===================================================

  if (
    path ===
    'xep-hang/hien-thi'
  ) {

    const incomingUrl =
      new URL(
        request.url
      );


    if (
      !incomingUrl
        .searchParams
        .get('counter')
    ) {

      const counters =
        await loadCounters(env);


      return new Response(
        displayMenu(counters),
        {
          headers: {

            'content-type':
              'text/html; charset=utf-8',

            'cache-control':
              'public, max-age=300'

          }
        }
      );

    }

  }


  // ===================================================
  // TÌM ROUTE
  // ===================================================

  const route =
    ROUTES[path];


  if (!route) {

    return new Response(
      'Không tìm thấy trang chức năng.',
      {
        status: 404
      }
    );

  }


  // ===================================================
  // KIỂM TRA CLOUDFARE ACCESS
  // ===================================================

  const requireAccess =
    String(
      env.REQUIRE_ACCESS ||
      'false'
    )
    .toLowerCase()
    ===
    'true';


  if (
    route.access ===
    'protected' &&

    requireAccess &&

    !accessEmail(request)
  ) {

    return new Response(
      'Trang này yêu cầu đăng nhập cán bộ qua Cloudflare Access.',
      {
        status: 401
      }
    );

  }


  // ===================================================
  // XÁC ĐỊNH ỨNG DỤNG
  // ===================================================

  const isHandbook =
    route.app ===
    'handbook';


  const baseUrl =
    String(
      isHandbook
        ? (env.HANDBOOK_APP_URL || '')
        : (env.QUEUE_APP_URL || '')
    )
    .trim();


  if (!baseUrl) {

    return new Response(

      isHandbook

        ? 'Chưa cấu hình HANDBOOK_APP_URL trên Cloudflare.'

        : 'Chưa cấu hình QUEUE_APP_URL trên Cloudflare.',

      {
        status: 500
      }

    );

  }


  // ===================================================
  // TẠO URL APPS SCRIPT
  // ===================================================

  const incoming =
    new URL(
      request.url
    );


  const target =
    new URL(
      baseUrl
    );


  // ===================================================
  // SỔ TAY
  // ===================================================

  if (isHandbook) {

    // /so-tay
    // → mở trực tiếp /exec

    // /so-tay/quan-tri
    // → /exec?view=admin

    if (route.view) {

      target.searchParams.set(
        'view',
        route.view
      );

    }

  }

  // ===================================================
  // XẾP HÀNG
  // ===================================================

  else {

    if (route.page) {

      target.searchParams.set(
        'page',
        route.page
      );

    }

  }


  // ===================================================
  // CHUYỂN TIẾP QUERY STRING
  // ===================================================

  for (
    const [key, value]
    of incoming.searchParams.entries()
  ) {

    if (
      key !== 'page' &&
      key !== 'view'
    ) {

      target.searchParams.set(
        key,
        value
      );

    }

  }


  // ===================================================
  // TRẢ GIAO DIỆN IFRAME
  // ===================================================

  return new Response(

    htmlShell(
      target.toString(),
      route.title
    ),

    {
      status: 200,

      headers: {

        'content-type':
          'text/html; charset=utf-8',

        'cache-control':
          'no-store',

        'x-frame-options':
          'SAMEORIGIN'

      }
    }

  );

}
