import { auth } from '../lib/store.js'
import { navigate } from '../app.js'

export function renderLogin() {
  document.getElementById('app').innerHTML = `
    <div class="login-page">
      <div class="login-glow"></div>
      <div class="login-box">
        <div style="text-align:center;margin-bottom:32px">
          <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:12px">
            <div class="logo-icon" style="width:40px;height:40px;border-radius:12px">
              <i data-lucide="trending-up" style="width:20px;height:20px"></i>
            </div>
            <span style="font-size:24px;font-weight:800;color:white">RetailPulse</span>
          </div>
          <p style="color:#64748b;font-size:13px">AI-Powered Demand Forecasting</p>
        </div>

        <div class="login-card">
          <h2 style="font-size:16px;font-weight:700;color:white;margin-bottom:22px">Sign in to your account</h2>

          <div style="margin-bottom:14px">
            <label style="display:block;font-size:13px;font-weight:500;color:#cbd5e1;margin-bottom:6px">Email</label>
            <input id="email-inp" type="email" class="input" value="admin@retailpulse.ai"
              style="background:#1e2332;border-color:#2d3347;color:white" placeholder="you@retailpulse.ai">
          </div>

          <div style="margin-bottom:18px">
            <label style="display:block;font-size:13px;font-weight:500;color:#cbd5e1;margin-bottom:6px">Password</label>
            <div style="position:relative">
              <input id="pw-inp" type="password" class="input" value="Admin123!"
                style="background:#1e2332;border-color:#2d3347;color:white;padding-right:40px">
              <button id="pw-toggle" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#64748b">
                <i data-lucide="eye" style="width:15px;height:15px"></i>
              </button>
            </div>
          </div>

          <div id="login-error" style="display:none;color:#f87171;font-size:12px;margin-bottom:12px"></div>

          <button id="login-btn" class="btn btn-primary" style="width:100%;justify-content:center;padding:10px">
            Sign in
          </button>

          <div class="demo-block">
            <p style="font-size:11px;font-weight:600;color:#64748b;margin-bottom:8px">Demo Credentials</p>
            <button class="demo-cred" data-email="admin@retailpulse.ai" data-pw="Admin123!">
              <span style="color:#cbd5e1;font-weight:600">Admin</span>
              <span style="font-family:monospace">admin@retailpulse.ai</span>
            </button>
            <button class="demo-cred" data-email="demo@retailpulse.ai" data-pw="Demo123!">
              <span style="color:#cbd5e1;font-weight:600">User</span>
              <span style="font-family:monospace">demo@retailpulse.ai</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
  lucide.createIcons()

  let showPw = false
  document.getElementById('pw-toggle').addEventListener('click', () => {
    showPw = !showPw
    document.getElementById('pw-inp').type = showPw ? 'text' : 'password'
    document.getElementById('pw-toggle').innerHTML = `<i data-lucide="${showPw?'eye-off':'eye'}" style="width:15px;height:15px"></i>`
    lucide.createIcons()
  })

  document.querySelectorAll('.demo-cred').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('email-inp').value = btn.dataset.email
      document.getElementById('pw-inp').value = btn.dataset.pw
    })
  })

  document.getElementById('login-btn').addEventListener('click', () => {
    const email = document.getElementById('email-inp').value
    auth.login(email)
    navigate('dashboard')
  })

  document.getElementById('pw-inp').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('login-btn').click()
  })
}
