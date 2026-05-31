import { renderLayout } from '../components/layout.js'
import { auth, userManager, auditLog } from '../lib/store.js'
import { invStore, MOCK } from '../lib/data.js'

let adminTab = 'overview'
let userSearch = ''

// ── User modal ───────────────────────────────────────────────

function showUserModal(mode, user=null) {
  const isEdit = mode==='edit'
  const backdrop = document.createElement('div')
  backdrop.className = 'modal-backdrop'
  backdrop.innerHTML = `
    <div class="modal-box" style="max-width:480px">
      <div class="modal-header">
        <div class="flex items-center gap-3">
          <div style="width:36px;height:36px;border-radius:10px;background:rgba(139,92,246,.15);display:flex;align-items:center;justify-content:center">
            <i data-lucide="${isEdit?'user-cog':'user-plus'}" style="width:18px;height:18px;color:#8b5cf6"></i>
          </div>
          <div>
            <div style="font-weight:700;font-size:15px">${isEdit?'Edit User':'Add New User'}</div>
            <div class="text-muted text-xs">${isEdit?'Update user details and role':'Create a new system user'}</div>
          </div>
        </div>
        <button class="btn-icon" id="um-close"><i data-lucide="x" style="width:18px;height:18px"></i></button>
      </div>
      <div class="modal-body">
        <div class="modal-grid">
          <div class="form-group">
            <label>Full Name *</label>
            <input class="input" id="um-name" value="${user?.name||''}" placeholder="e.g. Jane Doe">
          </div>
          <div class="form-group">
            <label>Email *</label>
            <input class="input" type="email" id="um-email" value="${user?.email||''}" placeholder="jane@company.com"${isEdit?' readonly style="opacity:.6;cursor:not-allowed"':''}>
          </div>
          <div class="form-group">
            <label>Role *</label>
            <select class="input" id="um-role">
              <option value="user"${user?.role==='user'?' selected':''}>User — View & adjust stock</option>
              <option value="manager"${user?.role==='manager'?' selected':''}>Manager — Add, edit inventory</option>
              <option value="admin"${user?.role==='admin'?' selected':''}>Admin — Full GODMODE access</option>
            </select>
          </div>
          <div class="form-group">
            <label>${isEdit?'New Password (leave blank to keep)':'Password *'}</label>
            <input class="input" type="password" id="um-pw" placeholder="Min 8 characters">
          </div>
        </div>
        <div id="um-err" style="display:none;margin-top:12px;padding:10px 14px;border-radius:8px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#f87171;font-size:13px"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="um-cancel">Cancel</button>
        <button class="btn" id="um-save" style="background:#8b5cf6;color:white">
          <i data-lucide="${isEdit?'save':'user-plus'}" style="width:15px;height:15px"></i>
          ${isEdit?'Update User':'Create User'}
        </button>
      </div>
    </div>
  `
  document.body.appendChild(backdrop)
  lucide.createIcons()
  const close = () => document.body.removeChild(backdrop)
  document.getElementById('um-close').onclick = close
  document.getElementById('um-cancel').onclick = close
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop) close() })

  document.getElementById('um-save').addEventListener('click', () => {
    const name  = document.getElementById('um-name').value.trim()
    const email = isEdit ? user.email : document.getElementById('um-email').value.trim()
    const role  = document.getElementById('um-role').value
    const pw    = document.getElementById('um-pw').value
    const errEl = document.getElementById('um-err')
    const err = msg => { errEl.textContent=msg; errEl.style.display='block' }

    if(!name) return err('Name is required.')
    if(!email||!/\S+@\S+\.\S+/.test(email)) return err('Valid email is required.')
    if(!isEdit && (!pw || pw.length<8)) return err('Password must be at least 8 characters.')

    if(isEdit) userManager.update(user.id, { name, role })
    else {
      const all = userManager.getAll()
      if(all.find(u=>u.email===email)) return err('A user with this email already exists.')
      userManager.add({ name, email, role, active:true })
    }
    close()
    renderAdmin()
  })
}

// ── Main render ──────────────────────────────────────────────

export function renderAdmin() {
  if(!auth.isAdmin()) { window.__navigate('dashboard'); return }

  const users = userManager.getAll()
  const logs  = auditLog.get()
  const inv   = invStore.getAll()

  // Stats
  const invStats = {
    total: inv.length,
    critical: inv.filter(i=>i.current_stock<=i.reorder_point/2).length,
    low: inv.filter(i=>i.current_stock>i.reorder_point/2&&i.current_stock<=i.reorder_point).length,
  }
  const logStats = {
    total: logs.length,
    today: logs.filter(l=>l.ts.startsWith(new Date().toISOString().split('T')[0])).length,
    invChanges: logs.filter(l=>l.type.startsWith('inv_')).length,
    logins: logs.filter(l=>l.type==='login').length,
  }

  const filteredUsers = users.filter(u=>{
    const q=userSearch.toLowerCase()
    return !q||u.name.toLowerCase().includes(q)||u.email.toLowerCase().includes(q)||u.role.includes(q)
  })

  const ROLE_BADGE = {
    admin: `<span class="badge" style="background:rgba(139,92,246,.15);color:#a78bfa"><i data-lucide="shield" style="width:10px;height:10px"></i> GODMODE</span>`,
    manager: `<span class="badge badge-blue">Manager</span>`,
    user: `<span class="badge" style="background:var(--surface2);color:var(--muted)">User</span>`,
  }

  const LOG_ICONS = {
    login:'log-in', logout:'log-out', inv_add:'plus-circle', inv_update:'pencil',
    inv_delete:'trash-2', inv_adjust:'sliders-horizontal', inv_reset:'rotate-ccw',
    user_added:'user-plus', user_updated:'user-cog', user_deleted:'user-minus',
    user_toggled:'toggle-left',
  }
  const LOG_COLORS = {
    login:'#34d399', logout:'#94a3b8', inv_add:'#14b8a6', inv_update:'#3b82f6',
    inv_delete:'#ef4444', inv_adjust:'#f59e0b', inv_reset:'#f97316',
    user_added:'#8b5cf6', user_updated:'#8b5cf6', user_deleted:'#ef4444', user_toggled:'#f59e0b',
  }

  const content = `
    <div class="space-y">

      <!-- GODMODE Banner -->
      <div style="background:linear-gradient(135deg,rgba(139,92,246,.15) 0%,rgba(20,184,166,.1) 100%);border:1px solid rgba(139,92,246,.3);border-radius:14px;padding:20px 24px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">
        <div style="width:48px;height:48px;border-radius:14px;background:rgba(139,92,246,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <i data-lucide="shield-check" style="width:26px;height:26px;color:#a78bfa"></i>
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:18px;font-weight:800;background:linear-gradient(90deg,#a78bfa,#14b8a6);-webkit-background-clip:text;-webkit-text-fill-color:transparent">
            GODMODE — Super Admin Panel
          </div>
          <div class="text-muted text-sm" style="margin-top:2px">Full system access · User management · Audit logs · Data controls</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span style="padding:6px 14px;border-radius:99px;background:rgba(139,92,246,.15);color:#a78bfa;font-size:12px;font-weight:600;border:1px solid rgba(139,92,246,.3)">
            ⚡ ${users.length} Users
          </span>
          <span style="padding:6px 14px;border-radius:99px;background:rgba(20,184,166,.12);color:#14b8a6;font-size:12px;font-weight:600;border:1px solid rgba(20,184,166,.25)">
            📦 ${inv.length} Items
          </span>
        </div>
      </div>

      <!-- Quick stats -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
        ${[
          {label:'Total Users',value:users.length,icon:'users',color:'#8b5cf6',sub:users.filter(u=>u.active).length+' active'},
          {label:'Inventory Items',value:invStats.total,icon:'package',color:'#14b8a6',sub:`${invStats.critical} critical`},
          {label:'Audit Events Today',value:logStats.today,icon:'activity',color:'#3b82f6',sub:logStats.total+' total'},
          {label:'Logins Recorded',value:logStats.logins,icon:'log-in',color:'#10b981',sub:logStats.invChanges+' inv changes'},
        ].map(s=>`
          <div class="card p-4">
            <div class="flex items-center justify-between mb-3">
              <span class="text-muted text-xs">${s.label}</span>
              <div style="width:32px;height:32px;border-radius:8px;background:${s.color}20;display:flex;align-items:center;justify-content:center">
                <i data-lucide="${s.icon}" style="width:16px;height:16px;color:${s.color}"></i>
              </div>
            </div>
            <div style="font-size:28px;font-weight:700">${s.value}</div>
            <div class="text-muted text-xs" style="margin-top:4px">${s.sub}</div>
          </div>
        `).join('')}
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab${adminTab==='overview'?' active':''}" data-atab="overview">System Overview</button>
        <button class="tab${adminTab==='users'?' active':''}" data-atab="users">User Management</button>
        <button class="tab${adminTab==='audit'?' active':''}" data-atab="audit">Audit Log (${logs.length})</button>
      </div>

      <!-- Overview tab -->
      ${adminTab==='overview'?`
        <div class="grid-2">
          <!-- Inventory health -->
          <div class="card card-p">
            <div class="font-semibold mb-4" style="display:flex;align-items:center;gap:8px">
              <i data-lucide="package" style="width:16px;height:16px;color:var(--brand)"></i>
              Inventory Health
            </div>
            <div class="space-y-sm">
              ${[
                {label:'Healthy',count:inv.filter(i=>{const s=require_stockStatus(i);return s.color==='green'}).length,color:'#10b981',total:invStats.total},
                {label:'Low Stock',count:invStats.low,color:'#f59e0b',total:invStats.total},
                {label:'Critical',count:invStats.critical,color:'#ef4444',total:invStats.total},
                {label:'Overstock',count:inv.filter(i=>{const s=require_stockStatus(i);return s.color==='blue'}).length,color:'#3b82f6',total:invStats.total},
              ].map(r=>`
                <div style="display:flex;align-items:center;gap:10px">
                  <span style="width:70px;font-size:12px;color:var(--muted)">${r.label}</span>
                  <div style="flex:1;height:6px;background:var(--surface2);border-radius:99px;overflow:hidden">
                    <div style="height:100%;width:${invStats.total?Math.round(r.count/invStats.total*100):0}%;background:${r.color};border-radius:99px"></div>
                  </div>
                  <span style="font-weight:600;font-size:13px;width:20px;text-align:right">${r.count}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Users by role -->
          <div class="card card-p">
            <div class="font-semibold mb-4" style="display:flex;align-items:center;gap:8px">
              <i data-lucide="users" style="width:16px;height:16px;color:#8b5cf6"></i>
              Users by Role
            </div>
            <div class="space-y-sm">
              ${[
                {role:'Admin',count:users.filter(u=>u.role==='admin').length,color:'#8b5cf6',icon:'shield'},
                {role:'Manager',count:users.filter(u=>u.role==='manager').length,color:'#3b82f6',icon:'briefcase'},
                {role:'User',count:users.filter(u=>u.role==='user').length,color:'#94a3b8',icon:'user'},
              ].map(r=>`
                <div style="display:flex;align-items:center;gap:10px">
                  <div style="width:28px;height:28px;border-radius:7px;background:${r.color}20;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <i data-lucide="${r.icon}" style="width:13px;height:13px;color:${r.color}"></i>
                  </div>
                  <span style="flex:1;font-size:13px">${r.role}</span>
                  <span style="font-weight:700;font-size:16px">${r.count}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Recent activity -->
        <div class="card" style="overflow:hidden">
          <div class="card-p" style="border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
            <div style="font-weight:600;display:flex;align-items:center;gap:8px">
              <i data-lucide="activity" style="width:16px;height:16px;color:#3b82f6"></i>
              Recent Activity
            </div>
            <span class="text-muted text-xs">${logStats.today} events today</span>
          </div>
          ${logs.slice(0,10).map(l=>`
            <div style="padding:12px 20px;border-top:1px solid var(--border);display:flex;align-items:flex-start;gap:12px">
              <div style="width:30px;height:30px;border-radius:8px;background:${(LOG_COLORS[l.type]||'#94a3b8')}20;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                <i data-lucide="${LOG_ICONS[l.type]||'circle'}" style="width:13px;height:13px;color:${LOG_COLORS[l.type]||'#94a3b8'}"></i>
              </div>
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:500">${l.message}</div>
                <div class="text-muted text-xs" style="margin-top:2px">${new Date(l.ts).toLocaleString('en-IN')}</div>
              </div>
              <span class="badge ${l.role==='admin'?'':'badge-blue'}" style="${l.role==='admin'?'background:rgba(139,92,246,.15);color:#a78bfa':''}">
                ${l.role}
              </span>
            </div>
          `).join('')}
          ${logs.length===0?`<div style="padding:40px;text-align:center;color:var(--muted)">No activity recorded yet</div>`:''}
        </div>
      `:''}

      <!-- Users tab -->
      ${adminTab==='users'?`
        <div class="space-y">
          <div class="flex gap-3" style="flex-wrap:wrap;align-items:center">
            <div style="position:relative;flex:1;min-width:200px;max-width:320px">
              <i data-lucide="search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--muted)"></i>
              <input class="input" id="user-search" placeholder="Search name, email, role…" value="${userSearch}" style="padding-left:32px">
            </div>
            <button class="btn" id="btn-add-user" style="background:#8b5cf6;color:white;margin-left:auto">
              <i data-lucide="user-plus" style="width:15px;height:15px"></i> Add User
            </button>
          </div>

          <div class="card" style="overflow:hidden">
            <div style="overflow-x:auto">
              <table>
                <thead>
                  <tr>
                    <th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th style="text-align:right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredUsers.map(u=>`
                    <tr>
                      <td>
                        <div class="flex items-center gap-3">
                          <div style="width:34px;height:34px;border-radius:50%;background:${u.role==='admin'?'rgba(139,92,246,.2)':u.role==='manager'?'rgba(59,130,246,.2)':'rgba(148,163,184,.15)'};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:${u.role==='admin'?'#a78bfa':u.role==='manager'?'#60a5fa':'#94a3b8'};flex-shrink:0">
                            ${u.name[0].toUpperCase()}
                          </div>
                          <div>
                            <div style="font-weight:500">${u.name}</div>
                            ${u.id===auth.user()?.id?`<span style="font-size:10px;color:var(--brand)">(you)</span>`:''}
                          </div>
                        </div>
                      </td>
                      <td class="font-mono text-muted text-xs">${u.email}</td>
                      <td>${ROLE_BADGE[u.role]||u.role}</td>
                      <td>
                        <span class="badge ${u.active?'badge-green':'badge-red'}">${u.active?'Active':'Disabled'}</span>
                      </td>
                      <td class="text-muted text-xs">${u.createdAt||'—'}</td>
                      <td>
                        <div class="flex gap-1" style="justify-content:flex-end">
                          <button class="row-action-btn" data-uaction="edit" data-uid="${u.id}" title="Edit user">
                            <i data-lucide="pencil" style="width:14px;height:14px"></i>
                          </button>
                          <button class="row-action-btn" data-uaction="toggle" data-uid="${u.id}" title="${u.active?'Disable':'Enable'} user" ${u.id===auth.user()?.id?'disabled style="opacity:.3"':''}>
                            <i data-lucide="${u.active?'toggle-right':'toggle-left'}" style="width:14px;height:14px;color:${u.active?'#34d399':'#94a3b8'}"></i>
                          </button>
                          <button class="row-action-btn row-action-danger" data-uaction="delete" data-uid="${u.id}" title="Delete user" ${u.id===auth.user()?.id?'disabled style="opacity:.3"':''}>
                            <i data-lucide="trash-2" style="width:14px;height:14px"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <div style="padding:10px 16px;border-top:1px solid var(--border);font-size:11px;color:var(--muted)">
              ${filteredUsers.length} of ${users.length} users · ${users.filter(u=>u.active).length} active
            </div>
          </div>
        </div>
      `:''}

      <!-- Audit log tab -->
      ${adminTab==='audit'?`
        <div class="space-y">
          <div class="flex gap-3" style="flex-wrap:wrap;align-items:center">
            <div class="text-muted text-sm">${logStats.today} events today · ${logs.length} total</div>
            <button class="btn btn-secondary" id="btn-clear-audit" style="margin-left:auto;font-size:12px;color:var(--red);border-color:rgba(239,68,68,.3)">
              <i data-lucide="trash-2" style="width:13px;height:13px"></i> Clear Log
            </button>
          </div>
          ${logs.length===0?`
            <div class="card empty-state">
              <div class="empty-icon"><i data-lucide="clipboard" style="width:24px;height:24px;color:var(--muted)"></i></div>
              <p style="font-weight:600;margin-bottom:4px">Audit log is empty</p>
              <p class="text-muted text-sm">Actions will be logged as they happen.</p>
            </div>
          `:`
            <div class="card" style="overflow:hidden">
              <div style="overflow-x:auto">
                <table>
                  <thead><tr><th>Event</th><th>Message</th><th>Role</th><th>Timestamp</th></tr></thead>
                  <tbody>
                    ${logs.map(l=>`
                      <tr>
                        <td>
                          <div class="flex items-center gap-2">
                            <i data-lucide="${LOG_ICONS[l.type]||'circle'}" style="width:14px;height:14px;color:${LOG_COLORS[l.type]||'#94a3b8'};flex-shrink:0"></i>
                            <span class="font-mono text-xs" style="color:${LOG_COLORS[l.type]||'#94a3b8'}">${l.type}</span>
                          </div>
                        </td>
                        <td style="font-size:13px">${l.message}</td>
                        <td><span class="badge ${l.role==='admin'?'':'badge-blue'}" style="${l.role==='admin'?'background:rgba(139,92,246,.15);color:#a78bfa':''}">${l.role}</span></td>
                        <td class="text-muted text-xs font-mono">${new Date(l.ts).toLocaleString('en-IN')}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          `}
        </div>
      `:''}
    </div>
  `

  renderLayout('admin', content)

  document.querySelectorAll('.tab[data-atab]').forEach(t => {
    t.addEventListener('click', () => { adminTab=t.dataset.atab; renderAdmin() })
  })
  document.getElementById('user-search')?.addEventListener('input', e => { userSearch=e.target.value; renderAdmin() })
  document.getElementById('btn-add-user')?.addEventListener('click', () => showUserModal('add'))
  document.getElementById('btn-clear-audit')?.addEventListener('click', () => {
    if(confirm('Clear the entire audit log?')) { localStorage.removeItem('retailpulse-audit'); renderAdmin() }
  })

  document.querySelectorAll('[data-uaction]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.uid
      const u = userManager.getAll().find(x=>x.id===id)
      if(!u) return
      if(btn.dataset.uaction==='edit')   showUserModal('edit', u)
      if(btn.dataset.uaction==='toggle') { userManager.toggleActive(id); renderAdmin() }
      if(btn.dataset.uaction==='delete') {
        if(confirm(`Delete user "${u.name}"? This cannot be undone.`)) { userManager.delete(id); renderAdmin() }
      }
    })
  })
}

// Helper to avoid import loop - reuse stockStatus logic inline
function require_stockStatus(i) {
  const cur=i.current_stock, rp=i.reorder_point, max=i.max_stock
  if(cur===0) return {color:'red'}
  const pct=Math.round(cur/max*100)
  if(cur<=rp/2) return {color:'red'}
  if(cur<=rp) return {color:'yellow'}
  if(pct>90) return {color:'blue'}
  return {color:'green'}
}
