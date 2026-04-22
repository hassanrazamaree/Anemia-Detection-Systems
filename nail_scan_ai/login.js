/* ═══════════════════════════════════════════════════════════
   AI-BASED ANEMIA DETECTION SYSTEM — login.js
   Login · Signup · Google Auth · Validation · Toast
═══════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════
   ADMIN EMAILS (Auto-assign Administrator role)
════════════════════════════════════════════ */
const ADMIN_EMAILS = [
  'hassanmariofficial@gmail.com',
  '786hassanmaree@gmail.com'
];

function isAdminEmail(email) {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/* ════════════════════════════════════════════
   TOAST
════════════════════════════════════════════ */
function toast(msg, type = 'success', ms = 3000) {
  const ico = { success:'✅', error:'❌', info:'ℹ️', warning:'⚠️' };
  const box  = document.getElementById('toasts');
  const el   = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="t-ico">${ico[type]}</span><span class="t-msg">${msg}</span>`;
  box.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 320);
  }, ms);
}

/* ════════════════════════════════════════════
   CARD SWITCH
════════════════════════════════════════════ */
function switchTo(name) {
  document.querySelectorAll('.auth-card').forEach(c => c.classList.remove('active'));
  document.getElementById('card-' + name).classList.add('active');
}

/* ════════════════════════════════════════════
   TOGGLE PASSWORD EYE
════════════════════════════════════════════ */
function toggleEye(id, btn) {
  const inp = document.getElementById(id);
  if (inp.type === 'password') {
    inp.type = 'text';
    btn.textContent = '🙈';
  } else {
    inp.type = 'password';
    btn.textContent = '👁️';
  }
}

/* ════════════════════════════════════════════
   PASSWORD STRENGTH
════════════════════════════════════════════ */
function strengthCheck(val) {
  const fill = document.getElementById('str-fill');
  const txt  = document.getElementById('str-txt');
  if (!fill) return;

  if (!val) {
    fill.style.width = '0%';
    txt.textContent  = '';
    return;
  }

  let score = 0;
  if (val.length >= 8)           score++;
  if (val.length >= 12)          score++;
  if (/[A-Z]/.test(val))         score++;
  if (/[0-9]/.test(val))         score++;
  if (/[^A-Za-z0-9]/.test(val))  score++;

  if (score <= 1) {
    fill.style.width      = '25%';
    fill.style.background = '#dc2626';
    txt.style.color       = '#ef4444';
    txt.textContent       = 'Weak';
  } else if (score <= 2) {
    fill.style.width      = '50%';
    fill.style.background = '#f59e0b';
    txt.style.color       = '#fbbf24';
    txt.textContent       = 'Fair';
  } else if (score <= 3) {
    fill.style.width      = '75%';
    fill.style.background = '#3b82f6';
    txt.style.color       = '#3b82f6';
    txt.textContent       = 'Good';
  } else {
    fill.style.width      = '100%';
    fill.style.background = '#16a34a';
    txt.style.color       = '#16a34a';
    txt.textContent       = 'Strong ✓';
  }
}

/* ════════════════════════════════════════════
   VALIDATION HELPERS
════════════════════════════════════════════ */
function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

function markErr(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('err');
  el.addEventListener('input', () => el.classList.remove('err'), { once: true });
}

/* ════════════════════════════════════════════
   GOOGLE AUTH
   (UI flow — redirect to Google)
   When backend ready replace URL with real
   Google OAuth 2.0 or /auth/google endpoint
════════════════════════════════════════════ */
function googleAuth() {
  toast('Connecting to Google...', 'info', 2000);
  setTimeout(() => {
    /* ─ Real implementation:
       window.location.href = 'https://accounts.google.com/o/oauth2/auth?...'
       OR: window.location.href = '/auth/google'
    ─ */
    // Simulate: save user and redirect to main app
    const demoEmail = 'user@gmail.com';
    const user = {
      name:     'Google User',
      email:    demoEmail,
      role:     isAdminEmail(demoEmail) ? 'Administrator' : 'User',  // Check if admin
      provider: 'google',
      avatar:   'G',
    };
    localStorage.setItem('nailscan_user', JSON.stringify(user));
    toast('Google login successful! Redirecting...', 'success', 1500);
    setTimeout(() => { window.location.href = 'index.html'; }, 1500);
  }, 1200);
}

/* ════════════════════════════════════════════
   LOGIN
════════════════════════════════════════════ */
function doLogin() {
  const email = document.getElementById('l-email').value.trim();
  const pass  = document.getElementById('l-pass').value;

  // Validate
  if (!email)           { markErr('l-email'); toast('Please enter your email.', 'warning'); return; }
  if (!validEmail(email)) { markErr('l-email'); toast('Invalid email address.', 'warning'); return; }
  if (!pass)            { markErr('l-pass');  toast('Please enter your password.', 'warning'); return; }
  if (pass.length < 6)  { markErr('l-pass');  toast('Password too short.', 'warning'); return; }

  toast('Signing in...', 'info', 1500);

  setTimeout(() => {
    /* ─ Real API call:
       fetch('/api/login', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ email, password: pass })
       })
       .then(r => r.json())
       .then(data => {
         if (data.success) {
           localStorage.setItem('nailscan_user', JSON.stringify(data.user));
           window.location.href = 'index.html';
         } else {
           toast(data.message || 'Login failed.', 'error');
         }
       });
    ─ */
    const user = {
      name:     email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
      email:    email,
      role:     isAdminEmail(email) ? 'Administrator' : 'User',  // Check if admin
      provider: 'email',
      avatar:   email[0].toUpperCase(),
    };
    localStorage.setItem('nailscan_user', JSON.stringify(user));
    const adminMsg = isAdminEmail(email) ? ' (Administrator Access)' : '';
    toast('Welcome back! 👋' + adminMsg, 'success', 1500);
    setTimeout(() => { window.location.href = 'index.html'; }, 1500);
  }, 1200);
}

/* ════════════════════════════════════════════
   SIGNUP
════════════════════════════════════════════ */
function doSignup() {
  const fname   = document.getElementById('s-fname').value.trim();
  const lname   = document.getElementById('s-lname').value.trim();
  const email   = document.getElementById('s-email').value.trim();
  const role    = document.getElementById('s-role').value;
  const pass    = document.getElementById('s-pass').value;
  const confirm = document.getElementById('s-confirm').value;
  const terms   = document.getElementById('s-terms').checked;

  // Validate
  if (!fname)              { markErr('s-fname');   toast('Please enter your first name.', 'warning'); return; }
  if (!email)              { markErr('s-email');   toast('Please enter your email.', 'warning'); return; }
  if (!validEmail(email))  { markErr('s-email');   toast('Invalid email address.', 'warning'); return; }
  if (pass.length < 8)     { markErr('s-pass');    toast('Password must be at least 8 characters.', 'warning'); return; }
  if (pass !== confirm)    { markErr('s-confirm'); toast('Passwords do not match.', 'error'); return; }
  if (!terms)              { toast('Please agree to Terms of Use.', 'warning'); return; }

  toast('Creating your account...', 'info', 1500);

  setTimeout(() => {
    /* ─ Real API call:
       fetch('/api/signup', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ fname, lname, email, password: pass, role })
       })
       .then(r => r.json())
       .then(data => {
         if (data.success) {
           localStorage.setItem('nailscan_user', JSON.stringify(data.user));
           window.location.href = 'index.html';
         } else {
           toast(data.message || 'Signup failed.', 'error');
         }
       });
    ─ */
    // Force Administrator role for admin emails, otherwise use selected role
    const assignedRole = isAdminEmail(email) ? 'Administrator' : role;
    const adminMsg = isAdminEmail(email) ? ' (Administrator Access Granted)' : '';
    
    const user = {
      name:     fname + (lname ? ' ' + lname : ''),
      email:    email,
      role:     assignedRole,
      provider: 'email',
      avatar:   fname[0].toUpperCase(),
    };
    localStorage.setItem('nailscan_user', JSON.stringify(user));
    toast('Account created! Welcome to AI-Based Anemia Detection System 🎉' + adminMsg, 'success', 2000);
    setTimeout(() => { window.location.href = 'index.html'; }, 2000);
  }, 1200);
}

/* ════════════════════════════════════════════
   FORGOT PASSWORD
════════════════════════════════════════════ */
function doForgot() {
  const email = document.getElementById('f-email').value.trim();
  if (!email || !validEmail(email)) {
    markErr('f-email');
    toast('Please enter a valid email.', 'warning');
    return;
  }
  toast('Reset link sent to ' + email + ' ✉️', 'success', 3000);
  setTimeout(() => switchTo('login'), 2200);
}

/* ════════════════════════════════════════════
   INIT
════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  // Already logged in → go to app
  if (localStorage.getItem('nailscan_user')) {
    window.location.href = 'index.html';
    return;
  }

  // Enter key shortcuts
  document.getElementById('l-pass')?.addEventListener('keydown',    e => { if (e.key==='Enter') doLogin(); });
  document.getElementById('l-email')?.addEventListener('keydown',   e => { if (e.key==='Enter') doLogin(); });
  document.getElementById('s-confirm')?.addEventListener('keydown', e => { if (e.key==='Enter') doSignup(); });
  document.getElementById('f-email')?.addEventListener('keydown',   e => { if (e.key==='Enter') doForgot(); });
});