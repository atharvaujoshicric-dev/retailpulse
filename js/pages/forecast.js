import { renderLayout } from '../components/layout.js'
import { forecastChart } from '../components/charts.js'
import { MOCK, fmt, fmtN, downloadCSV } from '../lib/data.js'

let selProductId = MOCK.products[0].id
let horizon = 30

export function renderForecast() {
  const products = MOCK.products
  const accuracy = MOCK.forecastAccuracy
  const selProduct = products.find(p=>p.id===selProductId) || products[0]
  const points = MOCK.forecastPoints(horizon)
  const totalUnits = points.reduce((s,p)=>s+p.predicted,0)
  const totalRev = totalUnits * selProduct.unit_price

  const summaryCards = [
    { label:'Total Predicted Units', value:fmtN(Math.round(totalUnits)), sub:`over ${horizon} days` },
    { label:'Avg Daily Demand', value:fmtN(Math.round(totalUnits/horizon)), sub:'units/day' },
    { label:'Projected Revenue', value:fmt(totalRev), sub:`at ₹${selProduct.unit_price}/unit` },
    { label:'Model Confidence', value:`${points[0]?.confidence||80}%`, sub:'prophet-v1' },
  ]

  const HORIZONS = [{label:'7 Days',value:7},{label:'30 Days',value:30},{label:'60 Days',value:60},{label:'90 Days',value:90}]

  const content = `
    <div class="space-y">
      <!-- Controls -->
      <div class="flex gap-3" style="flex-wrap:wrap;align-items:center">
        <div style="position:relative;flex:1;min-width:200px;max-width:280px">
          <select class="input" id="product-sel" style="appearance:none;padding-right:32px">
            ${products.map(p=>`<option value="${p.id}"${p.id===selProductId?' selected':''}>${p.name}</option>`).join('')}
          </select>
          <i data-lucide="chevron-down" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--muted);pointer-events:none"></i>
        </div>

        <div class="pills" id="horizon-pills">
          ${HORIZONS.map(h=>`<button class="pill${h.value===horizon?' active':''}" data-h="${h.value}">${h.label}</button>`).join('')}
        </div>

        <button class="btn btn-secondary" id="exp-forecast">
          <i data-lucide="download" style="width:14px;height:14px"></i> Export CSV
        </button>
      </div>

      <!-- Summary cards -->
      <div class="kpi-grid" style="grid-template-columns:repeat(2,1fr)">
        ${summaryCards.map(c=>`
          <div class="card card-p">
            <div class="text-muted text-sm mb-1">${c.label}</div>
            <div class="kpi-value">${c.value}</div>
            <div class="text-muted text-xs mt-1">${c.sub}</div>
          </div>
        `).join('')}
      </div>

      <!-- Forecast Chart -->
      <div class="card card-p">
        <div class="flex items-center justify-between mb-4" style="flex-wrap:wrap;gap:8px">
          <div>
            <div class="font-semibold">${selProduct.name}</div>
            <div class="text-muted text-sm mt-1">${horizon}-day demand forecast · Prophet model · 80% CI</div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;font-size:11px;color:var(--muted)">
            <span style="display:flex;align-items:center;gap:6px">
              <span style="width:16px;height:2px;background:#3b82f6;display:inline-block;border-radius:2px"></span> Predicted
            </span>
            <span style="display:flex;align-items:center;gap:6px">
              <span style="width:16px;height:12px;background:rgba(59,130,246,.15);display:inline-block;border-radius:3px"></span> Confidence Band
            </span>
          </div>
        </div>
        <div class="chart-wrap" style="height:300px">
          <canvas id="forecast-chart"></canvas>
        </div>
      </div>

      <!-- Table -->
      <div class="card" style="overflow:hidden">
        <div class="card-p" style="border-bottom:1px solid var(--border)">
          <div class="font-semibold">Detailed Forecast</div>
        </div>
        <div style="overflow-x:auto">
          <table>
            <thead>
              <tr><th>Date</th><th>Predicted (units)</th><th>Lower</th><th>Upper</th><th>Revenue Est.</th></tr>
            </thead>
            <tbody>
              ${points.map(p=>`
                <tr>
                  <td class="font-mono text-muted">${p.date}</td>
                  <td class="font-semibold">${p.predicted}</td>
                  <td class="text-muted">${p.lower}</td>
                  <td class="text-muted">${p.upper}</td>
                  <td style="color:#34d399;font-weight:600">${fmt(p.predicted*selProduct.unit_price)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Accuracy -->
      <div class="card card-p">
        <div class="flex items-center justify-between mb-4">
          <div>
            <div class="font-semibold">Forecast Accuracy</div>
            <div class="text-muted text-sm mt-1">Model performance by category</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:28px;font-weight:700;color:var(--brand)">${accuracy.overall_accuracy}%</div>
            <div class="text-muted text-xs">Overall accuracy</div>
          </div>
        </div>
        <div class="space-y-sm">
          ${accuracy.by_category.map(c=>`
            <div class="acc-row">
              <span class="acc-label">${c.category}</span>
              <div class="progress-bar flex-1"><div class="progress-fill" style="width:${c.accuracy}%;background:var(--brand)"></div></div>
              <span class="acc-val text-brand">${c.accuracy}%</span>
              <span class="acc-mape">MAPE ${c.mape}%</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `

  renderLayout('forecast', content)
  forecastChart('forecast-chart', points)

  document.getElementById('product-sel').addEventListener('change', e => {
    selProductId = e.target.value; renderForecast()
  })
  document.querySelectorAll('#horizon-pills .pill').forEach(btn => {
    btn.addEventListener('click', () => { horizon = +btn.dataset.h; renderForecast() })
  })
  document.getElementById('exp-forecast').addEventListener('click', () =>
    downloadCSV(points, `forecast-${selProduct.name}-${horizon}d.csv`)
  )
}
