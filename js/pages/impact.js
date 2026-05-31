import { renderLayout } from '../components/layout.js'
import { impactBarChart } from '../components/charts.js'
import { MOCK, fmtN } from '../lib/data.js'

let eventType = 'diwali'
let results = null
let loading = false

const EVENTS = [
  {value:'diwali',label:'🪔 Diwali',type:'festival'},
  {value:'eid',label:'🌙 Eid',type:'festival'},
  {value:'christmas',label:'🎄 Christmas',type:'festival'},
  {value:'new_year',label:'🎆 New Year',type:'festival'},
  {value:'summer',label:'☀️ Summer Season',type:'weather'},
  {value:'monsoon',label:'🌧️ Monsoon',type:'weather'},
  {value:'heatwave',label:'🌡️ Heatwave',type:'weather'},
  {value:'heavy_rain',label:'⛈️ Heavy Rain',type:'weather'},
]

function getDate(offset) {
  const d=new Date(); d.setDate(d.getDate()+offset); return d.toISOString().split('T')[0]
}

export function renderImpact() {
  const content = `
    <div class="space-y">
      <!-- Config card -->
      <div class="card card-p">
        <div class="font-semibold mb-4">Configure Scenario</div>
        <div class="space-y-sm">
          <!-- Events -->
          <div>
            <div class="text-muted text-xs mb-2">Event / Season</div>
            <div style="display:flex;flex-wrap:wrap;gap:8px" id="event-chips">
              ${EVENTS.map(e=>`
                <button class="impact-chip${e.value===eventType?' active':''}" data-ev="${e.value}">${e.label}</button>
              `).join('')}
            </div>
          </div>

          <!-- Dates -->
          <div class="grid-2" style="gap:12px;margin-top:12px">
            <div>
              <label class="text-muted text-xs" style="display:block;margin-bottom:6px">Start Date</label>
              <input type="date" class="input" id="start-date" value="${getDate(7)}">
            </div>
            <div>
              <label class="text-muted text-xs" style="display:block;margin-bottom:6px">End Date</label>
              <input type="date" class="input" id="end-date" value="${getDate(14)}">
            </div>
          </div>

          <button class="btn btn-primary" id="run-btn" style="margin-top:8px">
            <i data-lucide="zap" style="width:15px;height:15px"></i>
            Run Analysis
          </button>
        </div>
      </div>

      <!-- Results or placeholder -->
      <div id="results-area">
        ${results ? renderResults() : `
          <div class="card empty-state">
            <div class="empty-icon">
              <i data-lucide="bar-chart-2" style="width:28px;height:28px;color:var(--border)"></i>
            </div>
            <p style="font-weight:600;margin-bottom:4px">Configure & run a scenario</p>
            <p class="text-muted text-sm">Select an event type, date range, and click Run Analysis</p>
          </div>
        `}
      </div>
    </div>
  `

  renderLayout('impact', content)

  document.querySelectorAll('.impact-chip').forEach(btn=>{
    btn.addEventListener('click', ()=>{ eventType=btn.dataset.ev; renderImpact() })
  })

  document.getElementById('run-btn').addEventListener('click', ()=>{
    const btn = document.getElementById('run-btn')
    btn.disabled=true
    btn.innerHTML='<i data-lucide="loader-2" style="width:15px;height:15px;animation:spin 1s linear infinite"></i> Analyzing…'
    lucide.createIcons()
    setTimeout(()=>{
      results = MOCK.impactResults[eventType] || MOCK.impactResults.diwali
      renderImpact()
    }, 900)
  })

  if (results) {
    impactBarChart('impact-bar-chart', results)
  }
}

function renderResults() {
  const r = results
  return `
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>

    <!-- Summary cards -->
    <div class="health-grid" style="grid-template-columns:repeat(3,1fr)">
      ${[
        {label:'Products Analyzed',value:r.length,icon:'package',color:'var(--brand)'},
        {label:'Avg Uplift',value:Math.round(r.reduce((s,x)=>s+x.uplift_pct,0)/r.length)+'%',icon:'trending-up',color:'#34d399'},
        {label:'High Impact Items',value:r.filter(x=>x.uplift_pct>50).length,icon:'zap',color:'#f59e0b'},
      ].map(c=>`
        <div class="card p-4 flex items-center gap-3">
          <i data-lucide="${c.icon}" style="width:20px;height:20px;color:${c.color};flex-shrink:0"></i>
          <div>
            <div class="text-muted text-xs">${c.label}</div>
            <div style="font-size:22px;font-weight:700">${c.value}</div>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Bar chart -->
    <div class="card card-p">
      <div class="font-semibold mb-1">Baseline vs Projected Demand</div>
      <div class="text-muted text-sm mb-4">Daily average units — ${EVENTS.find(e=>e.value===eventType)?.label}</div>
      <div class="chart-wrap" style="height:280px">
        <canvas id="impact-bar-chart"></canvas>
      </div>
    </div>

    <!-- Table -->
    <div class="card" style="overflow:hidden">
      <div class="card-p" style="border-bottom:1px solid var(--border)">
        <div class="font-semibold">Product-Level Impact & Recommendations</div>
      </div>
      <div>
        ${r.map(item=>`
          <div style="padding:14px 20px;border-top:1px solid var(--border);display:flex;flex-wrap:wrap;align-items:center;gap:12px" class="hover-row">
            <div style="flex:1;min-width:180px">
              <div style="font-weight:500">${item.product_name}</div>
              <div class="text-muted text-xs">${item.category}</div>
            </div>
            <div class="flex gap-4">
              <div style="text-align:center">
                <div class="text-muted text-xs mb-1">Baseline</div>
                <div class="font-semibold">${fmtN(Math.round(item.baseline_demand))}/day</div>
              </div>
              <div style="text-align:center">
                <div class="text-muted text-xs mb-1">Projected</div>
                <div class="font-semibold text-brand">${fmtN(Math.round(item.projected_demand))}/day</div>
              </div>
              <div style="text-align:center">
                <div class="text-muted text-xs mb-1">Uplift</div>
                <div style="font-weight:600;color:${item.uplift_pct>0?'#34d399':'#f87171'};display:flex;align-items:center;gap:3px">
                  <i data-lucide="${item.uplift_pct>0?'trending-up':'trending-down'}" style="width:13px;height:13px"></i>
                  ${item.uplift_pct>0?'+':''}${item.uplift_pct}%
                </div>
              </div>
            </div>
            <div style="flex:1;min-width:200px;font-size:12px;color:var(--muted);font-style:italic">${item.recommendation}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `
}
