import { renderLayout } from '../components/layout.js'
import { MOCK, fmt, fmtN, stockStatus, downloadCSV } from '../lib/data.js'

let activeTab = 'inventory'
let search = ''
let filter = 'all'

export function renderInventory() {
  const inv = MOCK.inventory
  const reorders = inv.filter(i=>i.current_stock<=i.reorder_point).map(i=>({
    product_id:i.product_id, product_name:i.product.name, sku:i.product.sku, category:i.product.category,
    current_stock:i.current_stock, reorder_point:i.reorder_point,
    suggested_order:i.reorder_quantity, estimated_cost:i.reorder_quantity*300,
    urgency: i.current_stock===0?'critical':i.current_stock<i.reorder_point/2?'high':'medium'
  }))

  const health = { healthy:0, low:0, critical:0, overstock:0, total:inv.length }
  inv.forEach(i=>{
    const s=stockStatus(i.current_stock,i.reorder_point,i.max_stock)
    if(s.color==='green') health.healthy++
    else if(s.color==='yellow') health.low++
    else if(s.color==='red') health.critical++
    else health.overstock++
  })
  health.health_score = Math.round(health.healthy/health.total*100)

  const filtered = inv.filter(i=>{
    const q=search.toLowerCase()
    const match = (i.product?.name||'').toLowerCase().includes(q)||(i.product?.sku||'').toLowerCase().includes(q)
    if(!match) return false
    const {color}=stockStatus(i.current_stock,i.reorder_point,i.max_stock)
    if(filter==='low') return color==='yellow'||color==='red'
    if(filter==='healthy') return color==='green'
    if(filter==='overstock') return color==='blue'
    return true
  })

  const BADGE = {green:'badge-green',yellow:'badge-yellow',red:'badge-red',blue:'badge-blue'}
  const BAR_COLOR = {green:'#10b981',yellow:'#f59e0b',red:'#ef4444',blue:'#3b82f6'}

  const content = `
    <div class="space-y">
      <!-- Health -->
      <div class="health-grid">
        ${[
          {label:'Health Score',value:`${health.health_score}%`,icon:'check-circle',color:'var(--brand)'},
          {label:'Healthy',value:health.healthy,icon:'check-circle',color:'#10b981'},
          {label:'Low Stock',value:health.low,icon:'alert-triangle',color:'#f59e0b'},
          {label:'Critical',value:health.critical,icon:'alert-triangle',color:'#ef4444'},
          {label:'Overstock',value:health.overstock,icon:'trending-down',color:'#3b82f6'},
        ].map(h=>`
          <div class="card p-4 flex items-center gap-3">
            <i data-lucide="${h.icon}" style="width:20px;height:20px;color:${h.color};flex-shrink:0"></i>
            <div>
              <div class="text-muted text-xs">${h.label}</div>
              <div style="font-size:22px;font-weight:700">${h.value}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab${activeTab==='inventory'?' active':''}" data-tab="inventory">All Inventory</button>
        <button class="tab${activeTab==='reorder'?' active':''}" data-tab="reorder">Reorder Suggestions (${reorders.length})</button>
      </div>

      ${activeTab==='inventory'?`
        <!-- Filters -->
        <div class="flex gap-3" style="flex-wrap:wrap">
          <div style="position:relative;flex:1;min-width:200px;max-width:320px">
            <i data-lucide="search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--muted)"></i>
            <input class="input" id="inv-search" placeholder="Search name or SKU…" value="${search}" style="padding-left:32px">
          </div>
          <div class="pills" id="filter-pills">
            ${['all','low','healthy','overstock'].map(f=>`<button class="pill${f===filter?' active':''}" data-f="${f}" style="text-transform:capitalize">${f}</button>`).join('')}
          </div>
          <button class="btn btn-secondary" id="exp-inv" style="font-size:12px">
            <i data-lucide="download" style="width:13px;height:13px"></i> Export
          </button>
        </div>

        <div class="card" style="overflow:hidden">
          <div style="overflow-x:auto">
            <table>
              <thead>
                <tr><th>Product</th><th>SKU</th><th>Category</th><th>Stock Level</th><th>Reorder Point</th><th>Status</th></tr>
              </thead>
              <tbody>
                ${filtered.map(item=>{
                  const s=stockStatus(item.current_stock,item.reorder_point,item.max_stock)
                  return `
                    <tr>
                      <td>
                        <div class="flex items-center gap-2">
                          <div style="width:32px;height:32px;border-radius:8px;background:var(--surface2);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                            <i data-lucide="package" style="width:14px;height:14px;color:var(--muted)"></i>
                          </div>
                          <span style="font-weight:500">${item.product?.name}</span>
                        </div>
                      </td>
                      <td class="font-mono text-muted text-xs">${item.product?.sku}</td>
                      <td class="text-muted">${item.product?.category}</td>
                      <td>
                        <div class="progress-wrap">
                          <span style="font-weight:600;width:36px">${item.current_stock}</span>
                          <div class="progress-bar" style="min-width:60px"><div class="progress-fill" style="width:${Math.min(s.pct,100)}%;background:${BAR_COLOR[s.color]}"></div></div>
                          <span class="text-muted text-xs" style="width:32px">${s.pct}%</span>
                        </div>
                      </td>
                      <td class="text-muted">${item.reorder_point}</td>
                      <td><span class="badge ${BADGE[s.color]}">${s.label}</span></td>
                    </tr>
                  `
                }).join('')}
                ${filtered.length===0?`<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--muted)">No items match your filter</td></tr>`:''}
              </tbody>
            </table>
          </div>
        </div>
      ` : `
        <!-- Reorder suggestions -->
        <div class="space-y-sm">
          ${reorders.length===0?`
            <div class="card empty-state">
              <div class="empty-icon"><i data-lucide="check-circle" style="width:24px;height:24px;color:#10b981"></i></div>
              <p style="font-weight:600;margin-bottom:4px">All stock levels are healthy!</p>
              <p class="text-muted text-sm">No reorder suggestions at this time.</p>
            </div>
          `:reorders.map(r=>`
            <div class="card p-4 flex" style="flex-wrap:wrap;align-items:center;gap:12px;border-left:${r.urgency==='critical'?'4px solid var(--red)':r.urgency==='high'?'4px solid #f87171':'none'}">
              <div class="flex items-center gap-3" style="flex:1;min-width:180px">
                <div style="width:36px;height:36px;border-radius:8px;background:${r.urgency==='critical'?'rgba(239,68,68,.15)':'rgba(245,158,11,.15)'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <i data-lucide="alert-triangle" style="width:16px;height:16px;color:${r.urgency==='critical'?'#ef4444':'#f59e0b'}"></i>
                </div>
                <div>
                  <div style="font-weight:500">${r.product_name}</div>
                  <div class="font-mono text-muted text-xs">${r.sku}</div>
                </div>
              </div>
              <div class="flex gap-4" style="flex-wrap:wrap">
                ${[
                  {lbl:'Current',val:r.current_stock+' units',red:true},
                  {lbl:'Reorder Point',val:r.reorder_point+' units'},
                  {lbl:'Suggested Order',val:r.suggested_order+' units',brand:true},
                  {lbl:'Est. Cost',val:fmt(r.estimated_cost)},
                ].map(f=>`<div style="text-align:center">
                  <div class="text-muted text-xs mb-1">${f.lbl}</div>
                  <div style="font-weight:600;color:${f.red?'#f87171':f.brand?'var(--brand)':'var(--text)'}">${f.val}</div>
                </div>`).join('')}
              </div>
              <span class="badge ${r.urgency==='critical'||r.urgency==='high'?'badge-red':'badge-yellow'}">${r.urgency}</span>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `

  renderLayout('inventory', content)

  document.querySelectorAll('.tab[data-tab]').forEach(t => {
    t.addEventListener('click', () => { activeTab=t.dataset.tab; renderInventory() })
  })
  document.getElementById('inv-search')?.addEventListener('input', e => { search=e.target.value; renderInventory() })
  document.querySelectorAll('#filter-pills .pill').forEach(btn => {
    btn.addEventListener('click', () => { filter=btn.dataset.f; renderInventory() })
  })
  document.getElementById('exp-inv')?.addEventListener('click', () =>
    downloadCSV(filtered.map(i=>({sku:i.product?.sku,name:i.product?.name,category:i.product?.category,current_stock:i.current_stock,reorder_point:i.reorder_point,max_stock:i.max_stock})),'inventory.csv')
  )
}
