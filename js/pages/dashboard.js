import { renderLayout } from '../components/layout.js'
import { revenueChart, categoryBarChart, donutChart } from '../components/charts.js'
import { MOCK, fmt, fmtN, fmtPct, downloadCSV } from '../lib/data.js'

let days = 30

export function renderDashboard() {
  const kpis = MOCK.kpis
  const revenue = MOCK.revenueTrend(days)
  const top = MOCK.topProducts
  const cats = MOCK.categoryBreakdown
  const alerts = MOCK.alerts

  const kpiCards = [
    { title:'Revenue', value:fmt(kpis.total_revenue), change:kpis.revenue_change, icon:'dollar-sign', color:'#14b8a6' },
    { title:'Orders', value:fmtN(kpis.total_orders), change:kpis.orders_change, icon:'shopping-cart', color:'#3b82f6' },
    { title:'Avg. Order', value:fmt(kpis.avg_order_value), change:kpis.aov_change, icon:'bar-chart-2', color:'#8b5cf6' },
    { title:'Products', value:kpis.active_products, icon:'package', color:'#f59e0b' },
    { title:'Low Stock', value:kpis.low_stock_count, icon:'alert-triangle', color:'#ef4444' },
    { title:'Forecast Acc.', value:kpis.forecast_accuracy+'%', icon:'target', color:'#14b8a6' },
  ]

  const content = `
    <div class="space-y">
      <!-- Period selector -->
      <div class="flex items-center justify-between">
        <p class="text-muted text-sm">Showing last <strong style="color:var(--text)">${days} days</strong></p>
        <div class="pills" id="period-pills">
          ${[7,30,90].map(d=>`<button class="pill${d===days?' active':''}" data-days="${d}">${d}D</button>`).join('')}
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        ${kpiCards.map(k=>`
          <div class="card kpi-card">
            <div class="kpi-header">
              <span class="kpi-title">${k.title}</span>
              <div class="kpi-icon" style="background:${k.color}20;color:${k.color}">
                <i data-lucide="${k.icon}" style="width:18px;height:18px"></i>
              </div>
            </div>
            <div class="kpi-value">${k.value}</div>
            ${k.change!==undefined ? `
            <div class="kpi-change ${k.change>=0?'up':'down'}">
              <i data-lucide="${k.change>=0?'trending-up':'trending-down'}" style="width:13px;height:13px"></i>
              ${fmtPct(k.change)} vs last month
            </div>` : ''}
          </div>
        `).join('')}
      </div>

      <!-- Revenue Trend -->
      <div class="card card-p">
        <div class="flex items-center justify-between mb-4">
          <div>
            <div class="font-semibold">Revenue Trend</div>
            <div class="text-muted text-sm mt-1">Daily revenue for last ${days} days</div>
          </div>
          <button class="btn btn-secondary" id="exp-revenue" style="font-size:12px">
            <i data-lucide="download" style="width:13px;height:13px"></i> Export
          </button>
        </div>
        <div class="chart-wrap" style="height:260px">
          <canvas id="revenue-chart"></canvas>
        </div>
      </div>

      <!-- Top Products + Donut -->
      <div class="grid-5">
        <div class="card card-p">
          <div class="flex items-center justify-between mb-4">
            <div class="font-semibold">Top Products</div>
            <button class="btn btn-secondary" id="exp-top" style="font-size:12px">
              <i data-lucide="download" style="width:13px;height:13px"></i> Export
            </button>
          </div>
          <div>
            ${top.map((p,i)=>`
              <div style="display:flex;align-items:center;gap:12px;padding:10px;border-radius:8px" class="hover-row">
                <div style="width:28px;height:28px;border-radius:8px;background:rgba(20,184,166,.12);color:#14b8a6;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">${i+1}</div>
                <div style="flex:1;min-width:0">
                  <div class="truncate" style="font-size:13px;font-weight:500">${p.name}</div>
                  <div class="text-muted" style="font-size:11px">${p.category} · ${fmtN(p.total_quantity)} units</div>
                </div>
                <div style="text-align:right;flex-shrink:0">
                  <div style="font-size:13px;font-weight:600">${fmt(p.total_revenue)}</div>
                  <div style="font-size:11px;color:${p.growth>=0?'#34d399':'#f87171'};display:flex;align-items:center;gap:2px;justify-content:flex-end">
                    <i data-lucide="${p.growth>=0?'trending-up':'trending-down'}" style="width:11px;height:11px"></i>
                    ${fmtPct(p.growth)}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="card card-p">
          <div class="font-semibold mb-1">Category Mix</div>
          <div class="text-muted text-sm mb-4">Revenue by category</div>
          <div class="chart-wrap" style="height:220px">
            <canvas id="donut-chart"></canvas>
          </div>
        </div>
      </div>

      <!-- Category Bar -->
      <div class="card card-p">
        <div class="font-semibold mb-1">Revenue by Category</div>
        <div class="text-muted text-sm mb-4">Comparison across all product categories</div>
        <div class="chart-wrap" style="height:240px">
          <canvas id="cat-chart"></canvas>
        </div>
      </div>
    </div>
  `

  renderLayout('dashboard', content, alerts.filter(a=>!a.is_read).length)

  // Init charts
  revenueChart('revenue-chart', revenue)
  donutChart('donut-chart', cats)
  categoryBarChart('cat-chart', cats)

  // Events
  document.querySelectorAll('#period-pills .pill').forEach(btn => {
    btn.addEventListener('click', () => {
      days = +btn.dataset.days
      renderDashboard()
    })
  })

  document.getElementById('exp-revenue')?.addEventListener('click', () => downloadCSV(revenue,'revenue-trend.csv'))
  document.getElementById('exp-top')?.addEventListener('click', () => downloadCSV(top,'top-products.csv'))

  // hover row style
  document.querySelectorAll('.hover-row').forEach(r => {
    r.addEventListener('mouseenter', () => r.style.background='var(--surface2)')
    r.addEventListener('mouseleave', () => r.style.background='')
  })
}
