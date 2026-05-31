// ── Auth Store ──────────────────────────────────────────────

const AUTH_KEY = 'retailpulse-auth'

export const auth = {
  get() {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null') } catch { return null }
  },
  save(data) { localStorage.setItem(AUTH_KEY, JSON.stringify(data)) },
  clear() { localStorage.removeItem(AUTH_KEY) },
  isLoggedIn() { return !!this.get()?.token },
  login(email) {
    const user = { id:'demo', name:'Alex Morgan', email, role: email.includes('admin')?'admin':'user' }
    this.save({ user, token:'demo-token' })
    return user
  },
  logout() { this.clear() },
  user() { return this.get()?.user || null }
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
