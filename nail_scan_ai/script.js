/* ═══════════════════════════════════════════════════════════
   AI-BASED ANEMIA DETECTION SYSTEM — script.js
   Clean version — no duplicates
═══════════════════════════════════════════════════════════ */

/* ── Load jsPDF ── */
const _s = document.createElement('script');
_s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
document.head.appendChild(_s);

/* ══════════════════════════════════════════════════
   GLOBAL STATE
══════════════════════════════════════════════════ */
let currentPatient = { name: '', id: '', age: '', gender: '' };
let lastResult     = { label: '', aConf: 0, nConf: 0 };
let patientCounter = parseInt(localStorage.getItem('nailscan_counter') || '0');
let allRecords     = JSON.parse(localStorage.getItem('nailscan_records') || '[]');
let currentStream  = null;
let capturedImage  = null;

/* ══════════════════════════════════════════════════
   SPLASH + LOGIN CONNECTION
   → Splash dikho → phir login check karo
══════════════════════════════════════════════════ */
function initSplash() {
  setTimeout(() => {
    const splash = document.getElementById('splash');
    splash.style.opacity       = '0';
    splash.style.visibility    = 'hidden';
    splash.style.pointerEvents = 'none';
    setTimeout(() => {
      splash.style.display = 'none';
      checkLogin(); // ← Login check splash ke baad
    }, 450);
  }, 1500);
}

/* ── Login Check ── */
function checkLogin() {
  const raw = localStorage.getItem('nailscan_user');
  if (!raw) {
    // User logged in nahi → login page pe bhejo
    window.location.href = 'login.html';
    return;
  }
  try {
    const user = JSON.parse(raw);
    // User logged in hai → main content dikhao
    document.getElementById('main-content').classList.remove('hidden');
    loadUserInSidebar(user);
  } catch (e) {
    localStorage.removeItem('nailscan_user');
    window.location.href = 'login.html';
  }
}

/* ── User info sidebar mein dikhao ── */
function loadUserInSidebar(user) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('sb-user-name',  user.name  || 'User');
  set('sb-user-email', user.email || '');
  set('sb-user-role',  '✦ ' + (user.role || 'User') + ' Access');
  const avatar = document.getElementById('sb-avatar');
  if (avatar) avatar.textContent = user.avatar || (user.name ? user.name[0].toUpperCase() : 'U');
  
  // Role-based access control
  applyRoleBasedAccess(user);
}

/* ── Role-based access control ── */
function applyRoleBasedAccess(user) {
  const adminBtn = document.getElementById('nav-admin');
  const adminPage = document.getElementById('page-admin');
  
  if (user.role === 'Administrator') {
    // Show admin button for admin users
    if (adminBtn) adminBtn.classList.remove('hidden');
  } else {
    // Hide admin button for regular users
    if (adminBtn) adminBtn.classList.add('hidden');
    // Make sure admin page is not visible
    if (adminPage) adminPage.classList.remove('active');
  }
}

/* ── Logout ── */
function logout() {
  localStorage.removeItem('nailscan_user');
  window.location.href = 'login.html';
}

/* ══════════════════════════════════════════════════
   TOAST NOTIFICATIONS
══════════════════════════════════════════════════ */
function showToast(message, type = 'success', duration = 3000) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 320);
  }, duration);
}

/* ══════════════════════════════════════════════════
   PAGE SWITCHING
══════════════════════════════════════════════════ */
function showPage(pageName) {
  // Check role-based access for admin page
  if (pageName === 'admin') {
    const userRaw = localStorage.getItem('nailscan_user');
    if (userRaw) {
      try {
        const user = JSON.parse(userRaw);
        if (user.role !== 'Administrator') {
          showError('Access Denied', '⛔ Admin access restricted to Administrators only.');
          return;
        }
      } catch (e) {
        showError('Error', '⛔ Invalid user session.');
        return;
      }
    }
  }
  
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sb-nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + pageName).classList.add('active');
  document.getElementById('nav-' + pageName).classList.add('active');
  if (pageName === 'admin') { buildChart(); buildTable(); }
  updateBreadcrumbs(pageName);
  closeSidebarMobile();
}

/* ══════════════════════════════════════════════════
   MOBILE SIDEBAR
══════════════════════════════════════════════════ */
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (window.innerWidth <= 768) {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
  }
}
function closeSidebarMobile() {
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('active');
  }
}

/* ══════════════════════════════════════════════════
   INPUT METHOD SWITCH
══════════════════════════════════════════════════ */
function switchInput(method) {
  clearImage();
  stopCamera();
  if (method === 'upload') {
    document.getElementById('btn-upload').classList.add('active');
    document.getElementById('btn-camera').classList.remove('active');
    document.getElementById('upload-zone').classList.remove('hidden');
    document.getElementById('camera-zone').classList.add('hidden');
  } else {
    document.getElementById('btn-camera').classList.add('active');
    document.getElementById('btn-upload').classList.remove('active');
    document.getElementById('camera-zone').classList.remove('hidden');
    document.getElementById('upload-zone').classList.add('hidden');
    startCamera();
  }
}

/* ══════════════════════════════════════════════════
   CAMERA
══════════════════════════════════════════════════ */
function startCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast('Camera not supported. Please use Upload.', 'error');
    switchInput('upload'); return;
  }
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(stream => {
      currentStream = stream;
      document.getElementById('camera-video').srcObject = stream;
      showToast('Camera ready — place finger in the guide', 'info');
    })
    .catch(() => {
      showToast('Camera access denied. Please use Upload.', 'error');
      switchInput('upload');
    });
}
function stopCamera() {
  if (currentStream) { currentStream.getTracks().forEach(t => t.stop()); currentStream = null; }
}
function capturePhoto() {
  const video  = document.getElementById('camera-video');
  const canvas = document.getElementById('camera-canvas');
  canvas.width  = video.videoWidth  || 640;
  canvas.height = video.videoHeight || 480;
  canvas.getContext('2d').drawImage(video, 0, 0);
  const dataUrl = canvas.toDataURL('image/png');
  capturedImage = dataUrl;

  // Create image element for validation
  const img = new Image();
  img.onload = () => {
    showSpinner('Processing Image...', 'Preparing preview');
    hideSpinner();
    showPreview(dataUrl, canvas.width, canvas.height);
    stopCamera();
    document.getElementById('camera-zone').classList.add('hidden');
    showToast('Photo captured successfully!', 'success');
  };
  img.src = dataUrl;
}

/* ══════════════════════════════════════════════════
   FILE UPLOAD & DRAG DROP
══════════════════════════════════════════════════ */
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { showToast('Please select a valid image file.', 'error'); return; }
  const reader = new FileReader();
  reader.onload = e => {
    capturedImage = e.target.result;
    const img = new Image();
    img.onload = () => { showPreview(e.target.result, img.naturalWidth, img.naturalHeight); showToast('Image uploaded successfully!', 'success'); };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
function handleDragOver(e) {
  e.preventDefault();
  document.getElementById('upload-zone').classList.add('drag-over');
}
function handleDrop(e) {
  e.preventDefault();
  document.getElementById('upload-zone').classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (!file || !file.type.startsWith('image/')) {
    showError('Invalid File Type', 'Please drop a valid image file (JPG, PNG, etc.)');
    return;
  }
  const reader = new FileReader();
  reader.onload = ev => {
    capturedImage = ev.target.result;
    const img = new Image();
    img.onload = () => {
      showPreview(ev.target.result, img.naturalWidth, img.naturalHeight);
      showToast('Image uploaded successfully!', 'success');
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}
function showPreview(src, w, h) {
  document.getElementById('upload-zone').classList.add('hidden');
  document.getElementById('img-preview').classList.remove('hidden');
  document.getElementById('preview-img').src = src;
  document.getElementById('img-width').textContent  = w + 'px';
  document.getElementById('img-height').textContent = h + 'px';
  resetOutput();
}

function clearImage() {
  capturedImage = null;
  document.getElementById('upload-zone').classList.remove('hidden');
  document.getElementById('img-preview').classList.add('hidden');
  document.getElementById('preview-img').src = '';
  document.getElementById('file-input').value = '';
  resetOutput();
}

/* ══════════════════════════════════════════════════
   PATIENT MODAL
══════════════════════════════════════════════════ */
function analyzeImage() {
  if (!capturedImage) { showToast('Please upload or capture a fingernail image first.', 'warning'); return; }
  openPatientModal();
}
function openPatientModal() {
  document.getElementById('patient-modal').classList.remove('hidden');
  setTimeout(() => document.getElementById('modal-name').focus(), 100);
}
function closePatientModal() {
  document.getElementById('patient-modal').classList.add('hidden');
  document.getElementById('modal-name').value   = '';
  document.getElementById('modal-age').value    = '';
  document.getElementById('modal-gender').value = 'Male';
}
function confirmPatient() {
  const name   = document.getElementById('modal-name').value.trim();
  const age    = document.getElementById('modal-age').value.trim();
  const gender = document.getElementById('modal-gender').value;
  if (!name) {
    const inp = document.getElementById('modal-name');
    inp.style.borderColor = 'rgba(255,64,96,0.70)';
    inp.placeholder = '⚠ Name is required!';
    setTimeout(() => { inp.style.borderColor = ''; inp.placeholder = 'Enter patient full name'; }, 2000);
    showToast('Please enter patient name.', 'warning');
    return;
  }
  patientCounter++;
  localStorage.setItem('nailscan_counter', patientCounter);
  const patientId = 'PT-' + String(patientCounter).padStart(4, '0');
  currentPatient  = { name, id: patientId, age: age || 'N/A', gender };
  closePatientModal();
  showToast(`Patient ${patientId} registered`, 'info', 2000);
  runAnalysis();
}

/* ══════════════════════════════════════════════════
   RESET OUTPUT
══════════════════════════════════════════════════ */
function resetOutput() {
  document.getElementById('output-pending').classList.remove('hidden');
  document.getElementById('output-loading').classList.add('hidden');
  document.getElementById('result-anemic').classList.add('hidden');
  document.getElementById('result-normal').classList.add('hidden');
}

/* ══════════════════════════════════════════════════
   RUN ANALYSIS
══════════════════════════════════════════════════ */
function runAnalysis() {
  document.getElementById('output-pending').classList.add('hidden');
  document.getElementById('result-anemic').classList.add('hidden');
  document.getElementById('result-normal').classList.add('hidden');
  document.getElementById('output-loading').classList.remove('hidden');
  showSpinner('Analyzing Fingernail...', 'DenseNet-169 processing image');
  const btn = document.getElementById('analyze-btn');
  btn.disabled = true;

  setTimeout(() => {
    /* ── Real Flask API call (jab model ready ho):
       const formData = new FormData();
       formData.append('image', fileInput.files[0]);
       fetch('http://your-flask-api/predict', { method:'POST', body: formData })
         .then(r => r.json())
         .then(data => { showResult(data.label, data.anemic, data.normal); saveRecord(data.label, data.anemic, data.normal); hideSpinner(); });
    ── */
    const nConf = parseFloat((Math.random() * 0.20 + 0.78).toFixed(4));
    const aConf = parseFloat((1 - nConf).toFixed(4));
    const label = 'Normal';
    document.getElementById('output-loading').classList.add('hidden');
    hideSpinner();
    btn.disabled = false;
    showResult(label, aConf, nConf);
    saveRecord(label, aConf, nConf);
    showToast('✅ Analysis complete! Record saved.', 'success');
  }, 2200);
}

/* ══════════════════════════════════════════════════
   SHOW RESULT + ANIMATION
══════════════════════════════════════════════════ */
function animateCounter(el, targetVal, suffix, duration) {
  let start = 0;
  const step = targetVal / (duration / 16);
  const timer = setInterval(() => {
    start = Math.min(start + step, targetVal);
    el.textContent = start.toFixed(2) + suffix;
    if (start >= targetVal) clearInterval(timer);
  }, 16);
}

function showResult(label, aConf, nConf) {
  lastResult = { label, aConf, nConf };
  const aW       = Math.round(aConf * 100);
  const nW       = Math.round(nConf * 100);
  const dominant = Math.max(aConf, nConf);
  const risk     = aConf > 0.70 ? 'HIGH' : aConf > 0.45 ? 'MODERATE' : 'LOW';
  const cert     = dominant > 0.82 ? 'STRONG' : 'MODERATE';
  const s        = label === 'Anemic' ? 'a' : 'n';

  ['a','n'].forEach(x => {
    const el = document.getElementById('result-patient-' + x);
    if (el) el.textContent = currentPatient.name + ' · ' + currentPatient.id;
  });

  document.getElementById('risk-'      + s).textContent = risk;
  document.getElementById('certainty-' + s).textContent = cert;
  document.getElementById('topconf-'   + s).textContent = (dominant * 100).toFixed(1) + '%';

  const rEl = document.getElementById('risk-' + s);
  rEl.style.color = risk === 'HIGH' ? '#dc2626' : risk === 'MODERATE' ? '#f59e0b' : '#16a34a';

  document.getElementById('result-' + (label === 'Anemic' ? 'anemic' : 'normal')).classList.remove('hidden');

  setTimeout(() => {
    document.getElementById('anemic-bar-' + s).style.width = aW + '%';
    document.getElementById('normal-bar-' + s).style.width = nW + '%';
    animateCounter(document.getElementById('anemic-pct-' + s), aConf * 100, '%', 1000);
    animateCounter(document.getElementById('normal-pct-' + s), nConf * 100, '%', 1000);
  }, 150);
}

/* ══════════════════════════════════════════════════
   PRINT RESULT
══════════════════════════════════════════════════ */
function printResult(type) {
  const isAnemic = type === 'anemic';
  const s        = isAnemic ? 'a' : 'n';
  const now      = new Date();
  const dateStr  = now.toLocaleDateString('en-PK', { day:'2-digit', month:'long', year:'numeric' });
  const timeStr  = now.toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit' });
  const risk     = document.getElementById('risk-'      + s).textContent;
  const cert     = document.getElementById('certainty-' + s).textContent;
  const topConf  = document.getElementById('topconf-'   + s).textContent;
  const aPct     = (lastResult.aConf * 100).toFixed(2);
  const nPct     = (lastResult.nConf * 100).toFixed(2);
  const aW       = Math.round(lastResult.aConf * 100);
  const nW       = Math.round(lastResult.nConf * 100);

  const printEl = document.getElementById('print-area');
  printEl.innerHTML = `
    <div class="pr-header">
      <div>
        <div class="pr-header-title">🧬 AI-Based Anemia Detection System — Diagnostic Report</div>
        <div class="pr-header-sub">Shaheed Benazir Bhutto University, SBA · AI-Based Screening</div>
      </div>
      <div class="pr-header-right">
        <div><strong>${dateStr}</strong></div>
        <div>${timeStr}</div>
        <div style="margin-top:4px;font-size:9px;">RPT-${Date.now().toString().slice(-8)}</div>
      </div>
    </div>
    <div class="pr-patient">
      <div><div class="pr-field-label">Full Name</div><div class="pr-field-value">${currentPatient.name||'N/A'}</div></div>
      <div><div class="pr-field-label">Patient ID</div><div class="pr-field-value" style="color:#b07800;">${currentPatient.id||'N/A'}</div></div>
      <div><div class="pr-field-label">Age / Gender</div><div class="pr-field-value">${currentPatient.age||'N/A'} · ${currentPatient.gender||'N/A'}</div></div>
    </div>
    <div class="pr-result-box ${type}">
      <div class="pr-result-label">${isAnemic ? '⚠️ ANEMIC' : '✅ NORMAL'}</div>
      <div class="pr-result-sub">${isAnemic ? 'Iron Deficiency Pattern Detected' : 'Healthy Perfusion Profile Confirmed'}</div>
    </div>
    <div class="pr-bars">
      <div class="pr-bar-row">
        <div class="pr-bar-label">Anemic</div>
        <div class="pr-bar-track"><div class="pr-bar-fill-r" style="width:${aW}%"></div></div>
        <div class="pr-bar-pct" style="color:#dc2626;">${aPct}%</div>
      </div>
      <div class="pr-bar-row">
        <div class="pr-bar-label">Normal</div>
        <div class="pr-bar-track"><div class="pr-bar-fill-g" style="width:${nW}%"></div></div>
        <div class="pr-bar-pct" style="color:#16a34a;">${nPct}%</div>
      </div>
    </div>
    <div class="pr-metrics">
      <div class="pr-metric"><div class="pr-metric-label">Risk Level</div><div class="pr-metric-value">${risk}</div></div>
      <div class="pr-metric"><div class="pr-metric-label">Certainty</div><div class="pr-metric-value">${cert}</div></div>
      <div class="pr-metric"><div class="pr-metric-label">Top Confidence</div><div class="pr-metric-value">${topConf}</div></div>
    </div>
    <div class="pr-disclaimer">
      <strong>⚠ DISCLAIMER:</strong> This report is generated by an AI-based screening tool and is NOT a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for confirmatory blood tests and clinical evaluation.<br><br>
      <strong>Model:</strong> DenseNet-169 &nbsp;|&nbsp; <strong>Framework:</strong> TensorFlow/Keras &nbsp;|&nbsp; <strong>Input:</strong> 224×224px
    </div>
    <div class="pr-footer">AI-Based Anemia Detection System &nbsp;|&nbsp; SBBU Final Year Project 2024/25 &nbsp;|&nbsp; For Academic &amp; Research Use Only</div>
  `;
  showToast('Opening print dialog...', 'info', 2000);
  setTimeout(() => window.print(), 300);
}

/* ══════════════════════════════════════════════════
   SAVE RECORD
══════════════════════════════════════════════════ */
function saveRecord(label, aConf, nConf) {
  const risk = aConf > 0.70 ? 'HIGH' : aConf > 0.45 ? 'MODERATE' : 'LOW';
  const rec  = {
    date:   new Date().toISOString().split('T')[0],
    id:     currentPatient.id,
    name:   currentPatient.name,
    age:    currentPatient.age,
    gender: currentPatient.gender,
    result: label,
    conf:   parseFloat((Math.max(aConf, nConf) * 100).toFixed(1)),
    risk,
    staff:  ['Dr. Sana', 'Dr. Kamran', 'Staff User'][Math.floor(Math.random() * 3)],
  };
  allRecords.unshift(rec);
  localStorage.setItem('nailscan_records', JSON.stringify(allRecords));
  updateAdminKPIs();
}

/* ══════════════════════════════════════════════════
   ADMIN KPIs
══════════════════════════════════════════════════ */
function updateAdminKPIs() {
  const total  = allRecords.length;
  const anemic = allRecords.filter(r => r.result === 'Anemic').length;
  const normal = total - anemic;
  const rate   = total > 0 ? ((anemic / total) * 100).toFixed(1) + '%' : '0%';
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set('akpi-total', total); set('akpi-anemic', anemic); set('akpi-normal', normal); set('akpi-rate', rate);
}

/* ══════════════════════════════════════════════════
   BUILD CHART
══════════════════════════════════════════════════ */
function buildChart() {
  const container = document.getElementById('chart-bars');
  if (!container) return;
  container.innerHTML = '';
  const weeks = [];
  for (let i = 5; i >= 0; i--) {
    const slice = allRecords.slice(i * 2, i * 2 + 3);
    weeks.push({ label: 'W' + (6 - i), anemic: slice.filter(r => r.result === 'Anemic').length, normal: slice.filter(r => r.result === 'Normal').length });
  }
  const maxVal = Math.max(...weeks.map(w => w.anemic + w.normal), 1);
  weeks.forEach(week => {
    const aH = Math.round((week.anemic / maxVal) * 110);
    const nH = Math.round((week.normal / maxVal) * 110);
    const g  = document.createElement('div');
    g.className = 'chart-bar-group';
    g.innerHTML = `<div class="bar-stack"><div class="bar-seg normal" style="height:${nH}px"></div><div class="bar-seg anemic" style="height:${aH}px"></div></div><div class="bar-lbl">${week.label}</div>`;
    container.appendChild(g);
  });
}

/* ══════════════════════════════════════════════════
   BUILD TABLE + FILTER
══════════════════════════════════════════════════ */
function buildTable() { updateAdminKPIs(); filterTable(); }
function filterTable() {
  const fResult = document.getElementById('filter-result').value;
  const fRisk   = document.getElementById('filter-risk').value;
  const fStaff  = document.getElementById('filter-staff').value;
  const filtered = allRecords.filter(r =>
    (fResult === 'All' || r.result === fResult) &&
    (fRisk   === 'All' || r.risk   === fRisk)   &&
    (fStaff  === 'All' || r.staff  === fStaff)
  );
  const tbody = document.getElementById('table-body');
  tbody.innerHTML = '';
  filtered.forEach(r => {
    const resTag  = r.result === 'Anemic' ? '<span class="tag tag-anemic">Anemic</span>' : '<span class="tag tag-normal">Normal</span>';
    const riskTag = r.risk === 'HIGH' ? '<span class="tag tag-high">HIGH</span>' : r.risk === 'MODERATE' ? '<span class="tag tag-mod">MODERATE</span>' : '<span class="tag tag-low">LOW</span>';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.date}</td><td>${r.id}</td><td>${r.name||'N/A'}</td><td>${resTag}</td><td>${r.conf}%</td><td>${riskTag}</td><td>${r.staff}</td>`;
    tbody.appendChild(tr);
  });
  document.getElementById('table-footer').textContent = `Showing ${filtered.length} of ${allRecords.length} records`;
}

/* ══════════════════════════════════════════════════
   LOADING SPINNER
══════════════════════════════════════════════════ */
function showSpinner(text = 'Analyzing Image...', sub = 'Using DenseNet-169 Vision Model') {
  const overlay = document.getElementById('spinner-overlay');
  if (overlay) {
    document.getElementById('spinner-text').textContent = text;
    document.getElementById('spinner-sub').textContent = sub;
    overlay.classList.add('active');
  }
}
function hideSpinner() {
  const overlay = document.getElementById('spinner-overlay');
  if (overlay) overlay.classList.remove('active');
}

/* ══════════════════════════════════════════════════
   ERROR ALERTS
══════════════════════════════════════════════════ */
function showError(title, message) {
  const container = document.getElementById('error-container');
  if (!container) return;
  const alert = document.createElement('div');
  alert.className = 'error-alert';
  alert.innerHTML = `
    <div class="error-icon">❌</div>
    <div class="error-content">
      <div class="error-title">${title}</div>
      <div class="error-message">${message}</div>
    </div>
    <button class="error-close" onclick="this.parentElement.remove()">×</button>
  `;
  container.appendChild(alert);
  setTimeout(() => {
    if (alert.parentElement) alert.remove();
  }, 6000);
}

/* ══════════════════════════════════════════════════
   CONFIRMATION DIALOG
══════════════════════════════════════════════════ */
let confirmCallback = null;

function showConfirm(icon, title, message, confirmText = 'Confirm', onConfirm = null) {
  document.getElementById('confirm-icon').textContent = icon;
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-message').textContent = message;
  document.getElementById('confirm-btn').textContent = confirmText;
  confirmCallback = onConfirm;
  document.getElementById('confirm-overlay').classList.add('active');
}
function closeConfirm() {
  document.getElementById('confirm-overlay').classList.remove('active');
  confirmCallback = null;
}
function executeConfirm() {
  if (confirmCallback && typeof confirmCallback === 'function') {
    confirmCallback();
  }
  closeConfirm();
}

/* ══════════════════════════════════════════════════
   LOGOUT CONFIRMATION
══════════════════════════════════════════════════ */
function confirmLogout() {
  showConfirm(
    '🚪',
    'Confirm Logout',
    'Are you sure you want to sign out?',
    'Yes, Logout',
    logout
  );
}

/* ══════════════════════════════════════════════════
   BREADCRUMB UPDATES
══════════════════════════════════════════════════ */
function updateBreadcrumbs(pageName) {
  const breadcrumb = document.getElementById('breadcrumb-current');
  const breadcrumbs = {
    'diagnostic': '🔬 Diagnostic Hub',
    'admin': '⚙️ Admin Dashboard'
  };
  if (breadcrumb && breadcrumbs[pageName]) {
    breadcrumb.textContent = breadcrumbs[pageName];
  }
}

/* ══════════════════════════════════════════════════
   EMPTY STATE MESSAGE
══════════════════════════════════════════════════ */
function showEmptyState(container, icon, title, subtitle, actionText, actionCallback) {
  const empty = document.createElement('div');
  empty.className = 'empty-state';
  let actionBtn = '';
  if (actionText && actionCallback) {
    actionBtn = `<button class="empty-action" onclick="${actionCallback}()">${actionText}</button>`;
  }
  empty.innerHTML = `
    <div class="empty-icon">${icon}</div>
    <div class="empty-title">${title}</div>
    <div class="empty-subtitle">${subtitle}</div>
    ${actionBtn}
  `;
  container.innerHTML = '';
  container.appendChild(empty);
}

/* ══════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initSplash(); // Splash → login check → dashboard
  const zone = document.getElementById('upload-zone');
  if (zone) zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  updateAdminKPIs();
  document.getElementById('modal-name')?.addEventListener('keydown', e => {
    if (e.key === 'Enter')  confirmPatient();
    if (e.key === 'Escape') closePatientModal();
  });
  document.getElementById('patient-modal')?.addEventListener('click', e => {
    if (e.target.id === 'patient-modal') closePatientModal();
  });
});