import { renderLayout } from '../components/layout.js'
import { MOCK, fmt, downloadCSV, CAT_COLORS } from '../lib/data.js'

let search = ''
let selCat = ''
let sortKey = 'name'
let sortDir = 'asc'

export function renderProducts() {
  const products = MOCK.products
  const cats = [...new Set(products.map(p=>p.category))].sort()

  const filtered = products
    .filter(p=>{
      const q=search.toLowerCase()
      return (p.name.toLowerCase().includes(q)||p.sku.toLowerCase().includes(q)||(p.supplier||'').toLowerCase().includes(q))
        && (!selCat||p.category===selCat)
    })
    .sort((a,b)=>{
      const av=a[sortKey]??'', bv=b[sortKey]??''
      return sortDir==='asc'?(av>bv?1:-1):(av<bv?1:-1)
    })

  const margin = p => Math.round((p.unit_price-p.cost_price)/p.unit_price*100)

  const sortArrow = k => sortKey===k?(sortDir==='asc'?'▲':'▼'):'▲'
  const SORT_KEYS = ['name','category','unit_price','cost_price']

  const content = `
    <div class="space-y">
      <!-- Toolbar -->
      <div class="flex gap-3" style="flex-wrap:wrap;align-items:center">
        <div style="position:relative;flex:1;min-width:180px;max-width:300px">
          <i data-lucide="search" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--muted)"></i>
          <input class="input" id="prod-search" placeholder="Search name, SKU, supplier…" value="${search}" style="padding-left:32px">
        </div>
        <select class="input" id="cat-filter" style="width:auto;min-width:140px">
          <option value="">All Categories</option>
          ${cats.map(c=>`<option value="${c}"${c===selCat?' selected':''}>${c}</option>`).join('')}
        </select>
        <button class="btn btn-secondary" id="exp-prod" style="font-size:12px">
          <i data-lucide="download" style="width:13px;height:13px"></i> Export
        </button>
      </div>

      <!-- Category strip -->
      <div class="cat-grid">
        ${cats.slice(0,6).map(c=>`
          <button class="card cat-btn${c===selCat?' selected':''}" data-cat="${c}">
            <div class="cat-dot" style="background:${CAT_COLORS[c]||'#94a3b8'}"></div>
            <div class="text-muted" style="font-size:11px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c}</div>
            <div style="font-size:20px;font-weight:700">${products.filter(p=>p.category===c).length}</div>
          </button>
        `).join('')}
      </div>

      <!-- Table -->
      <div class="card" style="overflow:hidden">
        <div style="overflow-x:auto">
          <table>
            <thead>
              <tr style="background:var(--surface2)">
                <th>SKU</th>
                ${['name','category','unit_price','cost_price'].map(k=>`
                  <th style="cursor:pointer;user-select:none" data-sort="${k}">
                    ${{name:'Product',category:'Category',unit_price:'Price',cost_price:'Cost'}[k]}
                    ${SORT_KEYS.includes(k)?`<span style="opacity:.5;font-size:9px;margin-left:3px">${sortArrow(k)}</span>`:''}
                  </th>
                `).join('')}
                <th>Margin</th>
                <th>Supplier</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(p=>{
                const m=margin(p)
                return `
                  <tr>
                    <td class="font-mono text-muted text-xs">${p.sku}</td>
                    <td>
                      <div class="flex items-center gap-2">
                        <div style="width:28px;height:28px;border-radius:8px;background:${(CAT_COLORS[p.category]||'#94a3b8')}20;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                          <i data-lucide="package" style="width:13px;height:13px;color:${CAT_COLORS[p.category]||'#94a3b8'}"></i>
                        </div>
                        <span style="font-weight:500">${p.name}</span>
                      </div>
                    </td>
                    <td><span class="badge badge-blue">${p.category}</span></td>
                    <td class="font-semibold">${fmt(p.unit_price)}</td>
                    <td class="text-muted">${fmt(p.cost_price)}</td>
                    <td style="font-weight:600;color:${m>30?'#34d399':m>20?'#fbbf24':'#f87171'}">${m}%</td>
                    <td class="text-muted text-xs">${p.supplier||'—'}</td>
                  </tr>
                `
              }).join('')}
              ${filtered.length===0?`<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--muted)">No products match your search</td></tr>`:''}
            </tbody>
          </table>
        </div>
        <div style="padding:10px 16px;border-top:1px solid var(--border);font-size:11px;color:var(--muted)">
          Showing ${filtered.length} of ${products.length} products
        </div>
      </div>
    </div>
  `

  renderLayout('products', content)

  document.getElementById('prod-search').addEventListener('input', e=>{ search=e.target.value; renderProducts() })
  document.getElementById('cat-filter').addEventListener('change', e=>{ selCat=e.target.value; renderProducts() })
  document.querySelectorAll('[data-sort]').forEach(th=>{
    th.addEventListener('click', ()=>{
      if(sortKey===th.dataset.sort) sortDir=sortDir==='asc'?'desc':'asc'
      else { sortKey=th.dataset.sort; sortDir='asc' }
      renderProducts()
    })
  })
  document.querySelectorAll('.cat-btn[data-cat]').forEach(btn=>{
    btn.addEventListener('click', ()=>{ selCat=selCat===btn.dataset.cat?'':btn.dataset.cat; renderProducts() })
  })
  document.getElementById('exp-prod').addEventListener('click', ()=>
    downloadCSV(filtered.map(p=>({sku:p.sku,name:p.name,category:p.category,unit_price:p.unit_price,cost_price:p.cost_price,supplier:p.supplier})),'products.csv')
  )
}
