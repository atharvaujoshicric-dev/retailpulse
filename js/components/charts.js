const GRID = 'rgba(148,163,184,0.08)'
const TOOLTIP = {
  backgroundColor:'rgba(15,17,25,0.92)',
  borderColor:'rgba(30,35,50,0.8)', borderWidth:1,
  titleColor:'#e2e8f0', bodyColor:'#94a3b8',
  padding:10, cornerRadius:8, displayColors:true
}
const TICK = { color:'#94a3b8', font:{ size:11 } }

export function revenueChart(canvasId, data) {
  const ctx = document.getElementById(canvasId)
  if (!ctx) return
  return new Chart(ctx, {
    type:'line',
    data:{
      labels: data.map(d=>d.date.slice(5)),
      datasets:[{
        label:'Revenue', data:data.map(d=>d.revenue),
        borderColor:'#14b8a6', backgroundColor:'rgba(20,184,166,.12)',
        fill:true, tension:.4, pointRadius:0, pointHoverRadius:5,
        pointHoverBackgroundColor:'#14b8a6', borderWidth:2,
      }]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{...TOOLTIP,
        callbacks:{ label:ctx=>`₹${(ctx.raw/1000).toFixed(1)}k` }
      }},
      scales:{
        x:{ grid:{color:GRID}, ticks:{...TICK, maxTicksLimit:8} },
        y:{ grid:{color:GRID}, ticks:{...TICK, callback:v=>`₹${(v/1000).toFixed(0)}k`} }
      }
    }
  })
}

export function categoryBarChart(canvasId, data) {
  const ctx = document.getElementById(canvasId)
  if (!ctx) return
  const COLORS = ['#14b8a6','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#10b981','#f97316']
  return new Chart(ctx, {
    type:'bar',
    data:{
      labels:data.map(d=>d.category),
      datasets:[{ label:'Revenue', data:data.map(d=>d.revenue),
        backgroundColor:COLORS, borderRadius:6 }]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{...TOOLTIP,
        callbacks:{ label:ctx=>`₹${(ctx.raw/1000).toFixed(0)}k` }
      }},
      scales:{
        x:{ grid:{display:false}, ticks:TICK },
        y:{ grid:{color:GRID}, ticks:{...TICK, callback:v=>`₹${(v/1000).toFixed(0)}k`} }
      }
    }
  })
}

export function donutChart(canvasId, data) {
  const ctx = document.getElementById(canvasId)
  if (!ctx) return
  const COLORS = ['#14b8a6','#3b82f6','#8b5cf6','#f59e0b','#ef4444','#10b981','#f97316']
  return new Chart(ctx, {
    type:'doughnut',
    data:{
      labels:data.map(d=>d.category),
      datasets:[{ data:data.map(d=>d.revenue), backgroundColor:COLORS,
        borderWidth:2, borderColor:'rgba(0,0,0,0)' }]
    },
    options:{
      responsive:true, maintainAspectRatio:false, cutout:'68%',
      plugins:{ legend:{ position:'right', labels:{ color:'#94a3b8', font:{size:11}, padding:12, boxWidth:10 } },
        tooltip:{...TOOLTIP, callbacks:{ label:ctx=>`${ctx.label}: ₹${(ctx.raw/1000).toFixed(0)}k` }}
      }
    }
  })
}

export function forecastChart(canvasId, data) {
  const ctx = document.getElementById(canvasId)
  if (!ctx) return
  return new Chart(ctx, {
    type:'line',
    data:{
      labels:data.map(d=>d.date.slice(5)),
      datasets:[
        { label:'Upper',  data:data.map(d=>d.upper),  borderColor:'transparent', backgroundColor:'rgba(59,130,246,.1)', fill:'+1', tension:.4, pointRadius:0 },
        { label:'Predicted', data:data.map(d=>d.predicted), borderColor:'#3b82f6', backgroundColor:'transparent', tension:.4, pointRadius:0, borderWidth:2, pointHoverRadius:5 },
        { label:'Lower',  data:data.map(d=>d.lower),  borderColor:'transparent', backgroundColor:'rgba(59,130,246,.1)', fill:'-1', tension:.4, pointRadius:0 },
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{...TOOLTIP} },
      scales:{
        x:{ grid:{color:GRID}, ticks:{...TICK, maxTicksLimit:10} },
        y:{ grid:{color:GRID}, ticks:TICK }
      }
    }
  })
}

export function impactBarChart(canvasId, data) {
  const ctx = document.getElementById(canvasId)
  if (!ctx) return
  return new Chart(ctx, {
    type:'bar',
    data:{
      labels:data.map(d=>d.product_name.split(' ').slice(0,2).join(' ')),
      datasets:[
        { label:'Baseline', data:data.map(d=>d.baseline_demand), backgroundColor:'#475569', borderRadius:4 },
        { label:'Projected', data:data.map(d=>d.projected_demand),
          backgroundColor:data.map(d=>d.uplift_pct>50?'#14b8a6':d.uplift_pct>20?'#3b82f6':'#8b5cf6'),
          borderRadius:4 },
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ labels:{color:'#94a3b8',font:{size:11}} }, tooltip:{...TOOLTIP} },
      scales:{
        x:{ grid:{display:false}, ticks:TICK },
        y:{ grid:{color:GRID}, ticks:TICK }
      }
    }
  })
}
