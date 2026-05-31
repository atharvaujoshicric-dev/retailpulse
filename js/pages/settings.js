import { renderLayout } from '../components/layout.js'
import { auth, theme } from '../lib/store.js'

let form = {
  name:'Alex Morgan', email:'admin@retailpulse.ai',
  notifications:true, lowStockAlerts:true, forecastEmails:false,
  forecastHorizon:'30', currency:'INR', timezone:'Asia/Kolkata'
}
let saved = false

export function renderSettings() {
  const user = auth.user()
  if(user) { form.name=user.name; form.email=user.email }
  const isDark = theme.get() === 'dark'

  const Toggle = (id, label, desc, val) => `
    <div class="toggle-row">
      <div>
        <div style="font-size:13px;font-weight:500">${label}</div>
        ${desc?`<div class="text-muted text-xs mt-1">${desc}</div>`:''}
      </div>
      <button class="toggle-btn${val?' on':''}" data-toggle="${id}">
        <div class="toggle-knob"></div>
      </button>
    </div>
  `

  const Section = (title, icon, inner) => `
    <div class="card card-p">
      <div class="settings-section-header">
        <i data-lucide="${icon}" style="width:18px;height:18px"></i>
        ${title}
      </div>
      ${inner}
    </div>
  `

  const content = `
    <div style="max-width:640px" class="space-y">
      ${Section('Profile','user',`
        <div class="grid-2">
          <div>
            <label class="text-muted text-xs" style="display:block;margin-bottom:6px">Full Name</label>
            <input class="input" id="inp-name" value="${form.name}">
          </div>
          <div>
            <label class="text-muted text-xs" style="display:block;margin-bottom:6px">Email</label>
            <input class="input" type="email" id="inp-email" value="${form.email}">
          </div>
        </div>
      `)}

      ${Section('Appearance','sun',`
        <div style="display:flex;gap:12px">
          ${['dark','light'].map(t=>`
            <button class="card p-4 flex items-center gap-3" id="theme-${t}"
              style="flex:1;cursor:pointer;border:none;${isDark===t==='dark'?'box-shadow:0 0 0 2px var(--brand)':''};background:${t==='dark'?'#111218':'#f8fafc'}">
              <i data-lucide="${t==='dark'?'moon':'sun'}" style="width:20px;height:20px;color:${isDark===t==='dark'?'var(--brand)':'var(--muted)'}"></i>
              <span style="font-size:13px;font-weight:500;color:${isDark===t==='dark'?'var(--brand)':'var(--muted)'}">${t==='dark'?'Dark':'Light'}</span>
            </button>
          `).join('')}
        </div>
      `)}

      ${Section('Notifications','bell',`
        <div class="space-y-sm">
          ${Toggle('lowStockAlerts','Low Stock Alerts','Get notified when products fall below reorder point',form.lowStockAlerts)}
          ${Toggle('forecastEmails','Forecast Emails','Receive weekly forecast reports via email',form.forecastEmails)}
          ${Toggle('notifications','Demand Spike Alerts','Get notified of unusual demand patterns',form.notifications)}
        </div>
      `)}

      ${Section('Preferences','database',`
        <div class="grid-2">
          <div>
            <label class="text-muted text-xs" style="display:block;margin-bottom:6px">Default Forecast Horizon</label>
            <select class="input" id="sel-horizon">
              ${['7','30','60','90'].map(v=>`<option value="${v}"${form.forecastHorizon===v?' selected':''}>${v} Days</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="text-muted text-xs" style="display:block;margin-bottom:6px">Currency</label>
            <select class="input" id="sel-currency">
              ${[['INR','INR (₹)'],['USD','USD ($)'],['EUR','EUR (€)'],['GBP','GBP (£)']].map(([v,l])=>`<option value="${v}"${form.currency===v?' selected':''}>${l}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="text-muted text-xs" style="display:block;margin-bottom:6px">Timezone</label>
            <select class="input" id="sel-tz">
              ${[['Asia/Kolkata','Asia/Kolkata (IST)'],['America/New_York','America/New_York (EST)'],['Europe/London','Europe/London (GMT)'],['Asia/Singapore','Asia/Singapore (SGT)']].map(([v,l])=>`<option value="${v}"${form.timezone===v?' selected':''}>${l}</option>`).join('')}
            </select>
          </div>
        </div>
      `)}

      ${Section('Security','shield',`
        <div class="space-y-sm">
          <div>
            <label class="text-muted text-xs" style="display:block;margin-bottom:6px">Current Password</label>
            <input type="password" class="input" placeholder="••••••••">
          </div>
          <div class="grid-2">
            <div>
              <label class="text-muted text-xs" style="display:block;margin-bottom:6px">New Password</label>
              <input type="password" class="input" placeholder="••••••••">
            </div>
            <div>
              <label class="text-muted text-xs" style="display:block;margin-bottom:6px">Confirm Password</label>
              <input type="password" class="input" placeholder="••••••••">
            </div>
          </div>
        </div>
      `)}

      <div style="display:flex;justify-content:flex-end">
        <button class="btn btn-primary" id="save-btn" style="padding:9px 24px">
          <i data-lucide="${saved?'check':'save'}" style="width:16px;height:16px"></i>
          ${saved?'Saved!':'Save Changes'}
        </button>
      </div>
    </div>
  `

  renderLayout('settings', content)

  // Toggles
  document.querySelectorAll('[data-toggle]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const k=btn.dataset.toggle
      form[k]=!form[k]
      btn.classList.toggle('on', form[k])
    })
  })

  // Theme buttons
  document.getElementById('theme-dark')?.addEventListener('click', ()=>{ theme.apply('dark'); renderSettings() })
  document.getElementById('theme-light')?.addEventListener('click', ()=>{ theme.apply('light'); renderSettings() })

  // Selects
  document.getElementById('sel-horizon')?.addEventListener('change', e=>form.forecastHorizon=e.target.value)
  document.getElementById('sel-currency')?.addEventListener('change', e=>form.currency=e.target.value)
  document.getElementById('sel-tz')?.addEventListener('change', e=>form.timezone=e.target.value)

  // Save
  document.getElementById('save-btn')?.addEventListener('click', ()=>{
    form.name=document.getElementById('inp-name').value
    form.email=document.getElementById('inp-email').value
    saved=true
    renderSettings()
    setTimeout(()=>{ saved=false }, 2000)
  })
}
