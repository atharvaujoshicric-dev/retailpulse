import { renderLayout } from '../components/layout.js'
import { invStore, fmt, fmtN, stockStatus, downloadCSV, MOCK } from '../lib/data.js'
import { auth, auditLog } from '../lib/store.js'

let activeTab = 'inventory'
let search = ''
let filter = 'all'

// ── Modal ────────────────────────────────────────────────────

function showModal(mode, item = null) {
  const isEdit = mode === 'edit'
  const cats = [...new Set(MOCK.products.map(p=>p.category))].sort()

  const backdrop = document.createElement('div')
  backdrop.className = 'modal-backdrop'
  backdrop.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <div class="flex items-center gap-3">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(20,184,166,.15);display:flex;align-items:center;justify-content:center">
            <i data-lucide="${isEdit?'pencil':'plus-circle'}" style="width:18px;height:18px;color:var(--brand)"></i>
          </div>
          <div>
            <div style="font-weight:700;font-size:15px">${isEdit?'Edit Inventory Item':'Add Inventory Item'}</div>
            <div class="text-muted text-xs">${isEdit?'Update stock levels and thresholds':'Add a new product to inventory'}</div>
          </div>
        </div>
        <button class="btn-icon" id="modal-close">
          <i data-lucide="x" style="width:18px;height:18px"></i>
        </button>
      </div>

      <div class="modal-body">
        <div class="modal-grid">
          <div class="form-group">
            <label>Product Name *</label>
            <input class="input" id="f-name" value="${item?.product?.name||''}" placeholder="e.g. Basmati Rice 5kg">
          </div>
          <div class="form-group">
            <label>SKU *</label>
            <input class="input" id="f-sku" value="${item?.product?.sku||''}" placeholder="e.g. SKU-016"${isEdit?' readonly style="opacity:.6;cursor:not-allowed"':''}>
          </div>
          <div class="form-group">
            <label>Category *</label>
            <select class="input" id="f-cat">
              ${cats.map(c=>`<option value="${c}"${(item?.product?.category||'Grocery')===c?' selected':''}>${c}</option>`).join('')}
              <option value="__new__">+ Add new category</option>
            </select>
          </div>
          <div class="form-group" id="new-cat-wrap" style="display:none">
            <label>New Category Name</label>
            <input class="input" id="f-newcat" placeholder="e.g. Frozen Foods">
          </div>
          <div class="form-group">
            <label>Current Stock *</label>
            <input class="input" type="number" id="f-stock" value="${item?.current_stock??''}" min="0" placeholder="0">
          </div>
          <div class="form-group">
            <label>Reorder Point *</label>
            <input class="input" type="number" id="f-rp" value="${item?.reorder_point??''}" min="0" placeholder="e.g. 20">
          </div>
          <div class="form-group">
            <label>Max Stock *</label>
            <input class="input" type="number" id="f-max" value="${item?.max_stock??''}" min="1" placeholder="e.g. 500">
          </div>
          <div class="form-group">
            <label>Reorder Quantity</label>
            <input class="input" type="number" id="f-rq" value="${item?.reorder_quantity??100}" min="1" placeholder="e.g. 100">
          </div>
        </div>
        <div id="modal-err" style="display:none;margin-top:12px;padding:10px 14px;border-radius:8px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#f87171;font-size:13px"></div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" id="modal-cancel">Cancel</button>
        <button class="btn btn-primary" id="modal-save">
          <i data-lucide="${isEdit?'save':'plus'}" style="width:15px;height:15px"></i>
          ${isEdit?'Save Changes':'Add Item'}
        </button>
      </div>
    </div>
  `

  document.body.appendChild(backdrop)
  lucide.createIcons()

  const close = () => document.body.removeChild(backdrop)
  document.getElementById('modal-close').onclick = close
  document.getElementById('modal-cancel').onclick = close
  backdrop.addEventListener('click', e => { if(e.target===backdrop) close() })

  document.getElementById('f-cat').addEventListener('change', e => {
    document.getElementById('new-cat-wrap').style.display = e.target.value==='__new__' ? 'block' : 'none'
  })

  document.getElementById('modal-save').addEventListener('click', () => {
    const name  = document.getElementById('f-name').value.trim()
    const sku   = document.getElementById('f-sku').value.trim()
    const catSel= document.getElementById('f-cat').value
    const cat   = catSel==='__new__' ? document.getElementById('f-newcat').value.trim() : catSel
    const stock = +document.getElementById('f-stock').value
    const rp    = +document.getElementById('f-rp').value
    const max   = +document.getElementById('f-max').value
    const rq    = +document.getElementById('f-rq').value || 100

    const errEl = document.getElementById('modal-err')
    const err = msg => { errEl.textContent=msg; errEl.style.display='block' }

    if(!name||!sku||!cat) return err('Product name, SKU and category are required.')
    if(isNaN(stock)||stock<0) return err('Current stock must be 0 or more.')
    if(isNaN(rp)||rp<0) return err('Reorder point must be 0 or more.')
    if(!max||max<1) return err('Max stock must be at least 1.')
    if(rp>=max) return err('Reorder point must be less than max stock.')

    const payload = {
      current_stock: stock,
      reorder_point: rp,
      max_stock: max,
      reorder_quantity: rq,
      product: { name, sku, category: cat }
    }

    if (isEdit) {
      invStore.update(item.id, payload)
      auditLog.add('inv_update', `Updated inventory: ${name} → stock ${stock}`, auth.user()?.role)
    } else {
      // Check duplicate SKU
      const existing = invStore.getAll().find(i => i.product?.sku?.toLowerCase()===sku.toLowerCase())
      if(existing) return err(`SKU "${sku}" already exists.`)
      invStore.add(payload)
      auditLog.add('inv_add', `Added to inventory: ${name} (${sku}), stock ${stock}`, auth.user()?.role)
    }

    close()
    renderInventory()
  })
}

function showDeleteConfirm(item) {
  const backdrop = document.createElement('div')
  backdrop.className = 'modal-backdrop'
  backdrop.innerHTML = `
    <div class="modal-box" style="max-width:400px">
      <div class="modal-header">
        <div class="flex items-center gap-3">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(239,68,68,.15);display:flex;align-items:center;justify-content:center">
            <i data-lucide="trash-2" style="width:18px;height:18px;color:#ef4444"></i>
          </div>
          <div>
            <div style="font-weight:700;font-size:15px">Delete Item</div>
            <div class="text-muted text-xs">This action cannot be undone</div>
          </div>
        </div>
        <button class="btn-icon" id="del-close"><i data-lucide="x" style="width:18px;height:18px"></i></button>
      </div>
      <div class="modal-body">
        <p style="font-size:14px">Are you sure you want to delete <strong>${item.product?.name}</strong> (${item.product?.sku}) from inventory?</p>
        <p class="text-muted text-sm" style="margin-top:8px">Current stock: ${item.current_stock} units</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="del-cancel">Cancel</button>
        <button class="btn" id="del-confirm" style="background:#ef4444;color:white">
          <i data-lucide="trash-2" style="width:15px;height:15px"></i> Delete
        </button>
      </div>
    </div>
  `
  document.body.appendChild(backdrop)
  lucide.createIcons()
  const close = () => document.body.removeChild(backdrop)
  document.getElementById('del-close').onclick = close
  document.getElementById('del-cancel').onclick = close
  backdrop.addEventListener('click', e => { if(e.target===backdrop) close() })
  document.getElementById('del-confirm').addEventListener('click', () => {
    invStore.delete(item.id)
    auditLog.add('inv_delete', `Deleted inventory: ${item.product?.name} (${item.product?.sku})`, auth.user()?.role)
    close()
    renderInventory()
  })
}

function showAdjustModal(item) {
  const backdrop = document.createElement('div')
  backdrop.className = 'modal-backdrop'
  backdrop.innerHTML = `
    <div class="modal-box" style="max-width:420px">
      <div class="modal-header">
        <div class="flex items-center gap-3">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(20,184,166,.15);display:flex;align-items:center;justify-content:center">
            <i data-lucide="sliders-horizontal" style="width:18px;height:18px;color:var(--brand)"></i>
          </div>
          <div>
            <div style="font-weight:700;font-size:15px">Adjust Stock</div>
            <div class="text-muted text-xs">${item.product?.name}</div>
          </div>
        </div>
        <button class="btn-icon" id="adj-close"><i data-lucide="x" style="width:18px;height:18px"></i></button>
      </div>
      <div class="modal-body">
        <div style="background:var(--surface2);border-radius:10px;padding:12px;margin-bottom:16px;display:flex;justify-content:space-between">
          <span class="text-muted text-sm">Current Stock</span>
          <span style="font-weight:700;font-size:18px">${item.current_stock} units</span>
        </div>
        <div class="form-group">
          <label>Adjustment Type</label>
          <div class="pills" id="adj-type-pills" style="margin-top:4px">
            <button class="pill active" data-t="add">+ Add Stock</button>
            <button class="pill" data-t="remove">- Remove Stock</button>
            <button class="pill" data-t="set">= Set Exact</button>
          </div>
        </div>
        <div class="form-group" style="margin-top:12px">
          <label id="adj-qty-label">Quantity to Add *</label>
          <input class="input" type="number" id="adj-qty" min="0" placeholder="Enter quantity" style="margin-top:4px">
        </div>
        <div class="form-group" style="margin-top:12px">
          <label>Reason / Note</label>
          <input class="input" id="adj-note" placeholder="e.g. Stock received from supplier" style="margin-top:4px">
        </div>
        <div id="adj-err" style="display:none;margin-top:10px;padding:10px;border-radius:8px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#f87171;font-size:13px"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="adj-cancel">Cancel</button>
        <button class="btn btn-primary" id="adj-save">
          <i data-lucide="check" style="width:15px;height:15px"></i> Apply Adjustment
        </button>
      </div>
    </div>
  `
  document.body.appendChild(backdrop)
  lucide.createIcons()

  let adjType = 'add'
  const LABELS = { add:'Quantity to Add *', remove:'Quantity to Remove *', set:'Set Stock to *' }

  document.querySelectorAll('#adj-type-pills .pill').forEach(btn => {
    btn.addEventListener('click', () => {
      adjType = btn.dataset.t
      document.querySelectorAll('#adj-type-pills .pill').forEach(b=>b.classList.remove('active'))
      btn.classList.add('active')
      document.getElementById('adj-qty-label').textContent = LABELS[adjType]
    })
  })

  const close = () => document.body.removeChild(backdrop)
  document.getElementById('adj-close').onclick = close
  document.getElementById('adj-cancel').onclick = close
  backdrop.addEventListener('click', e => { if(e.target===backdrop) close() })

  document.getElementById('adj-save').addEventListener('click', () => {
    const qty = +document.getElementById('adj-qty').value
    const note = document.getElementById('adj-note').value.trim()
    const errEl = document.getElementById('adj-err')
    const err = msg => { errEl.textContent=msg; errEl.style.display='block' }

    if(isNaN(qty)||qty<0) return err('Please enter a valid quantity.')
    let newStock = item.current_stock
    if(adjType==='add') newStock += qty
    else if(adjType==='remove') { if(qty>item.current_stock) return err(`Cannot remove more than current stock (${item.current_stock}).`); newStock -= qty }
    else newStock = qty

    invStore.update(item.id, { current_stock: newStock })
    auditLog.add('inv_adjust', `Stock adjusted: ${item.product?.name} ${adjType==='set'?'→':adjType==='add'?'+':'-'}${qty} → ${newStock}${note?' ('+note+')':''}`, auth.user()?.role)
    close()
    renderInventory()
  })
}

// ── Main render ──────────────────────────────────────────────

export function renderInventory() {
  const canAdd    = auth.can('add')
  const canEdit   = auth.can('edit')
  const canDelete = auth.can('delete')

  const inv = invStore.getAll()
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
  health.health_score = inv.length ? Math.round(health.healthy/health.total*100) : 0

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
          {label:'Health Score',value:`${health.health_score}%`,icon:'heart-pulse',color:'var(--brand)'},
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

      <!-- Tabs + Add button -->
      <div class="flex items-center" style="border-bottom:1px solid var(--border);gap:0">
        <div class="tabs" style="border-bottom:none;flex:1">
          <button class="tab${activeTab==='inventory'?' active':''}" data-tab="inventory">All Inventory (${inv.length})</button>
          <button class="tab${activeTab==='reorder'?' active':''}" data-tab="reorder">Reorder Suggestions (${reorders.length})</button>
        </div>
        ${canAdd ? `
        <button class="btn btn-primary" id="btn-add-item" style="margin-bottom:1px;font-size:13px">
          <i data-lucide="plus" style="width:15px;height:15px"></i> Add Item
        </button>` : ''}
      </div>

      ${activeTab==='inventory'?`
        <!-- Filters -->
        <div class="flex gap-3" style="flex-wrap:wrap;align-items:center">
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
          ${canDelete&&auth.isAdmin()?`
          <button class="btn btn-secondary" id="btn-reset-inv" style="font-size:12px;color:#f59e0b;border-color:#f59e0b40" title="Reset to default data">
            <i data-lucide="rotate-ccw" style="width:13px;height:13px"></i> Reset Data
          </button>`:``}
        </div>

        <!-- Permission notice for basic users -->
        ${!canAdd?`
        <div style="padding:10px 14px;border-radius:8px;background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.2);font-size:12px;color:#60a5fa;display:flex;align-items:center;gap:8px">
          <i data-lucide="info" style="width:14px;height:14px;flex-shrink:0"></i>
          You can adjust stock quantities but cannot add or delete items. Contact an admin for full access.
        </div>`:''}

        <div class="card" style="overflow:hidden">
          <div style="overflow-x:auto">
            <table>
              <thead>
                <tr>
                  <th>Product</th><th>SKU</th><th>Category</th>
                  <th>Stock Level</th><th>Reorder Point</th><th>Status</th>
                  ${canEdit?'<th style="text-align:right">Actions</th>':''}
                </tr>
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
                      ${canEdit?`
                      <td style="text-align:right">
                        <div class="flex gap-1" style="justify-content:flex-end">
                          <button class="row-action-btn" data-action="adjust" data-id="${item.id}" title="Adjust stock">
                            <i data-lucide="sliders-horizontal" style="width:14px;height:14px"></i>
                          </button>
                          ${canAdd?`
                          <button class="row-action-btn" data-action="edit" data-id="${item.id}" title="Edit item">
                            <i data-lucide="pencil" style="width:14px;height:14px"></i>
                          </button>`:''}
                          ${canDelete?`
                          <button class="row-action-btn row-action-danger" data-action="delete" data-id="${item.id}" title="Delete item">
                            <i data-lucide="trash-2" style="width:14px;height:14px"></i>
                          </button>`:''}
                        </div>
                      </td>`:''}
                    </tr>
                  `
                }).join('')}
                ${filtered.length===0?`<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted)">No items match your filter</td></tr>`:''}
              </tbody>
            </table>
          </div>
          <div style="padding:10px 16px;border-top:1px solid var(--border);font-size:11px;color:var(--muted)">
            Showing ${filtered.length} of ${inv.length} items
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

  renderLayout('inventory', content, MOCK.alerts.filter(a=>!a.is_read).length)

  // Tab switching
  document.querySelectorAll('.tab[data-tab]').forEach(t => {
    t.addEventListener('click', () => { activeTab=t.dataset.tab; renderInventory() })
  })

  // Search & filter
  document.getElementById('inv-search')?.addEventListener('input', e => { search=e.target.value; renderInventory() })
  document.querySelectorAll('#filter-pills .pill').forEach(btn => {
    btn.addEventListener('click', () => { filter=btn.dataset.f; renderInventory() })
  })

  // Export
  document.getElementById('exp-inv')?.addEventListener('click', () =>
    downloadCSV(filtered.map(i=>({sku:i.product?.sku,name:i.product?.name,category:i.product?.category,current_stock:i.current_stock,reorder_point:i.reorder_point,max_stock:i.max_stock})),'inventory.csv')
  )

  // Reset (admin only)
  document.getElementById('btn-reset-inv')?.addEventListener('click', () => {
    if(confirm('Reset all inventory to default data? All manual changes will be lost.')) {
      invStore.reset()
      auditLog.add('inv_reset', 'Admin reset inventory to default data', 'admin')
      renderInventory()
    }
  })

  // Add new item
  document.getElementById('btn-add-item')?.addEventListener('click', () => showModal('add'))

  // Row action buttons
  document.querySelectorAll('.row-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id
      const item = invStore.getAll().find(i=>i.id===id)
      if(!item) return
      if(btn.dataset.action==='edit')   showModal('edit', item)
      if(btn.dataset.action==='delete') showDeleteConfirm(item)
      if(btn.dataset.action==='adjust') showAdjustModal(item)
    })
  })
}
