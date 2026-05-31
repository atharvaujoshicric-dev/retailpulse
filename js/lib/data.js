// ── Utilities ──────────────────────────────────────────────

export function fmt(v, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style:'currency', currency, minimumFractionDigits:0, maximumFractionDigits:0 }).format(v)
}
export function fmtN(v) { return new Intl.NumberFormat('en-IN').format(v) }
export function fmtPct(v, sign=true) { return `${sign && v>0?'+':''}${Number(v).toFixed(1)}%` }
export function fmtDate(d) { return new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) }
export function fmtShort(d) { return new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) }

export function stockStatus(cur, rp, max) {
  if (cur === 0) return { label:'Out of Stock', color:'red', pct:0 }
  const pct = Math.round(cur/max*100)
  if (cur <= rp/2) return { label:'Critical', color:'red', pct }
  if (cur <= rp)   return { label:'Low', color:'yellow', pct }
  if (pct > 90)    return { label:'Overstock', color:'blue', pct }
  return { label:'Healthy', color:'green', pct }
}

export function sevColor(s) { return { critical:'red', high:'red', medium:'yellow', low:'green' }[s] || 'blue' }

export function downloadCSV(rows, name='export.csv') {
  if (!rows.length) return
  const h = Object.keys(rows[0])
  const csv = [h.join(','), ...rows.map(r => h.map(k => JSON.stringify(r[k]??'')).join(','))].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}))
  a.download = name; a.click()
}

export const CAT_COLORS = {
  Grocery:'#14b8a6', Dairy:'#3b82f6', Beverages:'#8b5cf6',
  'Personal Care':'#f59e0b', Household:'#ef4444', 'Packaged Food':'#10b981', Snacks:'#f97316'
}

// ── Mock data ───────────────────────────────────────────────

export const MOCK = {
  kpis: {
    total_revenue:2847650, revenue_change:12.4, total_orders:8934, orders_change:8.1,
    avg_order_value:318.7, aov_change:4.2, active_products:15, low_stock_count:4, forecast_accuracy:87.3
  },

  revenueTrend(days=30) {
    return Array.from({length:days},(_,i)=>{
      const d=new Date(); d.setDate(d.getDate()-(days-1-i))
      return { date:d.toISOString().split('T')[0], revenue:Math.round(60000+Math.random()*40000+Math.sin(i/4)*20000), orders:Math.round(80+Math.random()*60) }
    })
  },

  topProducts: [
    {product_id:'1',name:'Basmati Rice 5kg',category:'Grocery',total_revenue:485200,total_quantity:1078,growth:18.4},
    {product_id:'2',name:'Sunflower Oil 5L',category:'Grocery',total_revenue:320800,total_quantity:493,growth:12.1},
    {product_id:'3',name:'Milk 1L (Pack of 6)',category:'Dairy',total_revenue:298400,total_quantity:829,growth:8.7},
    {product_id:'4',name:'Bisleri Water 1L',category:'Beverages',total_revenue:245100,total_quantity:1021,growth:24.3},
    {product_id:'5',name:'Maggi Noodles',category:'Packaged Food',total_revenue:198300,total_quantity:1101,growth:-3.2},
    {product_id:'6',name:'Coca Cola 2L',category:'Beverages',total_revenue:176400,total_quantity:420,growth:15.8},
    {product_id:'7',name:'Ariel Detergent 3kg',category:'Household',total_revenue:158600,total_quantity:305,growth:6.4},
  ],

  categoryBreakdown: [
    {category:'Grocery',revenue:1085000,orders:2840},
    {category:'Dairy',revenue:720000,orders:1980},
    {category:'Beverages',revenue:618000,orders:1470},
    {category:'Personal Care',revenue:438500,orders:1080},
    {category:'Household',revenue:320200,orders:700},
    {category:'Snacks',revenue:220500,orders:950},
  ],

  inventory: [
    {id:'1',product_id:'1',current_stock:145,reorder_point:20,reorder_quantity:100,max_stock:500,product:{name:'Basmati Rice 5kg',sku:'SKU-001',category:'Grocery'}},
    {id:'2',product_id:'2',current_stock:8,reorder_point:20,reorder_quantity:100,max_stock:300,product:{name:'Whole Wheat Flour 10kg',sku:'SKU-002',category:'Grocery'}},
    {id:'3',product_id:'3',current_stock:230,reorder_point:15,reorder_quantity:80,max_stock:400,product:{name:'Sunflower Oil 5L',sku:'SKU-003',category:'Grocery'}},
    {id:'4',product_id:'4',current_stock:5,reorder_point:20,reorder_quantity:100,max_stock:500,product:{name:'Sugar 5kg',sku:'SKU-004',category:'Grocery'}},
    {id:'5',product_id:'5',current_stock:67,reorder_point:15,reorder_quantity:60,max_stock:300,product:{name:'Toor Dal 2kg',sku:'SKU-005',category:'Grocery'}},
    {id:'6',product_id:'6',current_stock:420,reorder_point:30,reorder_quantity:150,max_stock:600,product:{name:'Milk 1L (Pack of 6)',sku:'SKU-006',category:'Dairy'}},
    {id:'7',product_id:'7',current_stock:12,reorder_point:20,reorder_quantity:80,max_stock:250,product:{name:'Butter 500g',sku:'SKU-007',category:'Dairy'}},
    {id:'8',product_id:'8',current_stock:3,reorder_point:15,reorder_quantity:60,max_stock:200,product:{name:'Colgate Toothpaste',sku:'SKU-009',category:'Personal Care'}},
  ],

  alerts: [
    {id:'1',alert_type:'low_stock',severity:'critical',title:'Critical: Sugar 5kg nearly out of stock',message:'Only 5 units remaining. Reorder immediately.',is_read:false,is_resolved:false,created_at:new Date().toISOString(),product:{name:'Sugar 5kg',sku:'SKU-004'}},
    {id:'2',alert_type:'low_stock',severity:'high',title:'Low Stock: Whole Wheat Flour',message:'8 units left, below reorder point of 20.',is_read:false,is_resolved:false,created_at:new Date(Date.now()-3600000).toISOString(),product:{name:'Whole Wheat Flour',sku:'SKU-002'}},
    {id:'3',alert_type:'demand_spike',severity:'medium',title:'Demand Spike: Beverages category',message:'Forecasted 45% uplift in beverage sales next week.',is_read:true,is_resolved:false,created_at:new Date(Date.now()-7200000).toISOString(),product:null},
    {id:'4',alert_type:'reorder',severity:'medium',title:'Reorder Suggested: Butter 500g',message:'Stock at 12 units, approaching reorder threshold.',is_read:false,is_resolved:false,created_at:new Date(Date.now()-10800000).toISOString(),product:{name:'Butter 500g',sku:'SKU-007'}},
    {id:'5',alert_type:'stockout_risk',severity:'high',title:'Stockout Risk: Colgate Toothpaste',message:'At current sales rate, stockout expected in 2 days.',is_read:false,is_resolved:false,created_at:new Date(Date.now()-14400000).toISOString(),product:{name:'Colgate Toothpaste',sku:'SKU-009'}},
  ],

  forecastPoints(horizon=30) {
    let base=65
    return Array.from({length:horizon},(_,i)=>{
      const d=new Date(); d.setDate(d.getDate()+i+1)
      base = Math.max(10, base+(Math.random()-.45)*8)
      const m=base*.18
      return { date:d.toISOString().split('T')[0], predicted:Math.round(base*10)/10, lower:Math.round(Math.max(0,base-m)*10)/10, upper:Math.round((base+m)*10)/10, confidence:80 }
    })
  },

  products: [
    {id:'1',sku:'SKU-001',name:'Basmati Rice 5kg',category:'Grocery',subcategory:'Grains',unit_price:450,cost_price:280,unit:'bag',supplier:'GrainMaster Co',is_active:true},
    {id:'2',sku:'SKU-002',name:'Whole Wheat Flour 10kg',category:'Grocery',subcategory:'Grains',unit_price:380,cost_price:210,unit:'bag',supplier:'FlourMill Ltd',is_active:true},
    {id:'3',sku:'SKU-003',name:'Sunflower Oil 5L',category:'Grocery',subcategory:'Oils',unit_price:650,cost_price:420,unit:'bottle',supplier:'OilPure Inc',is_active:true},
    {id:'4',sku:'SKU-004',name:'Sugar 5kg',category:'Grocery',subcategory:'Sweeteners',unit_price:220,cost_price:145,unit:'bag',supplier:'SweetCo',is_active:true},
    {id:'5',sku:'SKU-005',name:'Toor Dal 2kg',category:'Grocery',subcategory:'Pulses',unit_price:280,cost_price:175,unit:'pack',supplier:'PulseKing',is_active:true},
    {id:'6',sku:'SKU-006',name:'Milk 1L (Pack of 6)',category:'Dairy',subcategory:'Milk',unit_price:360,cost_price:280,unit:'pack',supplier:'FreshDairy',is_active:true},
    {id:'7',sku:'SKU-007',name:'Butter 500g',category:'Dairy',subcategory:'Butter',unit_price:280,cost_price:195,unit:'pack',supplier:'FreshDairy',is_active:true},
    {id:'8',sku:'SKU-008',name:'Paneer 200g',category:'Dairy',subcategory:'Paneer',unit_price:120,cost_price:80,unit:'pack',supplier:'FreshDairy',is_active:true},
    {id:'9',sku:'SKU-009',name:'Colgate Toothpaste 200g',category:'Personal Care',subcategory:'Oral',unit_price:145,cost_price:88,unit:'tube',supplier:'Colgate-P',is_active:true},
    {id:'10',sku:'SKU-010',name:"Dove Soap (Pack of 4)",category:'Personal Care',subcategory:'Soap',unit_price:220,cost_price:140,unit:'pack',supplier:'HUL',is_active:true},
    {id:'11',sku:'SKU-011',name:'Ariel Detergent 3kg',category:'Household',subcategory:'Laundry',unit_price:520,cost_price:340,unit:'box',supplier:'P&G',is_active:true},
    {id:'12',sku:'SKU-012',name:'Maggi Noodles (Pack of 12)',category:'Packaged Food',subcategory:'Noodles',unit_price:180,cost_price:110,unit:'pack',supplier:'Nestle',is_active:true},
    {id:'13',sku:'SKU-013',name:"Lay's Chips Variety (10 pcs)",category:'Snacks',subcategory:'Chips',unit_price:250,cost_price:160,unit:'pack',supplier:'PepsiCo',is_active:true},
    {id:'14',sku:'SKU-014',name:'Bisleri Water 1L (Pack of 12)',category:'Beverages',subcategory:'Water',unit_price:240,cost_price:155,unit:'pack',supplier:'Bisleri',is_active:true},
    {id:'15',sku:'SKU-015',name:'Coca Cola 2L (Pack of 6)',category:'Beverages',subcategory:'Soft Drinks',unit_price:420,cost_price:270,unit:'pack',supplier:'Coca-Cola',is_active:true},
  ],

  impactResults: {
    diwali: [
      {product_id:'13',product_name:"Lay's Chips Variety",category:'Snacks',baseline_demand:45.2,projected_demand:126.6,uplift_pct:180,recommendation:'Stock up 180% extra — high demand expected'},
      {product_id:'1',product_name:'Basmati Rice 5kg',category:'Grocery',baseline_demand:62.3,projected_demand:130.8,uplift_pct:110,recommendation:'Stock up 110% extra — high demand expected'},
      {product_id:'4',product_name:'Sugar 5kg',category:'Grocery',baseline_demand:41.0,projected_demand:86.1,uplift_pct:110,recommendation:'Stock up 110% extra — high demand expected'},
      {product_id:'12',product_name:'Maggi Noodles',category:'Packaged Food',baseline_demand:89.5,projected_demand:178.0,uplift_pct:99,recommendation:'Increase inventory by 99% for this period'},
      {product_id:'15',product_name:'Coca Cola 2L',category:'Beverages',baseline_demand:38.2,projected_demand:72.6,uplift_pct:90,recommendation:'Increase inventory by 90% for this period'},
    ],
    summer: [
      {product_id:'14',product_name:'Bisleri Water 1L',category:'Beverages',baseline_demand:120.0,projected_demand:336.0,uplift_pct:180,recommendation:'Stock up 180% extra — high demand expected'},
      {product_id:'15',product_name:'Coca Cola 2L',category:'Beverages',baseline_demand:38.2,projected_demand:95.5,uplift_pct:150,recommendation:'Stock up 150% extra — high demand expected'},
      {product_id:'6',product_name:'Milk 1L (Pack of 6)',category:'Dairy',baseline_demand:70.5,projected_demand:105.8,uplift_pct:50,recommendation:'Increase inventory by 50% for this period'},
      {product_id:'9',product_name:'Colgate Toothpaste',category:'Personal Care',baseline_demand:35.1,projected_demand:49.1,uplift_pct:40,recommendation:'Increase inventory by 40% for this period'},
      {product_id:'1',product_name:'Basmati Rice 5kg',category:'Grocery',baseline_demand:62.3,projected_demand:68.5,uplift_pct:10,recommendation:'Minor uplift — maintain current inventory levels'},
    ],
    monsoon: [
      {product_id:'3',product_name:'Sunflower Oil 5L',category:'Grocery',baseline_demand:32,projected_demand:54.4,uplift_pct:70,recommendation:'Increase inventory by 70% for monsoon season'},
      {product_id:'1',product_name:'Basmati Rice 5kg',category:'Grocery',baseline_demand:62.3,projected_demand:99.7,uplift_pct:60,recommendation:'Increase inventory by 60% — monsoon demand boost'},
      {product_id:'12',product_name:'Maggi Noodles',category:'Packaged Food',baseline_demand:89.5,projected_demand:152.1,uplift_pct:70,recommendation:'Stock up 70% extra — high comfort food demand'},
      {product_id:'14',product_name:'Bisleri Water 1L',category:'Beverages',baseline_demand:120,projected_demand:84,uplift_pct:-30,recommendation:'Reduce orders by 30% — lower water demand in monsoon'},
      {product_id:'11',product_name:'Ariel Detergent 3kg',category:'Household',baseline_demand:28.4,projected_demand:42.6,uplift_pct:50,recommendation:'Increase by 50% — more laundry during wet season'},
    ],
  },

  forecastAccuracy: {
    overall_accuracy: 87.3, overall_mape: 12.7,
    by_category: [
      {category:'Grocery',accuracy:89.2,mape:10.8},
      {category:'Dairy',accuracy:85.1,mape:14.9},
      {category:'Beverages',accuracy:91.3,mape:8.7},
      {category:'Personal Care',accuracy:88.7,mape:11.3},
      {category:'Snacks',accuracy:83.4,mape:16.6},
      {category:'Household',accuracy:86.9,mape:13.1},
    ]
  }
}

// ── Persistent Inventory (localStorage backed) ───────────────

const INV_KEY = 'retailpulse-inventory'

export const invStore = {
  _default() { return JSON.parse(JSON.stringify(MOCK.inventory)) },
  getAll() {
    try { return JSON.parse(localStorage.getItem(INV_KEY) || 'null') || this._default() } catch { return this._default() }
  },
  save(items) { localStorage.setItem(INV_KEY, JSON.stringify(items)) },
  add(item) {
    const items = this.getAll()
    const newItem = {
      ...item,
      id: Date.now()+'',
      product_id: Date.now()+'p',
    }
    items.push(newItem)
    this.save(items)
    return newItem
  },
  update(id, updates) {
    const items = this.getAll().map(i => i.id===id ? {...i,...updates} : i)
    this.save(items)
  },
  delete(id) {
    this.save(this.getAll().filter(i => i.id!==id))
  },
  reset() { localStorage.removeItem(INV_KEY) }
}
