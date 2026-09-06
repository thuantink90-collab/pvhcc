/**
 * AUTH PHÂN QUYỀN CỔNG ĐIỀU PHỐI
 * Tài khoản được lưu trong sheet Portal_Users.
 */
const PORTAL_AUTH = {
  SHEET: 'Portal_Users',
  SESSION_PREFIX: 'PORTAL_AUTH_',
  SESSION_SECONDS: 21600,
  ITERATIONS: 2000
};

function portalAuthSheet_() {
  const ss = ss_();
  let sh = ss.getSheetByName(PORTAL_AUTH.SHEET);
  if (!sh) {
    sh = ss.insertSheet(PORTAL_AUTH.SHEET);
    sh.getRange(1,1,1,9).setValues([[
      'Email','Name','Role','Status','Permissions',
      'PasswordHash','Salt','CreatedAt','UpdatedAt'
    ]]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function portalSha256_(text) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(text),
    Utilities.Charset.UTF_8
  );
  return bytes.map(b => {
    const v = b < 0 ? b + 256 : b;
    return ('0' + v.toString(16)).slice(-2);
  }).join('');
}

function portalHashPassword_(password, salt) {
  let h = portalSha256_(String(salt) + ':' + String(password));
  for (let i=1; i<PORTAL_AUTH.ITERATIONS; i++) h = portalSha256_(h);
  return h;
}

function portalFindUser_(email) {
  email = String(email || '').trim().toLowerCase();
  if (!email) return null;
  const sh = portalAuthSheet_();
  const v = sh.getDataRange().getValues();
  if (v.length < 2) return null;
  for (let i=1; i<v.length; i++) {
    if (String(v[i][0] || '').trim().toLowerCase() === email) {
      return {
        row: i + 1,
        email: String(v[i][0] || '').trim().toLowerCase(),
        name: String(v[i][1] || ''),
        role: String(v[i][2] || ''),
        status: String(v[i][3] || 'ACTIVE').toUpperCase(),
        permissions: String(v[i][4] || ''),
        passwordHash: String(v[i][5] || ''),
        salt: String(v[i][6] || '')
      };
    }
  }
  return null;
}

function portalPermissions_(user) {
  return String(user.permissions || '')
    .split(',')
    .map(x => x.trim().toUpperCase())
    .filter(Boolean);
}

function portalHasPermission_(user, permission) {
  if (!user) return false;
  if (String(user.role || '').toUpperCase() === 'SUPER_ADMIN') return true;
  const p = portalPermissions_(user);
  return p.includes('*') || p.includes(String(permission || '').toUpperCase());
}

function portalCreateSession_(user) {
  const token = Utilities.getUuid().replace(/-/g,'') + Utilities.getUuid().replace(/-/g,'');
  const session = {
    token,
    email: user.email,
    name: user.name,
    role: user.role,
    permissions: user.permissions,
    createdAt: new Date().toISOString()
  };
  CacheService.getScriptCache().put(
    PORTAL_AUTH.SESSION_PREFIX + token,
    JSON.stringify(session),
    PORTAL_AUTH.SESSION_SECONDS
  );
  return session;
}

function portalGetSession_(token) {
  token = String(token || '').trim();
  if (!token) return null;
  const raw = CacheService.getScriptCache().get(PORTAL_AUTH.SESSION_PREFIX + token);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (_) { return null; }
}

function portalRequire_(e, permission) {
  const token = String((e && e.parameter && e.parameter.session) || '').trim();
  const session = portalGetSession_(token);
  if (!session) throw new Error('UNAUTHORIZED');
  const user = portalFindUser_(session.email);
  if (!user || user.status !== 'ACTIVE' || !portalHasPermission_(user, permission)) {
    throw new Error('FORBIDDEN');
  }
  return session;
}

function portalAuthLogin_(email, password) {
  const user = portalFindUser_(email);
  if (!user || user.status !== 'ACTIVE') throw new Error('Tài khoản không tồn tại hoặc đã bị khóa.');
  if (!user.passwordHash || !user.salt) throw new Error('Tài khoản chưa được thiết lập mật khẩu.');
  if (portalHashPassword_(password, user.salt) !== user.passwordHash) {
    throw new Error('Sai tài khoản hoặc mật khẩu.');
  }
  return portalCreateSession_(user);
}

function portalAuthLogout_(token) {
  token = String(token || '').trim();
  if (token) CacheService.getScriptCache().remove(PORTAL_AUTH.SESSION_PREFIX + token);
  return { ok: true };
}

function portalAuthMe_(token) {
  const s = portalGetSession_(token);
  if (!s) return { authenticated: false };
  const user = portalFindUser_(s.email);
  if (!user || user.status !== 'ACTIVE') return { authenticated: false };
  return {
    authenticated: true,
    user: { email:user.email, name:user.name, role:user.role, permissions:user.permissions }
  };
}

function createPortalUser_(email, name, password, role, permissions) {
  email = String(email || '').trim().toLowerCase();
  if (!email || !password) throw new Error('Email và mật khẩu không được để trống.');
  const sh = portalAuthSheet_();
  const existing = portalFindUser_(email);
  const salt = Utilities.getUuid().replace(/-/g,'');
  const hash = portalHashPassword_(password, salt);
  const now = new Date();

  if (existing) {
    sh.getRange(existing.row,1,1,9).setValues([[
      email, name || existing.name, role || existing.role, 'ACTIVE',
      permissions || existing.permissions, hash, salt,
      sh.getRange(existing.row,8).getValue() || now, now
    ]]);
  } else {
    sh.appendRow([email,name || '',role || 'PORTAL_ADMIN','ACTIVE',
      permissions || 'PORTAL_ADMIN',hash,salt,now,now]);
  }
  return { ok:true, email, role:role || 'PORTAL_ADMIN' };
}

/**
 * CHẠY MỘT LẦN để tạo tài khoản quản trị Cổng điều phối.
 * Hãy sửa 3 dòng EMAIL/NAME/PASSWORD trước khi chạy.
 */
function setupFirstPortalAdmin() {
  const result = createPortalUser_(
    'EMAIL_CUA_ANH',
    'Quản trị Cổng điều phối',
    'MAT_KHAU_TAM_THOI',
    'SUPER_ADMIN',
    '*'
  );
  Logger.log(JSON.stringify(result));
  return 'Đã tạo tài khoản SUPER_ADMIN: ' + result.email;
}
