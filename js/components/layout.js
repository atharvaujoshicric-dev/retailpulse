import { auth, theme } from '../lib/store.js'

// navigate is patched by app.js after boot; use a late-binding call
function go(page) { window.__navigate(page) }

const NAV = [
  { id:'dashboard', label:'Dashboard',       icon:'layout-dashboard' },
  { id:'forecast',  label:'Forecasts',       icon:'trending-up' },
  { id:'inventory', label:'Inventory',       icon:'package' },
  { id:'impact',    label:'Impact Analyzer', icon:'zap' },
  { id:'products',  label:'Products',        icon:'shopping-cart' },
  { id:'alerts',    label:'Alerts',          icon:'bell' },
]

let collapsed = false
let mobileOpen = false

export function renderLayout(pageId, contentHTML, alertCount = 0) {
  const user = auth.user()
  const isDark = theme.get() === 'dark'
  const label = NAV.find(n=>n.id===pageId)?.label || (pageId==='settings'?'Settings':'')

  document.getElementById('app').innerHTML = `
    <div class="layout">
      <div class="mobile-overlay${mobileOpen?' active':''}" id="overlay"></div>

      <aside class="sidebar${collapsed?' collapsed':''}${mobileOpen?' mobile-open':''}" id="sidebar">
        <div class="sidebar-logo">
          <div class="logo-icon">
            <i data-lucide="trending-up" style="width:16px;height:16px"></i>
          </div>
          <span class="logo-text">RetailPulse</span>
          <button class="btn-icon" id="close-mobile" style="margin-left:auto;display:none" class="hamburger">
            <i data-lucide="x" style="width:16px;height:16px"></i>
          </button>
        </div>

        <nav>
          ${NAV.map(n => `
            <button class="nav-item${n.id===pageId?' active':''}" data-page="${n.id}">
              <i data-lucide="${n.icon}" style="width:18px;height:18px;flex-shrink:0"></i>
              <span class="nav-label">${n.label}</span>
            </button>
          `).join('')}
        </nav>

        <div class="sidebar-bottom">
          <button class="nav-item${pageId==='settings'?' active':''}" data-page="settings">
            <i data-lucide="settings" style="width:18px;height:18px;flex-shrink:0"></i>
            <span class="nav-label">Settings</span>
          </button>
          ${user ? `
          <div class="user-row">
            <div class="avatar">${user.name?.[0]||'U'}</div>
            <div class="user-info flex-1 min-w-0">
              <div class="name truncate">${user.name}</div>
              <div class="role">${user.role}</div>
            </div>
            <button class="btn-icon" id="logout-btn" title="Logout">
              <i data-lucide="log-out" style="width:15px;height:15px"></i>
            </button>
          </div>` : ''}
        </div>

        <button class="collapse-btn" id="collapse-btn">
          <i data-lucide="${collapsed?'chevron-right':'chevron-left'}" style="width:13px;height:13px"></i>
        </button>
      </aside>

      <div class="main-wrap" id="main-wrap" style="margin-left:${collapsed?64:240}px">
        <header class="topbar">
          <button class="icon-btn" id="menu-btn" style="display:none">
            <i data-lucide="menu" style="width:20px;height:20px"></i>
          </button>
          <h1>${label}</h1>
          <div class="topbar-actions">
            <button class="icon-btn" id="alerts-btn" title="Alerts">
              <i data-lucide="bell" style="width:18px;height:18px"></i>
              ${alertCount>0?`<span class="badge-dot">${alertCount>9?'9+':alertCount}</span>`:''}
            </button>
            <button class="icon-btn" id="theme-btn" title="Toggle theme">
              <i data-lucide="${isDark?'sun':'moon'}" style="width:18px;height:18px"></i>
            </button>
          </div>
        </header>
        <main class="page-content fade-in">
          ${contentHTML}
        </main>
      </div>
    </div>
  `

  lucide.createIcons()

  // Mobile responsive
  const isMobile = () => window.innerWidth < 768
  const menuBtn = document.getElementById('menu-btn')
  const closeMobileBtn = document.getElementById('close-mobile')
  if (isMobile()) {
    if(menuBtn) menuBtn.style.display='flex'
    if(closeMobileBtn) closeMobileBtn.style.display='flex'
  }

  const closeM = () => {
    mobileOpen = false
    document.getElementById('sidebar')?.classList.remove('mobile-open')
    document.getElementById('overlay')?.classList.remove('active')
  }

  menuBtn?.addEventListener('click', () => {
    mobileOpen = true
    document.getElementById('sidebar').classList.add('mobile-open')
    document.getElementById('overlay').classList.add('active')
  })
  closeMobileBtn?.addEventListener('click', closeM)
  document.getElementById('overlay')?.addEventListener('click', closeM)

  document.getElementById('collapse-btn')?.addEventListener('click', () => {
    collapsed = !collapsed
    const sb = document.getElementById('sidebar')
    const mw = document.getElementById('main-wrap')
    sb.classList.toggle('collapsed', collapsed)
    mw.style.marginLeft = (collapsed?64:240)+'px'
    document.getElementById('collapse-btn').innerHTML =
      `<i data-lucide="${collapsed?'chevron-right':'chevron-left'}" style="width:13px;height:13px"></i>`
    lucide.createIcons()
  })

  document.getElementById('theme-btn')?.addEventListener('click', () => {
    const t = theme.toggle()
    const icon = document.getElementById('theme-btn').querySelector('i')
    icon.setAttribute('data-lucide', t==='dark'?'sun':'moon')
    lucide.createIcons()
  })

  document.getElementById('alerts-btn')?.addEventListener('click', () => go('alerts'))
  document.getElementById('logout-btn')?.addEventListener('click', () => { auth.logout(); go('login') })

  document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
    btn.addEventListener('click', () => { closeM(); go(btn.dataset.page) })
  })

  window.addEventListener('resize', () => {
    const mobile = isMobile()
    if(menuBtn) menuBtn.style.display=mobile?'flex':'none'
    if(closeMobileBtn) closeMobileBtn.style.display=mobile?'flex':'none'
    if(!mobile) closeM()
  }, { once: true })
}
