// ── Auth Store ──────────────────────────────────────────────

const AUTH_KEY = 'retailpulse-auth'

export const auth = {
  get() {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null') } catch { return null }
  },
  save(data) { localStorage.setItem(AUTH_KEY, JSON.stringify(data)) },
  clear() { localStorage.removeItem(AUTH_KEY) },
  isLoggedIn() { return !!this.get()?.token },

  login(email, password) {
    // Demo credential check
    const creds = {
      'admin@retailpulse.ai':  { pw:'Admin123!', role:'admin',  name:'Alex Morgan' },
      'manager@retailpulse.ai':{ pw:'Manager1!', role:'manager',name:'Priya Sharma' },
      'demo@retailpulse.ai':   { pw:'Demo123!',  role:'user',   name:'Rahul Verma'  },
    }
    const match = creds[email]
    if (!match || match.pw !== password) return null
    const user = { id: email.split('@')[0], name: match.name, email, role: match.role }
    this.save({ user, token: 'demo-' + match.role })
    auditLog.add('login', `${match.name} logged in`, user.role)
    return user
  },

  logout() {
    const u = this.user()
    if (u) auditLog.add('logout', `${u.name} logged out`, u.role)
    this.clear()
  },

  user() { return this.get()?.user || null },

  isAdmin()   { return this.user()?.role === 'admin' },
  isManager() { return ['admin','manager'].includes(this.user()?.role) },

  // Permissions
  can(action) {
    const role = this.user()?.role
    const perms = {
      admin:   ['view','add','edit','delete','manage_users','audit','system'],
      manager: ['view','add','edit'],
      user:    ['view','edit'],
    }
    return perms[role]?.includes(action) ?? false
  }
}

// ── Audit Log ───────────────────────────────────────────────

const AUDIT_KEY = 'retailpulse-audit'

export const auditLog = {
  get() {
    try { return JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]') } catch { return [] }
  },
  add(type, message, role='user') {
    const logs = this.get()
    logs.unshift({ id: Date.now()+'', type, message, role, ts: new Date().toISOString() })
    if (logs.length > 200) logs.pop()
    localStorage.setItem(AUDIT_KEY, JSON.stringify(logs))
  }
}

// ── User Manager (admin only, stored locally) ───────────────

const USERS_KEY = 'retailpulse-users'
const DEFAULT_USERS = [
  { id:'admin',   name:'Alex Morgan',  email:'admin@retailpulse.ai',   role:'admin',   active:true,  createdAt:'2025-01-01' },
  { id:'manager', name:'Priya Sharma', email:'manager@retailpulse.ai', role:'manager', active:true,  createdAt:'2025-02-15' },
  { id:'demo',    name:'Rahul Verma',  email:'demo@retailpulse.ai',    role:'user',    active:true,  createdAt:'2025-03-10' },
]

export const userManager = {
  getAll() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || 'null') || DEFAULT_USERS } catch { return DEFAULT_USERS }
  },
  save(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)) },
  add(user) {
    const users = this.getAll()
    const newUser = { ...user, id: Date.now()+'', createdAt: new Date().toISOString().split('T')[0] }
    users.push(newUser)
    this.save(users)
    auditLog.add('user_added', `Admin added user: ${user.name} (${user.role})`, 'admin')
    return newUser
  },
  update(id, updates) {
    const users = this.getAll().map(u => u.id===id ? {...u,...updates} : u)
    this.save(users)
    auditLog.add('user_updated', `Admin updated user: ${updates.name||id}`, 'admin')
  },
  delete(id) {
    const users = this.getAll()
    const u = users.find(x=>x.id===id)
    this.save(users.filter(x=>x.id!==id))
    auditLog.add('user_deleted', `Admin deleted user: ${u?.name||id}`, 'admin')
  },
  toggleActive(id) {
    const users = this.getAll()
    const u = users.find(x=>x.id===id)
    if(u) { u.active=!u.active; this.save(users) }
    auditLog.add('user_toggled', `Admin ${u?.active?'enabled':'disabled'} user: ${u?.name}`, 'admin')
  }
}

// ── Theme Store ─────────────────────────────────────────────

const THEME_KEY = 'retailpulse-theme'

export const theme = {
  get() {
    try { return localStorage.getItem(THEME_KEY) || 'dark' } catch { return 'dark' }
  },
  apply(t) {
    document.documentElement.classList.toggle('dark', t === 'dark')
    localStorage.setItem(THEME_KEY, t)
  },
  toggle() {
    const next = this.get() === 'dark' ? 'light' : 'dark'
    this.apply(next)
    return next
  },
  init() { this.apply(this.get()) }
}
