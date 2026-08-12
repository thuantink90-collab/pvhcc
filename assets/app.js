(() => {
  const appEl = document.getElementById('app');
  const dlg = document.getElementById('protectedDialog');
  const toast = document.getElementById('toast');
  let apps = [], cfg = {}, currentAudience = null, filter = '';

  const storage = {
    getPins(){ try{return JSON.parse(localStorage.getItem('pvhcc_pins')||'[]')}catch{return[]} },
    setPins(v){localStorage.setItem('pvhcc_pins',JSON.stringify(v))},
    getRole(){return localStorage.getItem('pvhcc_role')}, setRole(v){localStorage.setItem('pvhcc_role',v)}, clearRole(){localStorage.removeItem('pvhcc_role')}
  };
  const esc=(s='')=>String(s).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':'&quot;'}[c]));
  const toastMsg=m=>{toast.textContent=m;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2400)};

  async function api(path){
    const r=await fetch('/api/'+path,{headers:{'Accept':'application/json'}});
    const j=await r.json().catch(()=>({ok:false,error:'Phản hồi API không hợp lệ'}));
    if(!r.ok || j.ok===false) throw new Error(j.error||'Lỗi API');
    return j;
  }
  async function loadData(){
    try{
      const [a,c]=await Promise.all([api('apps'),api('config')]);
      apps=(a.data||[]).filter(x=>String(x.status||'ACTIVE').toUpperCase()==='ACTIVE'); cfg=c.data||{};
      init();
    }catch(e){
      appEl.innerHTML=`<section class="page-shell"><div class="container"><div class="empty"><strong>Không tải được dữ liệu Portal.</strong><br>${esc(e.message)}<br><br>Kiểm tra biến môi trường <code>GAS_API_URL</code> và <code>GAS_API_SECRET</code> trên Cloudflare.</div></div></section>`;
    }
  }
  function navigate(url){if(!url||url==='#'){toastMsg('Ứng dụng chưa được cấu hình liên kết trong trang Quản trị.');return;}window.open(url,'_blank','noopener,noreferrer')}
  function roleLanding(){
    currentAudience=null; document.getElementById('changeRoleBtn').style.visibility='hidden';
    appEl.innerHTML=`<section class="hero"><div class="container hero-inner"><div class="hero-kicker">HÀNH CHÍNH CÔNG · THÂN THIỆN · MINH BẠCH · HIỆN ĐẠI</div><h1>${esc(cfg.heroTitle||'Một điểm truy cập cho các dịch vụ và tiện ích hành chính công')}</h1><p>${esc(cfg.heroText||'Truy cập nhanh dịch vụ dành cho người dân hoặc không gian làm việc số dành cho cán bộ Trung tâm.')}</p><div class="hero-badges"><span class="hero-badge">Dễ sử dụng trên điện thoại</span><span class="hero-badge">Dữ liệu quản trị tập trung</span><span class="hero-badge">Sẵn sàng tích hợp SSO</span></div></div></section><section class="role-section"><div class="container"><div class="section-title"><h2>Bạn đang sử dụng hệ thống với vai trò nào?</h2><p>Chọn vai trò để hiển thị đúng dịch vụ và tiện ích cần thiết.</p></div><div class="role-grid"><article class="role-card" data-role="citizen"><div class="role-icon">👨‍👩‍👧‍👦</div><h3>Công dân</h3><p>Lấy số trực tuyến, nộp hồ sơ, tra cứu, xem hướng dẫn và đánh giá chất lượng phục vụ.</p><div class="role-cta"><span>Tiếp tục</span><span>→</span></div></article><article class="role-card" data-role="staff"><div class="role-icon">👨‍💼</div><h3>Cán bộ</h3><p>Truy cập hệ thống nghiệp vụ, phần mềm chuyên ngành, DVCQG, dashboard và công cụ quản trị.</p><div class="role-cta"><span>Tiếp tục</span><span>→</span></div></article></div><label class="remember"><input id="rememberRole" type="checkbox" checked> Ghi nhớ lựa chọn trên thiết bị này</label></div></section>`;
    document.querySelectorAll('[data-role]').forEach(el=>el.onclick=()=>selectRole(el.dataset.role));
  }
  function selectRole(role){currentAudience=role;if(document.getElementById('rememberRole')?.checked)storage.setRole(role);document.getElementById('changeRoleBtn').style.visibility='visible';renderDashboard();window.scrollTo({top:0,behavior:'smooth'})}
  function appCard(a,pinMode=false){const pins=storage.getPins(), pinned=pins.includes(a.id);return `<article class="app-card" data-search="${esc((a.name+' '+a.description+' '+a.category).toLowerCase())}"><span class="access-chip ${a.access==='protected'?'protected':''}">${a.access==='protected'?'Đăng nhập':'Công khai'}</span><div class="app-icon">${esc(a.icon||'🔗')}</div><h3>${esc(a.name)}</h3><p>${esc(a.description)}</p><div class="app-actions"><button class="open-app" data-open="${esc(a.id)}">Mở tiện ích →</button>${pinMode?`<button class="pin-btn ${pinned?'is-pinned':''}" data-pin="${esc(a.id)}">${pinned?'★':'☆'}</button>`:''}</div></article>`}
  function renderDashboard(){
    const isStaff=currentAudience==='staff'; let items=apps.filter(a=>a.audience===currentAudience).sort((a,b)=>(+a.order||999)-(+b.order||999)); const pins=storage.getPins();
    const featured=isStaff?items.filter(a=>pins.includes(a.id)).slice(0,6):items.filter(a=>String(a.featured).toLowerCase()==='true'||a.featured===true).slice(0,6); const groups=[...new Set(items.map(a=>a.category).filter(Boolean))];
    appEl.innerHTML=`<section class="page-shell"><div class="container"><div class="page-head"><div><h1>${isStaff?'Không gian làm việc cán bộ':'Dịch vụ dành cho công dân'}</h1><p>${isStaff?'Tập trung hệ thống nghiệp vụ, tiện ích và dashboard tại một điểm truy cập.':'Thực hiện dịch vụ công, tra cứu, hướng dẫn và đánh giá thuận tiện trên mọi thiết bị.'}</p></div><div class="page-tools"><input class="search" id="appSearch" placeholder="Tìm ứng dụng, tiện ích..."></div></div>${isStaff?`<div class="staff-banner"><div><strong>Ứng dụng của tôi</strong><p>Bấm ☆ để ghim ứng dụng thường dùng.</p></div><div class="lock-note">🔐 Dashboard nội bộ yêu cầu đăng nhập</div></div>`:''}<div id="featuredArea">${featured.length?`<div class="category-head"><h2>${isStaff?'⭐ Ứng dụng của tôi':'Dịch vụ nổi bật'}</h2><span class="category-count">${featured.length} tiện ích</span></div><div class="quick-grid">${featured.map(a=>appCard(a,isStaff)).join('')}</div>`:(isStaff?'<div class="empty">Bạn chưa ghim ứng dụng nào.</div>':'')}</div><div id="groupsArea">${groups.map(g=>{const ga=items.filter(a=>a.category===g);return `<section class="category"><div class="category-head"><h2>${esc(g)}</h2><span class="category-count">${ga.length} tiện ích</span></div><div class="apps-grid">${ga.map(a=>appCard(a,isStaff)).join('')}</div></section>`}).join('')}</div></div></section>`;
    wire(); document.getElementById('appSearch').oninput=e=>{filter=e.target.value.trim().toLowerCase();document.querySelectorAll('.app-card').forEach(c=>c.style.display=!filter||c.dataset.search.includes(filter)?'flex':'none')};
  }
  function wire(){document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openApp(b.dataset.open));document.querySelectorAll('[data-pin]').forEach(b=>b.onclick=()=>togglePin(b.dataset.pin))}
  function openApp(id){const a=apps.find(x=>x.id===id);if(!a)return;if(a.access==='protected'){dlg.dataset.url=a.url||'';dlg.showModal()}else navigate(a.url)}
  function togglePin(id){let p=storage.getPins();p=p.includes(id)?p.filter(x=>x!==id):[...p,id];storage.setPins(p);renderDashboard();toastMsg(p.includes(id)?'Đã ghim ứng dụng.':'Đã bỏ ghim ứng dụng.')}
  function init(){document.getElementById('changeRoleBtn').onclick=()=>{storage.clearRole();roleLanding()};document.getElementById('homeBtn').onclick=()=>currentAudience?renderDashboard():roleLanding();document.querySelector('[data-action="home"]').onclick=()=>currentAudience?renderDashboard():roleLanding();document.getElementById('loginBtn').onclick=e=>{e.preventDefault();dlg.close();const target=dlg.dataset.url||cfg.staffLoginUrl||'/staff/';window.location.href=target};const r=storage.getRole();if(['citizen','staff'].includes(r)){currentAudience=r;document.getElementById('changeRoleBtn').style.visibility='visible';renderDashboard()}else roleLanding()}
  loadData();
})();
