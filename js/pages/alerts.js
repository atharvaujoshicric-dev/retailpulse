import { renderLayout } from '../components/layout.js'
import { MOCK, fmtDate, sevColor } from '../lib/data.js'

let filter = 'all'
let alerts = JSON.parse(JSON.stringify(MOCK.alerts)) // mutable copy

const SEV_ORDER = {critical:0,high:1,medium:2,low:3}
const ALERT_ICONS = {low_stock:'package',reorder:'package',overstock:'package',demand_spike:'zap',stockout_risk:'alert-triangle'}
const BADGE = {red:'badge-red',yellow:'badge-yellow',green:'badge-green',blue:'badge-blue'}

export function renderAlerts() {
  alerts.sort((a,b)=>(SEV_ORDER[a.severity]??9)-(SEV_ORDER[b.severity]??9))
  const unread = alerts.filter(a=>!a.is_read).length

  const filtered = alerts.filter(a=>{
    if(filter==='unread') return !a.is_read
    if(filter==='critical') return a.severity==='critical'||a.severity==='high'
    return true
  })

  const ICON_BG = {
    red:'rgba(239,68,68,.15)',yellow:'rgba(245,158,11,.15)',
    green:'rgba(16,185,129,.15)',blue:'rgba(59,130,246,.15)'
  }
  const ICON_COLOR = {red:'#ef4444',yellow:'#f59e0b',green:'#10b981',blue:'#3b82f6'}
  const BORDER_COLOR = {red:'var(--red)',yellow:'var(--yellow)',green:'var(--green)',blue:'var(--blue)'}

  const content = `
    <div class="space-y">
      <div class="flex items-center gap-3" style="flex-wrap:wrap">
        <div class="pills" id="filter-pills">
          <button class="pill${filter==='all'?' active':''}" data-f="all">All (${alerts.length})</button>
          <button class="pill${filter==='unread'?' active':''}" data-f="unread">Unread (${unread})</button>
          <button class="pill${filter==='critical'?' active':''}" data-f="critical">Critical</button>
        </div>
        <button class="btn btn-secondary" id="mark-all" style="margin-left:auto;font-size:13px" ${unread===0?'disabled':''}>
          <i data-lucide="check-check" style="width:14px;height:14px"></i> Mark all read
        </button>
      </div>

      ${filtered.length===0?`
        <div class="card empty-state">
          <div class="empty-icon" style="background:rgba(16,185,129,.15)">
            <i data-lucide="check-check" style="width:24px;height:24px;color:#10b981"></i>
          </div>
          <p style="font-weight:600;margin-bottom:4px">All clear!</p>
          <p class="text-muted text-sm">No alerts match your current filter.</p>
        </div>
      `:`
        <div class="space-y-sm">
          ${filtered.map(a=>{
            const c=sevColor(a.severity)
            return `
              <div class="card p-4${!a.is_read?' alert-unread sev-'+c:''}" style="${!a.is_read?`border-left:4px solid ${BORDER_COLOR[c]}`:''}">
                <div class="flex gap-3">
                  <div style="width:36px;height:36px;border-radius:8px;background:${ICON_BG[c]};color:${ICON_COLOR[c]};display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <i data-lucide="${ALERT_ICONS[a.alert_type]||'bell'}" style="width:16px;height:16px"></i>
                  </div>
                  <div style="flex:1;min-width:0">
                    <div class="flex items-center gap-2" style="flex-wrap:wrap;margin-bottom:4px">
                      <span style="font-weight:${!a.is_read?600:400};font-size:13px">${a.title}</span>
                      <span class="badge ${BADGE[c]}">${a.severity}</span>
                      ${!a.is_read?`<span class="unread-dot"></span>`:''}
                      <span class="text-muted text-xs" style="margin-left:auto">${fmtDate(a.created_at)}</span>
                    </div>
                    ${a.message?`<p class="text-muted text-sm" style="margin-bottom:4px">${a.message}</p>`:''}
                    ${a.product?`<p class="font-mono text-muted" style="font-size:11px;margin-bottom:8px">${a.product.sku} · ${a.product.name}</p>`:''}
                    <div class="flex gap-3">
                      ${!a.is_read?`<button class="btn-icon" data-mark="${a.id}" style="font-size:12px;color:var(--brand)">Mark as read</button>`:''}
                      <button class="btn-icon" data-dismiss="${a.id}" style="font-size:12px;color:var(--muted)">Dismiss</button>
                    </div>
                  </div>
                </div>
              </div>
            `
          }).join('')}
        </div>
      `}
    </div>
  `

  renderLayout('alerts', content, unread)

  document.querySelectorAll('#filter-pills .pill').forEach(btn => {
    btn.addEventListener('click', ()=>{ filter=btn.dataset.f; renderAlerts() })
  })
  document.getElementById('mark-all')?.addEventListener('click', ()=>{
    alerts.forEach(a=>a.is_read=true); renderAlerts()
  })
  document.querySelectorAll('[data-mark]').forEach(btn=>{
    btn.addEventListener('click', ()=>{ const a=alerts.find(x=>x.id===btn.dataset.mark); if(a)a.is_read=true; renderAlerts() })
  })
  document.querySelectorAll('[data-dismiss]').forEach(btn=>{
    btn.addEventListener('click', ()=>{ alerts=alerts.filter(x=>x.id!==btn.dataset.dismiss); renderAlerts() })
  })
}
