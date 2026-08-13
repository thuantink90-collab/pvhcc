(() => {
  const appEl = document.getElementById('app');
  const dlg = document.getElementById('protectedDialog');
  const toast = document.getElementById('toast');
  let apps = [], cfg = {}, currentAudience = null, activeCategory = 'all', customizeMode = false, initialized = false, clockTimer = null;

  const storage = {
    getPins(){ try{return JSON.parse(localStorage.getItem('pvhcc_pins')||'[]')}catch{return[]} },
    setPins(v){localStorage.setItem('pvhcc_pins',JSON.stringify(v))},
    getRole(){return localStorage.getItem('pvhcc_role')},
    setRole(v){localStorage.setItem('pvhcc_role',v)},
    clearRole(){localStorage.removeItem('pvhcc_role')},
    getDark(){return localStorage.getItem('pvhcc_dark')==='1'},
    setDark(v){localStorage.setItem('pvhcc_dark',v?'1':'0')},
    getBootstrap(){ try{return JSON.parse(localStorage.getItem('pvhcc_bootstrap_v1')||'null')}catch{return null} },
    setBootstrap(v){ try{localStorage.setItem('pvhcc_bootstrap_v1',JSON.stringify({savedAt:Date.now(),data:v}))}catch(_){} }
  };

  const esc=(s='')=>String(s).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':'&quot;'}[c]));
  const toastMsg=m=>{toast.textContent=m;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2200)};
  const bool=v=>v===true||String(v).toLowerCase()==='true'||String(v)==='1';

  async function api(path, options={}){
    const r=await fetch('/api/'+path,{
      ...options,
      headers:{Accept:'application/json',...(options.headers||{})}
    });
    const text=await r.text();
    let j;
    try{ j=JSON.parse(text); }
    catch(_){
      throw new Error(`API /${path} trả về dữ liệu không phải JSON${text ? ': '+text.slice(0,120) : ''}`);
    }
    if(!r.ok || !j || j.ok!==true) throw new Error((j&&j.error)||`Lỗi API /${path}`);
    return j;
  }

  function normalizeBootstrap(data){
    if(!data || !Array.isArray(data.apps)) throw new Error('Dữ liệu bootstrap không hợp lệ');
    return {
      apps:data.apps.filter(x=>String(x.status||'ACTIVE').toUpperCase()==='ACTIVE'),
      config:(data.config && typeof data.config==='object') ? data.config : {}
    };
  }

  function applyBootstrap(data){
    const n=normalizeBootstrap(data);
    apps=n.apps;
    cfg=n.config;
    updateFooterStats();
  }

  async function fetchBootstrap(){
    // Portal 2.4 ưu tiên 1 request duy nhất: apps + config.
    // Nếu backend chưa kịp cập nhật route bootstrap thì tự động fallback về
    // 2 endpoint cũ nhưng gọi song song, không gọi tuần tự.
    try{
      const b=await api('bootstrap');
      if(!b.data || !Array.isArray(b.data.apps)) throw new Error('API /bootstrap không hợp lệ');
      return normalizeBootstrap(b.data);
    }catch(bootstrapError){
      console.warn('Bootstrap API chưa sẵn sàng, dùng fallback song song:',bootstrapError);
      const [ar,cr]=await Promise.allSettled([api('apps'),api('config')]);
      if(ar.status!=='fulfilled' || !Array.isArray(ar.value.data)) throw bootstrapError;
      return normalizeBootstrap({
        apps:ar.value.data,
        config:cr.status==='fulfilled' && cr.value.data && typeof cr.value.data==='object' ? cr.value.data : {}
      });
    }
  }

  function refreshVisibleUi(){
    updateFooterStats();
    if(!initialized) return;
    if(currentAudience) renderDashboard();
    else roleLanding();
  }

  async function loadData(){
    const cached=storage.getBootstrap();
    let usedCache=false;

    // Hiển thị dữ liệu lần truy cập trước ngay lập tức (stale-while-revalidate).
    if(cached && cached.data){
      try{
        applyBootstrap(cached.data);
        init();
        usedCache=true;
      }catch(_){ /* cache cũ/hỏng -> bỏ qua */ }
    }

    try{
      const fresh=await fetchBootstrap();
      const oldSig=JSON.stringify({apps,cfg});
      applyBootstrap(fresh);
      storage.setBootstrap(fresh);
      const newSig=JSON.stringify({apps,cfg});
      if(!initialized) init();
      else if(oldSig!==newSig) refreshVisibleUi();
    }catch(e){
      if(usedCache){
        console.warn('Không làm gián đoạn Portal vì đang có cache cục bộ:',e);
        toastMsg('Đang dùng dữ liệu đã lưu gần nhất.');
        return;
      }
      appEl.innerHTML=`<section class="page-shell"><div class="container"><div class="empty"><strong>Không tải được danh sách ứng dụng Portal.</strong><br>${esc(e.message)}<br><br>Kiểm tra <code>/api/bootstrap</code> hoặc <code>/api/apps</code>.</div></div></section>`;
    }
  }

  function updateFooterStats(){
    const groups=new Set(apps.map(a=>`${a.audience}|${a.category}`).filter(Boolean));
    document.getElementById('footerAppCount').textContent=apps.length;
    document.getElementById('footerGroupCount').textContent=groups.size;
  }

  function updateClock(){
    const d=new Date();
    const t=d.toLocaleTimeString('vi-VN',{hour12:false});
    const day=d.toLocaleDateString('vi-VN',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'});
    document.getElementById('clockTime').textContent=t;
    document.getElementById('clockDate').textContent=day;
  }

  function setDark(v){
    document.documentElement.classList.toggle('dark-mode',v);
    storage.setDark(v);
    const b=document.getElementById('darkModeBtn');
    if(b)b.textContent=v?'☀ Light mode':'◐ Dark mode';
  }

  function normalizeUrl(url){
    const u=String(url||'').trim();
    if(u==='/admin.html') return '/admin';
    return u;
  }

  function navigate(url){
    url=normalizeUrl(url);
    if(!url||url==='#'){toastMsg('Ứng dụng chưa được cấu hình liên kết trong trang Quản trị.');return;}
    if(url.startsWith('/')){ window.location.href=url; return; }
    window.open(url,'_blank','noopener,noreferrer');
  }

  function roleLanding(){
    currentAudience=null; activeCategory='all';
    document.getElementById('changeRoleBtn').style.display='none';
    appEl.innerHTML=`
      <section class="role-hero">
        <div class="container role-hero-inner">
          <div class="hero-kicker">CỔNG DỊCH VỤ VÀ TIỆN ÍCH SỐ</div>
          <h1>${esc(cfg.heroTitle||'Một điểm truy cập cho hành chính công Cô Tô')}</h1>
          <p>${esc(cfg.heroText||'Chọn đúng vai trò để hệ thống hiển thị các dịch vụ và tiện ích phù hợp với nhu cầu của bạn.')}</p>
        </div>
      </section>
      <section class="role-section"><div class="container">
        <div class="section-title"><h2>Bạn đang sử dụng hệ thống với vai trò nào?</h2><p>Lựa chọn này có thể thay đổi bất kỳ lúc nào.</p></div>
        <div class="role-grid">
          <article class="role-card" data-role="citizen"><div class="role-icon">👨‍👩‍👧‍👦</div><h3>Công dân</h3><p>Lấy số trực tuyến, tra cứu, sổ tay thủ tục, đánh giá, phản ánh và dịch vụ công trực tuyến.</p><div class="role-cta"><span>Vào trang Công dân</span><span>→</span></div></article>
          <article class="role-card" data-role="staff"><div class="role-icon">👨‍💼</div><h3>Cán bộ</h3><p>Hệ thống giải quyết TTHC, phần mềm chuyên ngành, dashboard và các công cụ nghiệp vụ.</p><div class="role-cta"><span>Vào trang Cán bộ</span><span>→</span></div></article>
        </div>
        <label class="remember"><input id="rememberRole" type="checkbox" checked> Ghi nhớ lựa chọn trên thiết bị này</label>
      </div></section>`;
    document.querySelectorAll('[data-role]').forEach(el=>el.onclick=()=>selectRole(el.dataset.role));
  }

  function selectRole(role){
    currentAudience=role;
    if(document.getElementById('rememberRole')?.checked) storage.setRole(role);
    document.getElementById('changeRoleBtn').style.display='inline-flex';
    renderDashboard();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function iconHtml(a){
    const icon=String(a.icon||'🔗').trim();
    if(/^https?:\/\//i.test(icon)) return `<img src="${esc(icon)}" alt="" loading="lazy">`;
    return esc(icon);
  }

  function appTile(a){
    const pins=storage.getPins(), pinned=pins.includes(a.id);
    return `<article class="software-card" data-id="${esc(a.id)}" data-search="${esc((a.name+' '+(a.description||'')+' '+(a.category||'')).toLowerCase())}">
      ${a.access==='protected'?'<span class="tile-lock" title="Yêu cầu đăng nhập">🔒</span>':''}
      <button class="tile-main" data-open="${esc(a.id)}" title="${esc(a.description||a.name)}">
        <div class="software-icon">${iconHtml(a)}</div>
        <div class="software-name">${esc(a.name)}</div>
      </button>
      ${customizeMode?`<button class="tile-pin ${pinned?'is-pinned':''}" data-pin="${esc(a.id)}" title="${pinned?'Bỏ ghim':'Ghim tiện ích'}">${pinned?'★':'☆'}</button>`:''}
    </article>`;
  }

  function groupIcon(name){
    const n=String(name).toLowerCase();
    if(n.includes('dịch vụ')||n.includes('dvc'))return '🏛️';
    if(n.includes('chuyên ngành'))return '🧩';
    if(n.includes('nghiệp vụ'))return '💼';
    if(n.includes('đánh giá'))return '⭐';
    if(n.includes('tra cứu'))return '🔎';
    if(n.includes('hướng dẫn')||n.includes('sổ tay'))return '📚';
    if(n.includes('dashboard')||n.includes('báo cáo'))return '📊';
    return '▰';
  }

  function navTabs(items){
    const groups=[...new Set(items.map(a=>a.category).filter(Boolean))];
    const core=[{key:'all',label:currentAudience==='staff'?'Tác nghiệp nội bộ':'Dịch vụ công',icon:'⌂'}];
    groups.slice(0,4).forEach(g=>core.push({key:g,label:g,icon:groupIcon(g)}));
    return core.map(t=>`<button class="portal-tab ${activeCategory===t.key?'active':''}" data-cat="${esc(t.key)}"><span>${t.icon}</span>${esc(t.label)}</button>`).join('');
  }

  function renderDashboard(){
    const isStaff=currentAudience==='staff';
    const items=apps.filter(a=>a.audience===currentAudience).sort((a,b)=>(+a.order||999)-(+b.order||999));
    const groups=[...new Set(items.map(a=>a.category).filter(Boolean))];
    const pins=storage.getPins();
    const pinned=items.filter(a=>pins.includes(a.id));

    appEl.innerHTML=`<section class="portal-dashboard">
      <div class="portal-tabs"><div class="container portal-tabs-inner">${navTabs(items)}</div></div>
      <div class="container software-area">
        <div class="software-toolbar">
          <div class="software-toolbar-copy"><h1>${isStaff?'Danh mục phần mềm & hệ thống':'Danh mục dịch vụ & tiện ích'}</h1><p>${isStaff?'Không gian làm việc tập trung dành cho cán bộ.':'Các dịch vụ số dành cho người dân và tổ chức.'}</p></div>
          <div class="software-toolbar-actions">
            <div class="compact-search" id="compactSearch">
              <button class="search-toggle" id="searchToggle" type="button" aria-label="Tìm kiếm tiện ích" title="Tìm kiếm">⌕</button>
              <input id="appSearch" type="search" autocomplete="off" placeholder="${isStaff?'Tìm phần mềm...':'Tìm dịch vụ...'}" aria-label="Tìm kiếm tiện ích">
              <button class="search-clear" id="searchClear" type="button" aria-label="Xóa tìm kiếm" title="Xóa">×</button>
            </div>
            <button class="customize-btn ${customizeMode?'active':''}" id="customizeBtn">⚙ ${customizeMode?'Hoàn tất tùy chỉnh':'Tùy chỉnh hiển thị'}</button>
          </div>
        </div>
        ${pinned.length?`<section class="software-section pinned-section" data-section="pinned"><div class="software-section-title"><h2><span class="accent-stick"></span>★ TIỆN ÍCH CỦA TÔI</h2><span>${pinned.length} tiện ích</span></div><div class="software-grid">${pinned.map(appTile).join('')}</div></section>`:''}
        <div id="softwareGroups">
          ${groups.map(g=>{const ga=items.filter(a=>a.category===g);return `<section class="software-section" data-section="${esc(g)}"><div class="software-section-title"><h2><span class="accent-stick"></span>${groupIcon(g)} ${esc(g.toUpperCase())}</h2><span>${ga.length} tiện ích</span></div><div class="software-grid">${ga.map(appTile).join('')}</div></section>`}).join('')}
        </div>
        ${!items.length?'<div class="empty">Chưa có ứng dụng nào được cấu hình cho vai trò này.</div>':''}
      </div>
    </section>`;

    wire();
    const search=document.getElementById('appSearch');
    const compactSearch=document.getElementById('compactSearch');
    const runFilter=()=>filterTiles(search.value.trim().toLowerCase());
    search.oninput=runFilter;
    document.getElementById('searchToggle').onclick=()=>{
      compactSearch.classList.toggle('open');
      if(compactSearch.classList.contains('open')) setTimeout(()=>search.focus(),50);
      else if(!search.value){ filterTiles(''); }
    };
    document.getElementById('searchClear').onclick=()=>{search.value='';runFilter();search.focus()};
    search.onkeydown=e=>{if(e.key==='Escape'){search.value='';runFilter();compactSearch.classList.remove('open')}};
    document.getElementById('customizeBtn').onclick=()=>{customizeMode=!customizeMode;renderDashboard()};
    document.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{activeCategory=b.dataset.cat;applyCategory();});
    applyCategory();
  }

  function applyCategory(){
    document.querySelectorAll('[data-cat]').forEach(b=>b.classList.toggle('active',b.dataset.cat===activeCategory));
    document.querySelectorAll('.software-section:not(.pinned-section)').forEach(s=>{
      s.style.display=activeCategory==='all'||s.dataset.section===activeCategory?'block':'none';
    });
  }

  function filterTiles(q){
    document.querySelectorAll('.software-card').forEach(c=>c.style.display=!q||c.dataset.search.includes(q)?'block':'none');
    document.querySelectorAll('.software-section').forEach(sec=>{
      const any=[...sec.querySelectorAll('.software-card')].some(c=>c.style.display!=='none');
      if(q) sec.style.display=any?'block':'none';
      else if(!sec.classList.contains('pinned-section')) sec.style.display=activeCategory==='all'||sec.dataset.section===activeCategory?'block':'none';
    });
  }

  function wire(){
    document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openApp(b.dataset.open));
    document.querySelectorAll('[data-pin]').forEach(b=>b.onclick=e=>{e.stopPropagation();togglePin(b.dataset.pin)});
  }

  function openApp(id){
    const a=apps.find(x=>x.id===id); if(!a)return;
    if(a.access==='protected'){dlg.dataset.url=normalizeUrl(a.url||'');dlg.showModal()} else navigate(a.url);
  }

  function togglePin(id){
    let p=storage.getPins();
    p=p.includes(id)?p.filter(x=>x!==id):[...p,id];
    storage.setPins(p); renderDashboard();
    toastMsg(p.includes(id)?'Đã ghim tiện ích.':'Đã bỏ ghim tiện ích.');
  }

  function init(){
    if(initialized) return;
    initialized=true;
    setDark(storage.getDark());
    updateClock();
    if(!clockTimer) clockTimer=setInterval(updateClock,1000);
    document.getElementById('changeRoleBtn').onclick=()=>{storage.clearRole();customizeMode=false;roleLanding()};
    document.getElementById('footerChangeRole').onclick=()=>{storage.clearRole();customizeMode=false;roleLanding();window.scrollTo({top:0,behavior:'smooth'})};
    document.querySelector('[data-action="home"]').onclick=()=>currentAudience?renderDashboard():roleLanding();
    document.getElementById('darkModeBtn').onclick=()=>setDark(!document.documentElement.classList.contains('dark-mode'));
    document.getElementById('loginBtn').onclick=e=>{e.preventDefault();dlg.close();const target=dlg.dataset.url||cfg.staffLoginUrl||'/';window.location.href=target};
    const r=storage.getRole();
    if(['citizen','staff'].includes(r)){currentAudience=r;document.getElementById('changeRoleBtn').style.display='inline-flex';renderDashboard()}else roleLanding();
  }

  loadData();
})();
