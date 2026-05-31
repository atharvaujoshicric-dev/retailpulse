import { auth, theme } from './lib/store.js'
import { renderLogin }     from './pages/login.js'
import { renderDashboard } from './pages/dashboard.js'
import { renderForecast }  from './pages/forecast.js'
import { renderInventory } from './pages/inventory.js'
import { renderAlerts }    from './pages/alerts.js'
import { renderProducts }  from './pages/products.js'
import { renderImpact }    from './pages/impact.js'
import { renderSettings }  from './pages/settings.js'
import { renderAdmin }     from './pages/admin.js'

const ROUTES = {
  login:     renderLogin,
  dashboard: renderDashboard,
  forecast:  renderForecast,
  inventory: renderInventory,
  alerts:    renderAlerts,
  products:  renderProducts,
  impact:    renderImpact,
  settings:  renderSettings,
  admin:     renderAdmin,
}

export function navigate(page) {
  if (page !== 'login' && !auth.isLoggedIn()) {
    history.pushState(null, '', '#login')
    renderLogin()
    return
  }
  // Gate admin page to admin only
  if (page === 'admin' && !auth.isAdmin()) {
    history.pushState(null, '', '#dashboard')
    renderDashboard()
    return
  }
  history.pushState(null, '', '#' + page)
  const fn = ROUTES[page] || ROUTES.dashboard
  fn()
}

window.__navigate = navigate

function routeFromHash() {
  const page = location.hash.replace('#', '') || 'dashboard'
  navigate(page)
}

theme.init()
window.addEventListener('hashchange', routeFromHash)
routeFromHash()
