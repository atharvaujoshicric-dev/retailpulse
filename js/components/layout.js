import { auth, theme } from '../lib/store.js'

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
  const isAdmin = auth.isAdmin()
  const label = [...NAV, {id:'settings',label:'Settings'},{id:'admin',label:'GODMODE'}].find(n=>n.id===pageId)?.label || ''

  document.getElementById('app').innerHTML = `
    <div class="layout">
      <div class="mobile-overlay${mobileOpen?' active':''}" id="overlay"></div>

      <aside class="sidebar${collapsed?' collapsed':''}${mobileOpen?' mobile-open':''}" id="sidebar">
        <div class="sidebar-logo">
          <div class="logo-icon">
            <i data-lucide="trending-up" style="width:16px;height:16px"></i>
          </div>
          <span class="logo-text">RetailPulse</span>
          <button class="btn-icon" id="close-mobile" style="margin-left:auto">
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
          ${isAdmin ? `
          <button class="nav-item${pageId==='admin'?' active':''}" data-page="admin"
            style="${pageId==='admin'?'':''}background:${pageId==='admin'?'rgba(139,92,246,.15)':'none'};${pageId!=='admin'?'':''}">
            <i data-lucide="shield-check" style="width:18px;height:18px;flex-shrink:0;color:${pageId==='admin'?'#a78bfa':'#8b5cf6'}"></i>
            <span class="nav-label" style="color:${pageId==='admin'?'#a78bfa':'#8b5cf6'};font-weight:600">GODMODE</span>
          </button>
          ` : ''}
          <button class="nav-item${pageId==='settings'?' active':''}" data-page="settings">
            <i data-lucide="settings" style="width:18px;height:18px;flex-shrink:0"></i>
            <span class="nav-label">Settings</span>
          </button>
          ${user ? `
          <div class="user-row">
            <div class="avatar" style="${isAdmin?'background:linear-gradient(135deg,#8b5cf6,#14b8a6)':''}">${user.name?.[0]||'U'}</div>
            <div class="user-info flex-1" style="min-width:0">
              <div class="name truncate" style="display:flex;align-items:center;gap:5px">
                ${user.name}
                ${isAdmin?`<i data-lucide="shield-check" style="width:11px;height:11px;color:#a78bfa;flex-shrink:0"></i>`:''}
              </div>
              <div class="role" style="${isAdmin?'color:#a78bfa':''}">${isAdmin?'Super Admin':user.role}</div>
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
          <button class="icon-btn" id="menu-btn">
            <i data-lucide="menu" style="width:20px;height:20px"></i>
          </button>
          <h1 style="${pageId==='admin'?'background:linear-gradient(90deg,#a78bfa,#14b8a6);-webkit-background-clip:text;-webkit-text-fill-color:transparent':''}">
            ${pageId==='admin'?'⚡ GODMODE — Super Admin':label}
          </h1>
          <div class="topbar-actions">
            <!-- Role pill -->
            ${user?`
            <span style="padding:4px 10px;border-radius:99px;font-size:11px;font-weight:600;background:${isAdmin?'rgba(139,92,246,.15)':auth.isManager()?'rgba(59,130,246,.15)':'rgba(148,163,184,.1)'};color:${isAdmin?'#a78bfa':auth.isManager()?'#60a5fa':'#94a3b8'};border:1px solid ${isAdmin?'rgba(139,92,246,.3)':auth.isManager()?'rgba(59,130,246,.3)':'rgba(148,163,184,.2)'}">
              ${isAdmin?'⚡ GODMODE':auth.isManager()?'👔 Manager':'👤 User'}
            </span>`:''}
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

  const isMobile = () => window.innerWidth < 768
  const menuBtn = document.getElementById('menu-btn')
  if (menuBtn) menuBtn.style.display = isMobile() ? 'flex' : 'none'

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
  document.getElementById('close-mobile')?.addEventListener('click', closeM)
  document.getElementById('overlay')?.addEventListener('click', closeM)

  document.getElementById('collapse-btn')?.addEventListener('click', () => {
    collapsed = !collapsed
    document.getElementById('sidebar').classList.toggle('collapsed', collapsed)
    document.getElementById('main-wrap').style.marginLeft = (collapsed?64:240)+'px'
    document.getElementById('collapse-btn').innerHTML =
      `<i data-lucide="${collapsed?'chevron-right':'chevron-left'}" style="width:13px;height:13px"></i>`
    lucide.createIcons()
  })

  document.getElementById('theme-btn')?.addEventListener('click', () => {
    const t = theme.toggle()
    document.getElementById('theme-btn').querySelector('i').setAttribute('data-lucide', t==='dark'?'sun':'moon')
    lucide.createIcons()
  })

  document.getElementById('alerts-btn')?.addEventListener('click', () => go('alerts'))
  document.getElementById('logout-btn')?.addEventListener('click', () => { auth.logout(); go('login') })

  document.querySelectorAll('.nav-item[data-page]').forEach(btn => {
    btn.addEventListener('click', () => { closeM(); go(btn.dataset.page) })
  })

  window.addEventListener('resize', () => {
    if(menuBtn) menuBtn.style.display=isMobile()?'flex':'none'
    if(!isMobile()) closeM()
  }, {once:true})
}
