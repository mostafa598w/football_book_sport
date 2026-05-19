/**
 * GoalZone Ultra — Futuristic Football Booking System
 * Features: Particle BG · 3D Tilt · GSAP · Glassmorphism · Neon UI
 */

/* ══════════════════════════════════════════════════════════════════════
   PARTICLE SYSTEM
   ══════════════════════════════════════════════════════════════════════ */
function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], mouse = { x: -999, y: -999 };

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x  = Math.random() * W;
      this.y  = Math.random() * H;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      this.r  = Math.random() * 1.5 + 0.3;
      this.a  = Math.random() * 0.5 + 0.1;
      this.color = Math.random() > 0.7 ? '#00ff87' : Math.random() > 0.5 ? '#00d4ff' : '#ffffff';
    }
    update() {
      // Mouse repulsion
      const dx = this.x - mouse.x, dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const force = (120 - dist) / 120;
        this.vx += dx / dist * force * 0.5;
        this.vy += dy / dist * force * 0.5;
      }
      this.vx *= 0.99; this.vy *= 0.99;
      this.x += this.vx; this.y += this.vy;
      if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.a;
      ctx.fill();
    }
  }

  // Create particles
  for (let i = 0; i < 120; i++) particles.push(new Particle());

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = '#00ff87';
          ctx.globalAlpha = (1 - dist / 100) * 0.08;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  (function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    ctx.globalAlpha = 1;
    requestAnimationFrame(loop);
  })();
}

/* ══════════════════════════════════════════════════════════════════════
   3D TILT EFFECT
   ══════════════════════════════════════════════════════════════════════ */
function initTilt(el) {
  el.addEventListener('mousemove', e => {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top  + rect.height / 2;
    const rx = (e.clientY - cy) / (rect.height / 2) * -10;
    const ry = (e.clientX - cx) / (rect.width  / 2) *  10;
    el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale(1)';
    el.style.transition = '0.5s cubic-bezier(0.34,1.56,0.64,1)';
  });
  el.addEventListener('mouseenter', () => { el.style.transition = 'none'; });
}

function initAllTilts() {
  document.querySelectorAll('.field-card').forEach(initTilt);
}

/* ══════════════════════════════════════════════════════════════════════
   GSAP PAGE TRANSITION
   ══════════════════════════════════════════════════════════════════════ */
function animateIn(el) {
  if (typeof gsap === 'undefined') return;
  gsap.fromTo(el, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
}

function animateCards(selector) {
  if (typeof gsap === 'undefined') return;
  gsap.fromTo(selector,
    { opacity: 0, y: 40, scale: 0.96 },
    { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out', delay: 0.2 }
  );
}

function animateStats() {
  if (typeof gsap === 'undefined') return;
  gsap.fromTo('.stat-card',
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.4, stagger: 0.07, ease: 'power2.out' }
  );
}

/* ══════════════════════════════════════════════════════════════════════
   CLICK SOUND (subtle)
   ══════════════════════════════════════════════════════════════════════ */
let audioCtx;
function playClick(freq = 800, dur = 0.06) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start(); osc.stop(audioCtx.currentTime + dur);
  } catch {}
}

document.addEventListener('click', e => {
  if (e.target.closest('.btn')) playClick(600, 0.05);
});

/* ══════════════════════════════════════════════════════════════════════
   STATE & API
   ══════════════════════════════════════════════════════════════════════ */
let STATE = { user: null, page: 'home', navData: null };

async function api(path, method = 'GET', body = null) {
  // أضف timestamp لكسر الـ cache — أي تغيير في DB يظهر فوراً
  const url = method === 'GET' ? path + (path.includes('?') ? '&' : '?') + '_=' + Date.now() : path;
  const opts = {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store',
      'Pragma': 'no-cache'
    }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

/* ══════════════════════════════════════════════════════════════════════
   TOAST
   ══════════════════════════════════════════════════════════════════════ */
function toast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  playClick(type === 'error' ? 300 : 800, 0.08);
  setTimeout(() => t.classList.remove('show'), 3800);
}

/* ══════════════════════════════════════════════════════════════════════
   MODAL
   ══════════════════════════════════════════════════════════════════════ */
function openModal(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal').classList.add('show');
  document.getElementById('modal-overlay').classList.add('show');
  if (typeof gsap !== 'undefined') {
    gsap.fromTo('#modal', { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.7)' });
  }
}
function closeModal() {
  document.getElementById('modal').classList.remove('show');
  document.getElementById('modal-overlay').classList.remove('show');
}

/* ══════════════════════════════════════════════════════════════════════
   NAVIGATION
   ══════════════════════════════════════════════════════════════════════ */
function navigate(page, data = null) {
  STATE.page = page; STATE.navData = data;
  renderNav(); renderPage();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMobile() {
  document.getElementById('nav-links').classList.toggle('open');
  document.getElementById('nav-actions').classList.toggle('open');
}

function renderNav() {
  const u = STATE.user;
  const userEl = document.getElementById('nav-user');
  const actEl  = document.getElementById('nav-actions');
  const nameEl = document.getElementById('nav-username');
  if (u) { userEl.classList.remove('hidden'); actEl.classList.add('hidden'); nameEl.textContent = u.is_admin ? `⚙ ${u.name}` : `● ${u.name}`; }
  else   { userEl.classList.add('hidden'); actEl.classList.remove('hidden'); }
  document.getElementById('nav-links').innerHTML = `
    <a class="nav-link" onclick="navigate('fields')">Fields</a>
    <a class="nav-link" onclick="navigate('bookings')">My Bookings</a>
    <a class="nav-link" onclick="navigate('recommend')">⚡ AI Pick</a>
    ${u?.is_admin ? '<a class="nav-link" onclick="navigate(\'admin\')">Dashboard</a>' : ''}`;
}

/* ══════════════════════════════════════════════════════════════════════
   PAGE ROUTER
   ══════════════════════════════════════════════════════════════════════ */
function renderPage() {
  const app = document.getElementById('app');

  if (STATE.page === 'admin-login') {
    app.innerHTML = `
      <div class="auth-page">
        <div class="auth-card">
          <h2>⚙ Admin Login</h2>
          <p class="subtitle">Access the command center</p>
          <div class="auth-form">
            <div class="form-group"><label class="form-label">Username</label><input class="form-control" id="a-user" placeholder="admin"/></div>
            <div class="form-group"><label class="form-label">Password</label><input class="form-control" type="password" id="a-pass" placeholder="••••••••" onkeydown="if(event.key==='Enter')doAdminLogin()"/></div>
            <button class="btn btn-neon btn-block" onclick="doAdminLogin()">Access Dashboard</button>
          </div>
          <div class="demo-hint"><strong>Default:</strong> admin / admin123</div>
          <div class="auth-footer"><a onclick="navigate('login')">← Back to user login</a></div>
        </div>
      </div>`;
    animateIn(app.querySelector('.auth-card'));
    return;
  }

  app.innerHTML = '<div class="spinner"></div>';
  const pages = { home: renderHome, fields: renderFields, field: renderFieldDetail, bookings: renderBookings, login: renderLogin, register: renderRegister, admin: renderAdmin, recommend: renderRecommend, database: renderDatabase };
  (pages[STATE.page] || renderHome)(app);
}

/* ══════════════════════════════════════════════════════════════════════
   HOME
   ══════════════════════════════════════════════════════════════════════ */
async function renderHome(app) {
  app.innerHTML = `
    <section class="hero">
      <div class="hero-glow"></div>
      <div class="hero-content">
        <div class="hero-badge">⚡ Egypt's #1 Football Booking Platform</div>
        <h1>Book Your<br><span class="accent">Perfect</span> Pitch</h1>
        <p>Find, compare, and instantly book premium football fields. Real-time availability, secure payments, and AI recommendations — all in one cinematic experience.</p>
        <div class="hero-actions">
          <button class="btn btn-neon" style="font-size:1rem;padding:.8rem 2.2rem" onclick="navigate('fields')">Browse Fields</button>
          <button class="btn btn-glass" style="font-size:1rem;padding:.8rem 2.2rem" onclick="navigate('recommend')">⚡ AI Recommendation</button>
        </div>
        <div class="hero-stats">
          <div class="hero-stat"><span class="num" id="stat-fields">…</span><span class="label">Premium Fields</span></div>
          <div class="hero-stat"><span class="num" id="stat-users">…</span><span class="label">Players</span></div>
          <div class="hero-stat"><span class="num" id="stat-bookings">…</span><span class="label">Bookings</span></div>
          <div class="hero-stat"><span class="num" id="stat-rating">…★</span><span class="label">Avg Rating</span></div>
        </div>
      </div>
    </section>

    <hr class="neon-divider"/>

    <div class="section">
      <div class="section-header">
        <div><div class="section-title">Featured Fields</div><p class="section-sub">TOP-RATED VENUES · BOOK INSTANTLY</p></div>
        <button class="btn btn-outline-neon btn-sm" onclick="navigate('fields')">View All →</button>
      </div>
      <div id="home-fields" class="fields-grid"></div>
    </div>

    <hr class="neon-divider"/>

    <div style="background:rgba(0,255,135,.02);border-top:1px solid rgba(0,255,135,.08);border-bottom:1px solid rgba(0,255,135,.08);padding:5rem 0">
      <div class="section" style="padding-top:0;padding-bottom:0">
        <div style="text-align:center;margin-bottom:3rem">
          <div class="section-title">How It Works</div>
          <p class="section-sub" style="margin:.5rem auto 0">FOUR SIMPLE STEPS</p>
        </div>
        <div class="steps-grid">
          ${[
            ['🔍','DISCOVER','Find a Field','Search by location, price or surface type'],
            ['📅','SELECT','Pick Your Slot','Choose date and time that works for you'],
            ['💳','PAY','Secure Checkout','Cash, card, or online payment'],
            ['⚽','PLAY','Hit the Pitch','Show up and enjoy the game'],
          ].map(([icon,num,title,desc])=>`
            <div class="step-card">
              <div class="step-num">STEP ${num}</div>
              <span class="step-icon">${icon}</span>
              <div class="step-title">${title}</div>
              <p class="step-desc">${desc}</p>
            </div>`).join('')}
        </div>
      </div>
    </div>`;

  animateIn(app.querySelector('.hero-content'));

  try {
    // جيب stats live من DB
    const stats = await api('/api/live/stats');
    const sf = document.getElementById('stat-fields');
    const su = document.getElementById('stat-users');
    const sb = document.getElementById('stat-bookings');
    const sr = document.getElementById('stat-rating');
    if (sf) sf.textContent = stats.fields + '+';
    if (su) su.textContent = stats.users + '+';
    if (sb) sb.textContent = stats.bookings + '+';
    if (sr) sr.textContent = (stats.avg_rating || '—') + '★';
  } catch {}

  try {
    const fields = await api('/api/fields');
    const grid = document.getElementById('home-fields');
    if (grid) {
      grid.innerHTML = fields.slice(0,3).map(fieldCard).join('');
      animateCards('.field-card');
      setTimeout(() => initAllTilts(), 100);
    }
  } catch {}
}

/* ══════════════════════════════════════════════════════════════════════
   FIELDS PAGE
   ══════════════════════════════════════════════════════════════════════ */
async function renderFields(app) {
  app.innerHTML = `
    <div class="section" style="padding-top:7rem">
      <div class="section-header">
        <div><div class="section-title">Football Fields</div><p class="section-sub">FIND YOUR PERFECT PITCH</p></div>
      </div>
      <div class="search-bar">
        <input class="form-control" id="s-location" placeholder="🔍 Search by location…" style="flex:2;min-width:200px"/>
        <select class="form-control" id="s-surface" style="min-width:160px">
          <option value="">All Surfaces</option>
          <option>Natural Grass</option>
          <option>Artificial Turf</option>
          <option>Hybrid Grass</option>
        </select>
        <input class="form-control" id="s-maxprice" type="number" placeholder="Max EGP/hr" style="min-width:150px"/>
        <button class="btn btn-neon" onclick="searchFields()">Search</button>
      </div>
      <div id="fields-grid" class="fields-grid"><div class="spinner"></div></div>
    </div>`;
  await searchFields();
}

async function searchFields() {
  const grid = document.getElementById('fields-grid');
  if (grid) grid.innerHTML = '<div class="spinner"></div>';
  const loc  = document.getElementById('s-location')?.value || '';
  const surf = document.getElementById('s-surface')?.value  || '';
  const mp   = document.getElementById('s-maxprice')?.value || '';
  let url = `/api/fields?location=${encodeURIComponent(loc)}&surface=${encodeURIComponent(surf)}`;
  if (mp) url += `&max_price=${mp}`;
  try {
    const fields = await api(url);
    if (!grid) return;
    if (!fields.length) {
      grid.innerHTML = `<div class="empty"><span class="icon">🏟️</span><p>No fields match your search.</p><button class="btn btn-outline-neon" onclick="searchFields()">Clear</button></div>`;
      return;
    }
    grid.innerHTML = fields.map(fieldCard).join('');
    animateCards('.field-card');
    setTimeout(() => initAllTilts(), 100);
  } catch (e) {
    if (grid) grid.innerHTML = `<p class="text-muted">${e.message}</p>`;
  }
}

/* ── Field card HTML ──────────────────────────────────────────────────── */
function fieldCard(f) {
  const rating = f.avg_rating || 'N/A';
  const stars  = rating !== 'N/A' ? '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating)) : '—';
  const amen   = (f.amenities||[]).slice(0,3).map(a=>`<span class="amenity-tag">${a}</span>`).join('');
  return `
    <div class="field-card" onclick="navigate('field',${f.id})">
      <div class="field-img-wrap">
        <img class="field-img" src="${f.image_url||'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800'}" alt="${f.name}" loading="lazy"/>
        <div class="field-img-overlay"></div>
        <span class="field-surface-badge">${f.surface}</span>
        <div class="field-avail"><div class="avail-dot"></div> Available</div>
      </div>
      <div class="field-body">
        <div class="field-name">${f.name}</div>
        <div class="field-location">📍 ${f.location}</div>
        <div class="field-amenities">${amen}</div>
        <div class="field-meta">
          <div class="field-price">${f.price_per_hour} <small>EGP/hr</small></div>
          <div class="field-rating">★ ${rating} <span style="color:var(--tm);font-size:.75rem">(${f.review_count||0})</span></div>
        </div>
      </div>
      <div class="field-footer">
        <button class="btn btn-neon btn-sm" onclick="event.stopPropagation();navigate('field',${f.id})">Book Now</button>
        <button class="btn btn-glass btn-sm" onclick="event.stopPropagation();navigate('field',${f.id})">Details</button>
      </div>
    </div>`;
}

/* ══════════════════════════════════════════════════════════════════════
   FIELD DETAIL
   ══════════════════════════════════════════════════════════════════════ */
async function renderFieldDetail(app) {
  app.innerHTML = '<div class="spinner"></div>';
  try {
    const f = await api(`/api/fields/${STATE.navData}`);
    const amen = (f.amenities||[]).map(a=>`<span class="amenity-tag" style="font-size:.82rem;padding:.25rem .8rem">${a}</span>`).join('');
    const stars = r => '★'.repeat(r) + '☆'.repeat(5-r);
    const revs  = f.reviews || [];

    app.innerHTML = `
      <div class="section" style="padding-top:7rem">
        <button class="btn btn-glass btn-sm" onclick="navigate('fields')" style="margin-bottom:1.5rem">← Back</button>
        <div class="field-detail-hero">
          <img src="${f.image_url||'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800'}" alt="${f.name}"/>
          <div class="field-detail-overlay">
            <div class="field-detail-info">
              <h1>${f.name}</h1>
              <p>📍 ${f.location} &nbsp;·&nbsp; ${f.surface} &nbsp;·&nbsp; 👥 ${f.capacity} players</p>
            </div>
          </div>
        </div>

        <div class="field-detail-grid">
          <div>
            <p style="color:var(--ts);margin-bottom:1.5rem;line-height:1.8">${f.description||''}</p>
            <div class="field-amenities" style="margin-bottom:2rem">${amen}</div>

            <div style="display:flex;gap:2.5rem;margin-bottom:2.5rem;flex-wrap:wrap">
              <div>
                <div style="font-family:'Orbitron',sans-serif;font-size:2.8rem;font-weight:900;color:var(--ng);text-shadow:0 0 20px rgba(0,255,135,.4)">${f.price_per_hour}</div>
                <div style="color:var(--tm);font-size:.82rem;text-transform:uppercase;letter-spacing:.08em">EGP / Hour</div>
              </div>
              <div>
                <div style="font-family:'Orbitron',sans-serif;font-size:2.8rem;font-weight:900;color:#ffc107;text-shadow:0 0 20px rgba(255,193,7,.4)">${f.avg_rating||'—'}</div>
                <div style="color:var(--tm);font-size:.82rem;text-transform:uppercase;letter-spacing:.08em">${f.review_count||0} Reviews</div>
              </div>
            </div>

            <div style="font-family:'Orbitron',sans-serif;font-size:.85rem;font-weight:700;color:var(--tp);margin-bottom:1rem;letter-spacing:.08em">REVIEWS</div>
            ${revs.length ? revs.map(r=>`
              <div style="background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.07);border-radius:var(--r);padding:1rem;margin-bottom:.8rem">
                <div style="display:flex;justify-content:space-between;margin-bottom:.4rem">
                  <strong style="font-size:.9rem">${r.user_name}</strong>
                  <span style="color:#ffc107;font-size:.9rem">${stars(r.rating)}</span>
                </div>
                <p style="font-size:.85rem;color:var(--ts)">${r.comment||''}</p>
                <span style="font-size:.75rem;color:var(--tm)">${(r.created_at||'').split('T')[0]}</span>
              </div>`).join('') : '<p class="text-muted">No reviews yet.</p>'}
            ${STATE.user && !STATE.user.is_admin ? `<button class="btn btn-outline-neon btn-sm mt-2" onclick="openReviewModal(${f.id})">✏️ Write Review</button>` : ''}
          </div>

          <div>
            <div class="booking-panel">
              <h3>⚡ Book This Field</h3>
              ${STATE.user && !STATE.user.is_admin ? bookingForm(f) : `
                <p class="text-muted" style="margin-bottom:1rem">Login to book this field.</p>
                <button class="btn btn-neon btn-block" onclick="navigate('login')">Login to Book</button>`}
            </div>
          </div>
        </div>
      </div>`;

    animateIn(app.querySelector('.field-detail-hero'));

    if (STATE.user && !STATE.user.is_admin) {
      window._CURRENT_FIELD_RATE = f.price_per_hour;
      SELECTED_SLOT = null;
      // Auto-load today's slots
      const todayDate = document.getElementById('bk-date')?.value;
      if (todayDate) loadSlots(f.id, todayDate);
    }
  } catch(e) {
    app.innerHTML = `<div class="empty" style="padding-top:8rem"><span class="icon">❌</span><p>${e.message}</p></div>`;
  }
}

function bookingForm(f) {
  const today = new Date().toISOString().split('T')[0];
  return `
    <div class="auth-form">
      <div class="form-group">
        <label class="form-label">📅 Date</label>
        <input class="form-control" type="date" id="bk-date" min="${today}" value="${today}" onchange="loadSlots(${f.id},this.value)"/>
      </div>

      <div class="form-group">
        <label class="form-label">⏰ Available Time Slots</label>
        <div id="slot-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:.4rem;margin-top:.3rem">
          <div style="grid-column:1/-1;text-align:center;padding:.5rem;color:var(--tm);font-size:.8rem">Loading slots…</div>
        </div>
        <div style="display:flex;gap:1rem;margin-top:.6rem;font-size:.72rem;color:var(--tm)">
          <span style="display:flex;align-items:center;gap:.3rem"><span style="width:10px;height:10px;border-radius:3px;background:rgba(0,255,135,.2);border:1px solid var(--ng);display:inline-block"></span> Available</span>
          <span style="display:flex;align-items:center;gap:.3rem"><span style="width:10px;height:10px;border-radius:3px;background:rgba(255,85,85,.15);border:1px solid #ff5555;display:inline-block"></span> Booked</span>
          <span style="display:flex;align-items:center;gap:.3rem"><span style="width:10px;height:10px;border-radius:3px;background:rgba(0,212,255,.3);border:1px solid var(--nb);display:inline-block"></span> Selected</span>
        </div>
      </div>

      <div class="form-row" id="time-inputs" style="display:none">
        <input type="hidden" id="bk-start"/>
        <input type="hidden" id="bk-end"/>
        <div style="background:rgba(0,212,255,.06);border:1px solid rgba(0,212,255,.2);border-radius:var(--rs);padding:.7rem;font-size:.85rem;grid-column:1/-1">
          ✅ Selected: <strong id="selected-label" style="color:var(--nb)">—</strong>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">💳 Payment Method</label>
        <select class="form-control" id="bk-pay">
          <option value="cash">Cash on Arrival</option>
          <option value="card">Credit Card</option>
          <option value="online">Online Transfer</option>
        </select>
      </div>
      <div class="form-group"><label class="form-label">📝 Notes (optional)</label><input class="form-control" id="bk-notes" placeholder="Any special requests…"/></div>

      <div class="price-calc" id="price-calc">
        <div class="price-row"><span>Duration</span><span id="pc-dur">—</span></div>
        <div class="price-row"><span>Rate</span><span>${f.price_per_hour} EGP/hr</span></div>
        <div class="price-row total"><span>Total</span><span id="pc-total">— EGP</span></div>
      </div>

      <button class="btn btn-neon btn-block" id="bk-submit" onclick="submitBooking(${f.id},${f.price_per_hour})" style="margin-top:.5rem;font-size:.95rem;padding:.75rem" disabled>
        Select a time slot first
      </button>
    </div>`;
}

function calcPrice(rate) {
  const s = document.getElementById('bk-start')?.value;
  const e = document.getElementById('bk-end')?.value;
  if (!s || !e) return;
  const hrs = ((+e.split(':')[0]*60 + +e.split(':')[1]) - (+s.split(':')[0]*60 + +s.split(':')[1])) / 60;
  if (hrs <= 0) return;
  document.getElementById('pc-dur').textContent  = `${hrs} hr${hrs!==1?'s':''}`;
  document.getElementById('pc-total').textContent = `${Math.round(hrs*rate)} EGP`;
  if (typeof gsap !== 'undefined') gsap.fromTo('#pc-total', { scale:1.15, color:'#00ff87' }, { scale:1, duration:.3, ease:'back.out' });
}

// Tracks which slot is selected
let SELECTED_SLOT = null;

async function loadSlots(fid, dateStr) {
  const grid = document.getElementById('slot-grid');
  if (!grid) return;
  grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:1rem;color:var(--tm);font-size:.8rem">
    <div class="spinner" style="margin:.5rem auto;width:24px;height:24px;border-width:2px"></div>Loading…</div>`;
  SELECTED_SLOT = null;
  const submitBtn = document.getElementById('bk-submit');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Select a time slot first'; }
  try {
    const slots = await api(`/api/fields/${fid}/slots?date=${dateStr}`);
    grid.innerHTML = slots.map((s, i) => {
      const booked = s.is_booked;
      const style = booked
        ? 'background:rgba(255,85,85,.1);border:1px solid rgba(255,85,85,.3);color:#ff5555;cursor:not-allowed;opacity:.6'
        : 'background:rgba(0,255,135,.05);border:1px solid rgba(0,255,135,.25);color:var(--ng);cursor:pointer';
      return `<div
        class="slot-btn"
        data-index="${i}"
        data-start="${s.start_24}"
        data-end="${s.end_24}"
        data-label="${s.start_ampm} → ${s.end_ampm}"
        data-booked="${booked}"
        onclick="selectSlot(this)"
        style="${style};border-radius:var(--rs);padding:.45rem .3rem;text-align:center;font-size:.72rem;font-weight:700;transition:all .2s;letter-spacing:.02em;line-height:1.3">
        ${s.start_ampm}<br><span style="opacity:.7;font-weight:400">${s.end_ampm}</span>
      </div>`;
    }).join('');
  } catch {
    grid.innerHTML = `<div style="grid-column:1/-1;color:#ff5555;font-size:.8rem;padding:.5rem">Failed to load slots</div>`;
  }
}

function selectSlot(el) {
  if (el.dataset.booked === 'true') {
    toast('This time slot is already booked! Pick another.', 'error');
    return;
  }
  // Deselect all
  document.querySelectorAll('.slot-btn').forEach(b => {
    if (b.dataset.booked !== 'true') {
      b.style.background = 'rgba(0,255,135,.05)';
      b.style.borderColor = 'rgba(0,255,135,.25)';
      b.style.color = 'var(--ng)';
      b.style.boxShadow = 'none';
    }
  });
  // Select this one
  el.style.background = 'rgba(0,212,255,.2)';
  el.style.borderColor = 'var(--nb)';
  el.style.color = 'var(--nb)';
  el.style.boxShadow = '0 0 12px rgba(0,212,255,.3)';

  SELECTED_SLOT = { start: el.dataset.start, end: el.dataset.end, label: el.dataset.label };

  // Update hidden inputs
  document.getElementById('bk-start').value = SELECTED_SLOT.start;
  document.getElementById('bk-end').value   = SELECTED_SLOT.end;
  document.getElementById('selected-label').textContent = SELECTED_SLOT.label;
  document.getElementById('time-inputs').style.display = 'grid';

  // Calc price
  const [sh,sm] = SELECTED_SLOT.start.split(':').map(Number);
  const [eh,em] = SELECTED_SLOT.end.split(':').map(Number);
  const hrs = ((eh*60+em)-(sh*60+sm))/60;
  const rate = parseFloat(document.getElementById('pc-total')
    .closest('.price-calc').querySelector('.price-row:nth-child(2) span:last-child').textContent);
  document.getElementById('pc-dur').textContent   = `${hrs} hr${hrs!==1?'s':''}`;
  // Get rate from data attribute
  const rateVal = window._CURRENT_FIELD_RATE || 0;
  document.getElementById('pc-total').textContent = `${Math.round(hrs * rateVal)} EGP`;
  if (typeof gsap !== 'undefined') gsap.fromTo('#pc-total',{scale:1.15},{scale:1,duration:.3,ease:'back.out'});

  const submitBtn = document.getElementById('bk-submit');
  if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '⚽ Confirm Booking'; }
}

async function submitBooking(fieldId, rate) {
  if (!STATE.user) { navigate('login'); return; }
  const date  = document.getElementById('bk-date').value;
  const start = document.getElementById('bk-start').value;
  const end   = document.getElementById('bk-end').value;
  const pay   = document.getElementById('bk-pay').value;
  const notes = document.getElementById('bk-notes').value;
  if (!date || !start || !end || !SELECTED_SLOT) {
    toast('Please select a time slot first!', 'error'); return;
  }
  const btn = document.getElementById('bk-submit');
  btn.disabled = true; btn.textContent = '⏳ Processing…';
  try {
    const res = await api('/api/bookings', 'POST', { field_id: fieldId, booking_date: date, start_time: start, end_time: end, payment_method: pay, notes });
    showBookingConfirmation(res);
    // Refresh slots to show newly booked
    loadSlots(fieldId, date);
    SELECTED_SLOT = null;
  } catch(e) {
    toast(e.message, 'error');
    btn.disabled = false; btn.textContent = '⚽ Confirm Booking';
    // Reload slots on conflict error
    if (e.message.includes('booked') || e.message.includes('slot')) loadSlots(fieldId, date);
  }
}

function showBookingConfirmation(res) {
  openModal(`
    <div style="text-align:center">
      <div style="font-size:4rem;margin-bottom:1rem;animation:lpulse 1s ease-in-out 3">🎉</div>
      <h2 style="font-family:'Orbitron',sans-serif;color:var(--ng);margin-bottom:.5rem">Booking Confirmed!</h2>
      <p style="color:var(--ts)">Booking #${res.booking_id} is confirmed and ready.</p>
      <div class="price-calc" style="margin:1.5rem 0;text-align:left">
        <div class="price-row total"><span>Total Amount</span><span>${res.total_price} EGP</span></div>
      </div>
      <div style="display:flex;gap:1rem;justify-content:center">
        <button class="btn btn-neon" onclick="closeModal();navigate('bookings')">View Bookings</button>
        <button class="btn btn-glass" onclick="closeModal()">Continue</button>
      </div>
    </div>`);
}

/* ══════════════════════════════════════════════════════════════════════
   BOOKINGS PAGE
   ══════════════════════════════════════════════════════════════════════ */
async function renderBookings(app) {
  if (!STATE.user) { navigate('login'); return; }
  app.innerHTML = `
    <div class="section" style="padding-top:7rem">
      <div class="section-header">
        <div><div class="section-title">My Bookings</div><p class="section-sub">YOUR HISTORY & UPCOMING SESSIONS</p></div>
        <button class="btn btn-neon btn-sm" onclick="navigate('fields')">+ New Booking</button>
      </div>
      <div id="bk-list" class="bookings-list"><div class="spinner"></div></div>
    </div>`;

  try {
    const bookings = await api('/api/bookings');
    const list = document.getElementById('bk-list');
    if (!bookings.length) {
      list.innerHTML = `<div class="empty"><span class="icon">📅</span><p>No bookings yet.</p><button class="btn btn-neon" onclick="navigate('fields')">Browse Fields</button></div>`;
      return;
    }
    list.innerHTML = bookings.map(b => {
      const sb = {confirmed:'badge-green',cancelled:'badge-red',completed:'badge-grey'}[b.status]||'badge-grey';
      const pb = {paid:'badge-green',pending:'badge-orange',refunded:'badge-grey'}[b.payment_status]||'badge-orange';
      return `
        <div class="booking-card ${b.status==='cancelled'?'cancelled':''}">
          <div class="booking-info">
            <h4>${b.field_name}</h4>
            <p>📍 ${b.field_location||''} · 📅 ${b.booking_date} · ⏰ ${b.start_time}–${b.end_time}</p>
            <div style="display:flex;gap:.5rem;margin-top:.5rem;flex-wrap:wrap">
              <span class="badge ${sb}">${b.status}</span>
              <span class="badge ${pb}">💳 ${b.payment_status||'pending'} · ${b.payment_method||'cash'}</span>
            </div>
          </div>
          <div class="booking-price">
            ${b.total_price} EGP
            <small>#${b.id}</small>
            ${b.status==='confirmed'?`
              <div style="display:flex;gap:.5rem;margin-top:.5rem;flex-wrap:wrap;justify-content:flex-end">
                ${b.payment_status==='pending'?`<button class="btn btn-neon btn-sm" onclick="payBooking(${b.id})">Pay Now</button>`:''}
                <button class="btn btn-danger-neon btn-sm" onclick="cancelBooking(${b.id})">Cancel</button>
              </div>`:'' }
          </div>
        </div>`;
    }).join('');
    animateIn(list);
  } catch(e) {
    document.getElementById('bk-list').innerHTML = `<p class="text-muted">${e.message}</p>`;
  }
}

async function cancelBooking(id) {
  if (!confirm('Cancel this booking?')) return;
  try {
    const res = await api(`/api/bookings/${id}/cancel`, 'PUT');
    toast(res.message);
    renderBookings(document.getElementById('app'));
  } catch(e) { toast(e.message, 'error'); }
}

async function payBooking(id) {
  openModal(`
    <h3 style="font-family:'Orbitron',sans-serif;margin-bottom:1.5rem;color:var(--ng)">Complete Payment</h3>
    <div class="auth-form">
      <div class="form-group">
        <label class="form-label">Payment Method</label>
        <select class="form-control" id="pay-method">
          <option value="cash">Cash on Arrival</option>
          <option value="card">Credit Card</option>
          <option value="online">Online Transfer</option>
        </select>
      </div>
      <button class="btn btn-neon btn-block" onclick="confirmPayment(${id})">Confirm Payment</button>
    </div>`);
}

async function confirmPayment(bookingId) {
  try {
    const res = await api(`/api/payments/${bookingId}/pay`, 'PUT', { method: document.getElementById('pay-method').value });
    toast(`✅ Payment confirmed! ${res.transaction_id}`);
    closeModal();
    renderBookings(document.getElementById('app'));
  } catch(e) { toast(e.message, 'error'); }
}

/* ══════════════════════════════════════════════════════════════════════
   REVIEWS
   ══════════════════════════════════════════════════════════════════════ */
function openReviewModal(fieldId) {
  openModal(`
    <h3 style="font-family:'Orbitron',sans-serif;margin-bottom:1.5rem">Write a Review</h3>
    <div class="auth-form">
      <div class="form-group">
        <label class="form-label">Rating</label>
        <div class="star-input">
          ${[5,4,3,2,1].map(n=>`<input type="radio" name="star" id="star${n}" value="${n}"/><label for="star${n}">★</label>`).join('')}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Comment</label>
        <textarea class="form-control" id="rv-comment" rows="3" placeholder="Share your experience…" style="resize:vertical"></textarea>
      </div>
      <button class="btn btn-neon btn-block" onclick="submitReview(${fieldId})">Submit Review</button>
    </div>`);
}

async function submitReview(fieldId) {
  const rating  = document.querySelector('input[name="star"]:checked')?.value;
  const comment = document.getElementById('rv-comment').value;
  if (!rating) { toast('Please select a rating', 'error'); return; }
  try {
    const res = await api('/api/reviews', 'POST', { field_id: fieldId, rating: parseInt(rating), comment });
    toast(res.message); closeModal(); navigate('field', fieldId);
  } catch(e) { toast(e.message, 'error'); }
}

/* ══════════════════════════════════════════════════════════════════════
   AI RECOMMENDATION
   ══════════════════════════════════════════════════════════════════════ */
async function renderRecommend(app) {
  const today = new Date().toISOString().split('T')[0];
  app.innerHTML = `
    <div class="section" style="padding-top:7rem">
      <div class="recommend-header">
        <div class="ai-badge">🤖 AI POWERED</div>
        <h2>Smart Field Recommendation</h2>
        <p>Our algorithm scores fields by rating, availability, and price to find your perfect match.</p>
        <div class="recommend-form">
          <input class="form-control" type="date" id="rec-date" value="${today}" style="min-width:180px"/>
          <input class="form-control" type="number" id="rec-budget" placeholder="Max budget EGP/hr" style="min-width:200px"/>
          <button class="btn btn-neon" onclick="fetchRecommend()">Get Recommendations</button>
        </div>
      </div>
      <div id="rec-results"></div>
    </div>`;
  animateIn(app.querySelector('.recommend-header'));
  await fetchRecommend();
}

async function fetchRecommend() {
  const date   = document.getElementById('rec-date')?.value   || new Date().toISOString().split('T')[0];
  const budget = document.getElementById('rec-budget')?.value || '';
  const res    = document.getElementById('rec-results');
  if (res) res.innerHTML = '<div class="spinner"></div>';
  try {
    const fields = await api(`/api/recommend?date=${date}&budget=${budget||99999}`);
    if (!res) return;
    if (!fields.length) { res.innerHTML = '<div class="empty"><span class="icon">🤖</span><p>No recommendations for this criteria.</p></div>'; return; }
    const medals = ['🥇','🥈','🥉'];
    const maxScore = Math.max(...fields.map(f=>f.score));
    res.innerHTML = `
      <div style="font-family:'Orbitron',sans-serif;font-size:.85rem;font-weight:700;color:var(--tp);margin-bottom:1.5rem;letter-spacing:.08em">
        TOP ${fields.length} PICKS FOR ${date}
      </div>
      <div class="fields-grid">
        ${fields.map((f,i)=>`
          <div class="field-card" style="cursor:default;position:relative">
            <div style="position:absolute;top:.8rem;right:.8rem;z-index:3;font-size:1.6rem;filter:drop-shadow(0 0 8px rgba(0,255,135,.5))">${medals[i]||''}</div>
            <div class="field-img-wrap">
              <img class="field-img" src="${f.image_url||''}" alt="${f.name}" loading="lazy"/>
              <div class="field-img-overlay"></div>
              <span class="field-surface-badge">${f.surface}</span>
            </div>
            <div class="field-body">
              <div class="field-name">${f.name}</div>
              <div class="field-location">📍 ${f.location}</div>
              <div style="margin-top:.8rem">
                <div style="display:flex;justify-content:space-between;font-size:.75rem;color:var(--tm);margin-bottom:.3rem">
                  <span>AI Score</span><span style="color:var(--ng);font-weight:700">${f.score}</span>
                </div>
                <div style="height:4px;background:rgba(255,255,255,.06);border-radius:100px;overflow:hidden">
                  <div style="height:100%;width:${Math.round(f.score/maxScore*100)}%;background:linear-gradient(90deg,var(--ng),var(--nb));box-shadow:0 0 8px var(--ng);border-radius:100px"></div>
                </div>
              </div>
              <div class="field-meta">
                <div class="field-price">${f.price_per_hour} <small>EGP/hr</small></div>
                <div class="field-rating">★ ${f.avg_rating||'N/A'}</div>
              </div>
            </div>
            <div class="field-footer">
              <button class="btn btn-neon btn-sm" onclick="navigate('field',${f.id})">Book Now</button>
            </div>
          </div>`).join('')}
      </div>
      <div style="margin-top:2rem;background:rgba(0,255,135,.04);border:1px solid rgba(0,255,135,.1);border-radius:var(--r);padding:1rem;font-size:.82rem;color:var(--ts)">
        🤖 <strong style="color:var(--ng)">Score formula:</strong> (Rating × 20) − (Bookings today × 5) + Price score. Higher = better pick.
      </div>`;
    animateCards('.field-card');
    setTimeout(() => initAllTilts(), 100);
  } catch(e) {
    if (res) res.innerHTML = `<p class="text-muted">${e.message}</p>`;
  }
}

/* ══════════════════════════════════════════════════════════════════════
   AUTH
   ══════════════════════════════════════════════════════════════════════ */
function renderLogin(app) {
  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <h2>Welcome Back</h2>
        <p class="subtitle">Login to book your favourite football fields</p>
        <div class="auth-form">
          <div class="form-group"><label class="form-label">Email</label><input class="form-control" type="email" id="l-email" placeholder="you@email.com"/></div>
          <div class="form-group"><label class="form-label">Password</label><input class="form-control" type="password" id="l-pass" placeholder="••••••••" onkeydown="if(event.key==='Enter')doLogin()"/></div>
          <button class="btn btn-neon btn-block" onclick="doLogin()">Login</button>
          <button class="btn btn-glass btn-block" onclick="navigate('admin-login')">⚙️ Admin Login</button>
        </div>
        <div class="demo-hint"><strong>Demo:</strong> ahmed@email.com / pass123</div>
        <div class="auth-footer">No account? <a onclick="navigate('register')">Sign up free</a></div>
      </div>
    </div>`;
  animateIn(app.querySelector('.auth-card'));
}

function renderRegister(app) {
  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <h2>Create Account</h2>
        <p class="subtitle">Join thousands of players booking daily</p>
        <div class="auth-form">
          <div class="form-group"><label class="form-label">Full Name</label><input class="form-control" id="r-name" placeholder="Your name"/></div>
          <div class="form-group"><label class="form-label">Email</label><input class="form-control" type="email" id="r-email" placeholder="you@email.com"/></div>
          <div class="form-group"><label class="form-label">Phone</label><input class="form-control" id="r-phone" placeholder="05xxxxxxxx"/></div>
          <div class="form-group"><label class="form-label">Password</label><input class="form-control" type="password" id="r-pass" placeholder="Min 6 characters"/></div>
          <button class="btn btn-neon btn-block" onclick="doRegister()">Create Account</button>
        </div>
        <div class="auth-footer">Have an account? <a onclick="navigate('login')">Login</a></div>
      </div>
    </div>`;
  animateIn(app.querySelector('.auth-card'));
}

async function doLogin() {
  const email = document.getElementById('l-email').value;
  const pass  = document.getElementById('l-pass').value;
  if (!email || !pass) { toast('Please fill all fields', 'error'); return; }
  try {
    const res = await api('/api/login', 'POST', { email, password: pass });
    STATE.user = res.user;
    toast(`Welcome back, ${res.user.name}! ⚽`);
    renderNav(); navigate('home');
  } catch(e) { toast(e.message, 'error'); }
}

async function doRegister() {
  const name=document.getElementById('r-name').value, email=document.getElementById('r-email').value;
  const phone=document.getElementById('r-phone').value, pass=document.getElementById('r-pass').value;
  if (!name||!email||!pass) { toast('Please fill all required fields', 'error'); return; }
  if (pass.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }
  try {
    const res = await api('/api/register', 'POST', { name, email, phone, password: pass });
    STATE.user = { id: res.user_id, name: res.name, is_admin: false };
    toast(`Account created! Welcome, ${res.name}! 🎉`);
    renderNav(); navigate('home');
  } catch(e) { toast(e.message, 'error'); }
}

async function doAdminLogin() {
  const u=document.getElementById('a-user').value, p=document.getElementById('a-pass').value;
  try {
    const res = await api('/api/admin/login', 'POST', { username: u, password: p });
    STATE.user = { id: 0, name: res.username, is_admin: true };
    toast(`Admin access granted ⚙`);
    renderNav(); navigate('admin');
  } catch(e) { toast(e.message, 'error'); }
}

async function logout() {
  await api('/api/logout', 'POST');
  STATE.user = null; renderNav(); navigate('home');
  toast('Logged out', 'info');
}

/* ══════════════════════════════════════════════════════════════════════
   ADMIN DASHBOARD
   ══════════════════════════════════════════════════════════════════════ */
async function renderAdmin(app) {
  if (!STATE.user?.is_admin) { navigate('login'); return; }
  app.innerHTML = `
    <div class="section" style="padding-top:7rem">
      <div class="section-header">
        <div><div class="section-title">Admin Dashboard</div><p class="section-sub">COMMAND CENTER</p></div>
        <button class="btn btn-glass btn-sm" onclick="navigate('admin')" title="تحديث البيانات من قاعدة البيانات">🔄 Refresh</button>
      </div>
      <div id="admin-stats" class="admin-grid"><div class="spinner"></div></div>
      <div class="tabs">
        <button class="tab-btn active" onclick="switchTab('t-overview',this)">📊 Overview</button>
        <button class="tab-btn" onclick="switchTab('t-bookings',this);loadAdminBookings()">📅 Bookings</button>
        <button class="tab-btn" onclick="switchTab('t-fields',this);loadAdminFields()">🏟️ Fields</button>
        <button class="tab-btn" onclick="switchTab('t-users',this);loadAdminUsers()">👥 Users</button>
        <button class="tab-btn" onclick="switchTab('t-payments',this);loadAdminPayments()">💳 Payments</button>
        <button class="tab-btn" onclick="switchTab('t-reviews',this);loadAdminReviews()">⭐ Reviews</button>
        <button class="tab-btn" onclick="switchTab('t-add',this)">+ Add Field</button>
      </div>
      <div id="t-overview"  class="tab-panel active"><div id="revenue-chart"><div class="spinner"></div></div></div>
      <div id="t-bookings"  class="tab-panel"><div id="admin-bookings"><div class="spinner"></div></div></div>
      <div id="t-fields"    class="tab-panel"><div id="admin-fields-list"><div class="spinner"></div></div></div>
      <div id="t-users"     class="tab-panel"><div id="admin-users"><div class="spinner"></div></div></div>
      <div id="t-payments"  class="tab-panel"><div id="admin-payments"><div class="spinner"></div></div></div>
      <div id="t-reviews"   class="tab-panel"><div id="admin-reviews"><div class="spinner"></div></div></div>
      <div id="t-add"       class="tab-panel">${addFieldForm()}</div>
    </div>`;

  try {
    const s = await api('/api/admin/stats');
    document.getElementById('admin-stats').innerHTML = [
      {icon:'[U]',label:'Total Users',value:s.total_users},
      {icon:'[F]',label:'Active Fields',value:s.total_fields},
      {icon:'[B]',label:'Total Bookings',value:s.total_bookings},
      {icon:'💰',label:'Revenue (EGP)',value:s.total_revenue.toLocaleString()},
      {icon:'📆',label:"Today's Bookings",value:s.today_bookings},
      {icon:'⏳',label:'Pending Payments',value:s.pending_payments},
    ].map(c=>`
      <div class="stat-card">
        <div class="stat-icon">${c.icon}</div>
        <div class="stat-label">${c.label}</div>
        <div class="stat-value">${c.value}</div>
      </div>`).join('');

    animateStats();

    const maxRev = Math.max(...s.revenue_by_field.map(f=>f.revenue), 1);
    document.getElementById('revenue-chart').innerHTML = `
      <div style="font-family:'Orbitron',sans-serif;font-size:.85rem;font-weight:700;color:var(--tp);margin-bottom:1.2rem;letter-spacing:.08em">REVENUE BY FIELD</div>
      <div class="revenue-bars">
        ${s.revenue_by_field.map(f=>`
          <div class="rev-bar-row">
            <div class="rev-bar-label" title="${f.name}">${f.name}</div>
            <div class="rev-bar-track"><div class="rev-bar-fill" style="width:${Math.max(2, Math.round(f.revenue/maxRev*100))}%"></div></div>
            <div class="rev-bar-amount">${f.revenue.toLocaleString()}</div>
          </div>`).join('')}
      </div>
      <div style="margin-top:2rem;font-family:'Orbitron',sans-serif;font-size:.85rem;font-weight:700;color:var(--tp);margin-bottom:1rem;letter-spacing:.08em">RECENT BOOKINGS</div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>#</th><th>User</th><th>Field</th><th>Date</th><th>Time</th><th>Price</th><th>Status</th></tr></thead>
          <tbody>
            ${s.recent_bookings.map(b=>`
              <tr>
                <td>#${b.id}</td><td>${b.user}</td><td>${b.field}</td>
                <td>${b.booking_date}</td><td>${b.start_time}–${b.end_time}</td>
                <td style="color:var(--ng);font-weight:700">${b.total_price} EGP</td>
                <td><span class="badge badge-${b.status==='confirmed'?'green':b.status==='cancelled'?'red':'grey'}">${b.status}</span></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  } catch(e) {
    document.getElementById('admin-stats').innerHTML = `<p class="text-muted">${e.message}</p>`;
  }

  // Lazy load tabs
  ['t-bookings','t-fields','t-users'].forEach(tabId => {
    document.getElementById(tabId)?.addEventListener('tab-activated', async function() {
      if (this.dataset.loaded) return; this.dataset.loaded = 1;
      if (tabId === 't-bookings') {
        try {
          const bks = await api('/api/bookings');
          document.getElementById('admin-bookings').innerHTML = `<div class="table-wrap"><table><thead><tr><th>#</th><th>User</th><th>Field</th><th>Date</th><th>Time</th><th>Price</th><th>Status</th><th>Payment</th><th>Action</th></tr></thead><tbody>${bks.map(b=>`<tr><td>#${b.id}</td><td>${b.user_name}</td><td>${b.field_name}</td><td>${b.booking_date}</td><td>${b.start_time}–${b.end_time}</td><td style="color:var(--ng);font-weight:700">${b.total_price}</td><td><span class="badge badge-${b.status==='confirmed'?'green':'red'}">${b.status}</span></td><td><span class="badge badge-${b.payment_status==='paid'?'green':'orange'}">${b.payment_status||'pending'}</span></td><td>${b.status==='confirmed'?`<button class="btn btn-danger-neon btn-sm" onclick="cancelBooking(${b.id})">Cancel</button>`:'—'}</td></tr>`).join('')}</tbody></table></div>`;
        } catch {}
      }
      if (tabId === 't-fields') {
        try {
          const fields = await api('/api/fields');
          document.getElementById('admin-fields-list').innerHTML = `<div class="table-wrap"><table><thead><tr><th>#</th><th>Name</th><th>Location</th><th>Surface</th><th>Price/hr</th><th>Rating</th><th>Action</th></tr></thead><tbody>${fields.map(f=>`<tr><td>#${f.id}</td><td><strong style="color:var(--tp)">${f.name}</strong></td><td>${f.location}</td><td>${f.surface}</td><td style="color:var(--ng);font-weight:700">${f.price_per_hour} EGP</td><td>★ ${f.avg_rating||'—'} (${f.review_count||0})</td><td><button class="btn btn-danger-neon btn-sm" onclick="deactivateField(${f.id},this)">Remove</button></td></tr>`).join('')}</tbody></table></div>`;
        } catch {}
      }
      if (tabId === 't-users') {
        try {
          const users = await api('/api/admin/users');
          document.getElementById('admin-users').innerHTML = `<div class="table-wrap"><table><thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Bookings</th><th>Joined</th></tr></thead><tbody>${users.map(u=>`<tr><td>#${u.id}</td><td><strong style="color:var(--tp)">${u.name}</strong></td><td>${u.email}</td><td>${u.phone||'—'}</td><td style="color:var(--ng);font-weight:700">${u.booking_count}</td><td>${(u.created_at||'').split('T')[0]}</td></tr>`).join('')}</tbody></table></div>`;
        } catch {}
      }
    });
  });
}

function switchTab(id, btn) {
  // Scope to the nearest tabs container to avoid cross-page contamination
  const container = btn.closest('.tabs')?.parentElement || document;
  container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  btn.closest('.tabs').querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById(id);
  if (panel) panel.classList.add('active');
  btn.classList.add('active');
  // Trigger lazy-load via custom event (not click, to avoid bubbling issues)
  panel?.dispatchEvent(new CustomEvent('tab-activated'));
}


/* ══════════════════════════════════════════════════════════════════════
   ADMIN LIVE LOADERS — كل function بتجيب بياناتها live من الـ DB
   أي تغيير في DB Browser يظهر فوراً لما تضغط الـ tab أو Refresh
   ══════════════════════════════════════════════════════════════════════ */

async function loadAdminBookings() {
  const el = document.getElementById('admin-bookings');
  if (!el) return;
  el.innerHTML = '<div class="spinner"></div>';
  try {
    const bks = await api('/api/bookings');
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:.5rem">
        <div style="font-family:'Orbitron',sans-serif;font-size:.8rem;color:var(--ng)">${bks.length} BOOKINGS</div>
        <button class="btn btn-glass btn-sm" onclick="loadAdminBookings()">🔄 Refresh</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>#</th><th>User</th><th>Field</th><th>Date</th><th>Time</th><th>Price</th><th>Status</th><th>Payment</th><th>Actions</th></tr></thead>
        <tbody>
          ${bks.map(b => `<tr>
            <td style="color:var(--ng);font-weight:700">#${b.id}</td>
            <td>${b.user_name}</td>
            <td>${b.field_name}</td>
            <td>${b.booking_date}</td>
            <td style="white-space:nowrap">${b.start_time} – ${b.end_time}</td>
            <td style="color:var(--ng);font-weight:700">${b.total_price} EGP</td>
            <td><span class="badge badge-${b.status==='confirmed'?'green':b.status==='cancelled'?'red':'grey'}">${b.status}</span></td>
            <td><span class="badge badge-${b.payment_status==='paid'?'green':'orange'}">${b.payment_status||'pending'}</span></td>
            <td style="display:flex;gap:.4rem;flex-wrap:wrap">
              ${b.status==='confirmed'?`<button class="btn btn-danger-neon btn-sm" onclick="adminCancelBooking(${b.id})">Cancel</button>`:''}
              <button class="btn btn-danger-neon btn-sm" onclick="adminDeleteBooking(${b.id},this)">🗑</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table></div>`;
  } catch(e) { el.innerHTML = `<p class="text-muted">${e.message}</p>`; }
}

async function loadAdminFields() {
  const el = document.getElementById('admin-fields-list');
  if (!el) return;
  el.innerHTML = '<div class="spinner"></div>';
  try {
    const fields = await api('/api/fields');
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:.5rem">
        <div style="font-family:'Orbitron',sans-serif;font-size:.8rem;color:var(--ng)">${fields.length} ACTIVE FIELDS</div>
        <button class="btn btn-glass btn-sm" onclick="loadAdminFields()">🔄 Refresh</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>#</th><th>Name</th><th>Location</th><th>Surface</th><th>Price/hr</th><th>Capacity</th><th>Rating</th><th>Active</th><th>Actions</th></tr></thead>
        <tbody>
          ${fields.map(f => `<tr>
            <td style="color:var(--ng);font-weight:700">#${f.id}</td>
            <td><strong style="color:var(--tp)">${f.name}</strong></td>
            <td>${f.location}</td>
            <td>${f.surface}</td>
            <td style="color:var(--ng);font-weight:700">${f.price_per_hour} EGP</td>
            <td>${f.capacity}</td>
            <td>★ ${f.avg_rating||'—'} (${f.review_count||0})</td>
            <td><span class="badge badge-green">✓ Active</span></td>
            <td><button class="btn btn-danger-neon btn-sm" onclick="deactivateField(${f.id},this)">🗑 Delete</button></td>
          </tr>`).join('')}
        </tbody>
      </table></div>`;
  } catch(e) { el.innerHTML = `<p class="text-muted">${e.message}</p>`; }
}

async function loadAdminUsers() {
  const el = document.getElementById('admin-users');
  if (!el) return;
  el.innerHTML = '<div class="spinner"></div>';
  try {
    const users = await api('/api/admin/users');
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:.5rem">
        <div style="font-family:'Orbitron',sans-serif;font-size:.8rem;color:var(--ng)">${users.length} USERS</div>
        <button class="btn btn-glass btn-sm" onclick="loadAdminUsers()">🔄 Refresh</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Bookings</th><th>Joined</th><th>Actions</th></tr></thead>
        <tbody>
          ${users.map(u => `<tr>
            <td style="color:var(--ng);font-weight:700">#${u.id}</td>
            <td><strong style="color:var(--tp)">${u.name}</strong></td>
            <td>${u.email}</td>
            <td>${u.phone||'—'}</td>
            <td style="color:var(--ng);font-weight:700">${u.booking_count}</td>
            <td>${(u.created_at||'').split('T')[0]}</td>
            <td><button class="btn btn-danger-neon btn-sm" onclick="adminDeleteUser(${u.id},this)">🗑 Delete</button></td>
          </tr>`).join('')}
        </tbody>
      </table></div>`;
  } catch(e) { el.innerHTML = `<p class="text-muted">${e.message}</p>`; }
}

async function loadAdminPayments() {
  const el = document.getElementById('admin-payments');
  if (!el) return;
  el.innerHTML = '<div class="spinner"></div>';
  try {
    const payments = await api('/api/payments/all');
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:.5rem">
        <div style="font-family:'Orbitron',sans-serif;font-size:.8rem;color:var(--ng)">${payments.length} PAYMENTS</div>
        <button class="btn btn-glass btn-sm" onclick="loadAdminPayments()">🔄 Refresh</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>#</th><th>Booking</th><th>User</th><th>Field</th><th>Amount</th><th>Method</th><th>Status</th><th>Transaction</th><th>Actions</th></tr></thead>
        <tbody>
          ${payments.map(p => `<tr>
            <td style="color:var(--ng);font-weight:700">#${p.id}</td>
            <td>#${p.booking_id}</td>
            <td>${p.user_name}</td>
            <td>${p.field_name}</td>
            <td style="color:var(--ng);font-weight:700">${p.amount} EGP</td>
            <td>${p.method}</td>
            <td><span class="badge badge-${p.status==='paid'?'green':p.status==='refunded'?'grey':'orange'}">${p.status}</span></td>
            <td style="font-size:.75rem;color:var(--tm)">${p.transaction_id||'—'}</td>
            <td style="display:flex;gap:.4rem;flex-wrap:wrap">
              ${p.status==='pending'?`<button class="btn btn-neon btn-sm" onclick="adminMarkPaid(${p.id})">Mark Paid</button>`:''}
              <button class="btn btn-danger-neon btn-sm" onclick="adminDeletePayment(${p.id},this)">🗑</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table></div>`;
  } catch(e) { el.innerHTML = `<p class="text-muted">${e.message}</p>`; }
}

async function loadAdminReviews() {
  const el = document.getElementById('admin-reviews');
  if (!el) return;
  el.innerHTML = '<div class="spinner"></div>';
  try {
    const reviews = await api('/api/reviews/all');
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:.5rem">
        <div style="font-family:'Orbitron',sans-serif;font-size:.8rem;color:var(--ng)">${reviews.length} REVIEWS</div>
        <button class="btn btn-glass btn-sm" onclick="loadAdminReviews()">🔄 Refresh</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>#</th><th>User</th><th>Field</th><th>Rating</th><th>Comment</th><th>Date</th><th>Actions</th></tr></thead>
        <tbody>
          ${reviews.map(r => `<tr>
            <td style="color:var(--ng);font-weight:700">#${r.id}</td>
            <td>${r.user_name}</td>
            <td>${r.field_name}</td>
            <td style="color:#ffc107;font-weight:700">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</td>
            <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.comment||'—'}</td>
            <td>${(r.created_at||'').split('T')[0]}</td>
            <td><button class="btn btn-danger-neon btn-sm" onclick="adminDeleteReview(${r.id},this)">🗑 Delete</button></td>
          </tr>`).join('')}
        </tbody>
      </table></div>`;
  } catch(e) { el.innerHTML = `<p class="text-muted">${e.message}</p>`; }
}

/* ── Admin Action Helpers ───────────────────────────────────────────────────── */
async function adminCancelBooking(id) {
  if (!confirm('Cancel this booking?')) return;
  try { await api(`/api/bookings/${id}/cancel`, 'PUT'); toast('Booking cancelled'); loadAdminBookings(); }
  catch(e) { toast(e.message, 'error'); }
}

async function adminDeleteBooking(id, btn) {
  if (!confirm('Delete this booking permanently?')) return;
  try { await api(`/api/bookings/${id}`, 'DELETE'); btn.closest('tr').remove(); toast('Booking deleted ✅'); }
  catch(e) { toast(e.message, 'error'); }
}

async function adminDeleteUser(id, btn) {
  if (!confirm('Delete this user and all their data permanently?')) return;
  try { await api(`/api/users/${id}`, 'DELETE'); btn.closest('tr').remove(); toast('User deleted ✅'); }
  catch(e) { toast(e.message, 'error'); }
}

async function adminMarkPaid(id) {
  try { await api(`/api/payments/${id}`, 'PUT', {status:'paid', method:'cash'}); toast('Marked as paid ✅'); loadAdminPayments(); }
  catch(e) { toast(e.message, 'error'); }
}

async function adminDeletePayment(id, btn) {
  if (!confirm('Delete this payment record?')) return;
  try { await api(`/api/payments/${id}`, 'DELETE'); btn.closest('tr').remove(); toast('Payment deleted ✅'); }
  catch(e) { toast(e.message, 'error'); }
}

async function adminDeleteReview(id, btn) {
  if (!confirm('Delete this review?')) return;
  try { await api(`/api/reviews/${id}`, 'DELETE'); btn.closest('tr').remove(); toast('Review deleted ✅'); }
  catch(e) { toast(e.message, 'error'); }
}

async function deactivateField(id, btn) {
  if (!confirm('هتمسح الملعع ده نهائياً من قاعدة البيانات؟ مفيش رجعة!')) return;
  try {
    await api(`/api/admin/fields/${id}`, 'DELETE');
    btn.closest('tr').remove();
    toast('✅ تم حذف الملعب نهائياً من قاعدة البيانات');
  }
  catch(e) { toast(e.message, 'error'); }
}

function addFieldForm() {
  return `
    <div style="max-width:600px">
      <div style="font-family:'Orbitron',sans-serif;font-size:.85rem;font-weight:700;color:var(--tp);margin-bottom:1.5rem;letter-spacing:.08em">ADD NEW FIELD</div>
      <div class="auth-form">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Field Name</label><input class="form-control" id="af-name" placeholder="e.g. Cairo Sports Hub"/></div>
          <div class="form-group"><label class="form-label">Location</label><input class="form-control" id="af-location" placeholder="e.g. Nasr City"/></div>
        </div>
        <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" id="af-desc" rows="2" style="resize:vertical" placeholder="Describe the field…"></textarea></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Price per Hour (EGP)</label><input class="form-control" type="number" id="af-price" placeholder="250"/></div>
          <div class="form-group"><label class="form-label">Capacity</label><input class="form-control" type="number" id="af-cap" placeholder="22"/></div>
        </div>
        <div class="form-group"><label class="form-label">Surface</label><select class="form-control" id="af-surface"><option>Natural Grass</option><option>Artificial Turf</option><option>Hybrid Grass</option></select></div>
        <div class="form-group"><label class="form-label">Amenities (comma-separated)</label><input class="form-control" id="af-amenities" placeholder="Floodlights, Parking, Showers"/></div>
        <div class="form-group"><label class="form-label">Image URL</label><input class="form-control" id="af-img" placeholder="https://…"/></div>
        <button class="btn btn-neon" onclick="submitAddField()">Add Field</button>
      </div>
    </div>`;
}

async function submitAddField() {
  const amenities = (document.getElementById('af-amenities').value||'').split(',').map(s=>s.trim()).filter(Boolean);
  try {
    const res = await api('/api/admin/fields', 'POST', {
      name: document.getElementById('af-name').value, location: document.getElementById('af-location').value,
      description: document.getElementById('af-desc').value, price_per_hour: parseFloat(document.getElementById('af-price').value),
      capacity: parseInt(document.getElementById('af-cap').value)||22, surface: document.getElementById('af-surface').value,
      amenities, image_url: document.getElementById('af-img').value,
    });
    toast(`✅ ${res.message}`); navigate('admin');
  } catch(e) { toast(e.message, 'error'); }
}

/* ══════════════════════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════════════
   DATABASE PAGE — Live viewer + ERD + Schema
   ══════════════════════════════════════════════════════════════════════ */

async function renderDatabase(app) {
  if (!STATE.user?.is_admin) { navigate('login'); return; }

  app.innerHTML = `
    <div class="section" style="padding-top:7rem">
      <div class="section-header">
        <div><div class="section-title">🗄 Database Viewer</div><p class="section-sub">LIVE DATA · ERD · SQL SCHEMA</p></div>
      </div>

      <div class="tabs">
        <button class="tab-btn active" onclick="switchTab('db-t-tables',this)">📋 Tables</button>
        <button class="tab-btn" onclick="switchTab('db-t-erd',this)">🔗 ERD Diagram</button>
        <button class="tab-btn" onclick="switchTab('db-t-schema',this)">📄 SQL Schema</button>
      </div>

      <!-- TABLES TAB -->
      <div id="db-t-tables" class="tab-panel active">
        <div id="db-table-list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1rem;margin-bottom:2rem">
          <div class="spinner"></div>
        </div>
        <div id="db-table-data"></div>
      </div>

      <!-- ERD TAB -->
      <div id="db-t-erd" class="tab-panel">
        <div style="background:rgba(0,255,135,.03);border:1px solid rgba(0,255,135,.1);border-radius:var(--rx);padding:2rem;overflow-x:auto">
          <svg id="erd-svg" viewBox="0 0 780 580" style="width:100%;max-width:780px;display:block;margin:0 auto"></svg>
        </div>
        <div style="margin-top:1rem;font-size:.8rem;color:var(--tm);display:flex;gap:2rem;flex-wrap:wrap">
          <span>━━ One-to-Many (1:N)</span>
          <span style="color:var(--nb)">━━ One-to-One (1:1)</span>
          <span style="color:rgba(255,255,255,.3)">- - Foreign Key</span>
        </div>
      </div>

      <!-- SCHEMA TAB -->
      <div id="db-t-schema" class="tab-panel">
        <div id="schema-content"></div>
      </div>
    </div>`;

  animateIn(app.querySelector('.section'));

  // Load table list
  try {
    const tables = await api('/api/db/tables');
    const listEl = document.getElementById('db-table-list');
    listEl.innerHTML = tables.map(t => `
      <div class="stat-card" onclick="loadTableData('${t.name}')" style="cursor:pointer;transition:var(--tr)"
           onmouseover="this.style.borderColor='rgba(0,255,135,.3)'" onmouseout="this.style.borderColor='rgba(255,255,255,.07)'">
        <div class="stat-icon">${{users:'👥',admins:'🔑',fields:'🏟️',bookings:'📅',payments:'💳',reviews:'⭐'}[t.name]||'📋'}</div>
        <div class="stat-label">${t.name}</div>
        <div class="stat-value" style="font-size:1.6rem">${t.rows}</div>
        <div style="font-size:.72rem;color:var(--tm);margin-top:.3rem">${t.columns.length} columns</div>
      </div>`).join('');
    animateStats();
    // Auto-load first table
    if (tables.length) loadTableData(tables[0].name);
    window._DB_TABLES = tables;
  } catch(e) {
    document.getElementById('db-table-list').innerHTML = `<p class="text-muted">${e.message}</p>`;
  }

  // Draw ERD when tab is activated
  document.getElementById('db-t-erd').addEventListener('tab-activated', function() {
    if (this.dataset.drawn) return;
    this.dataset.drawn = 1;
    // Small delay so the panel is visible before drawing SVG
    setTimeout(drawERD, 80);
  });

  // Load schema when tab is activated
  document.getElementById('db-t-schema').addEventListener('tab-activated', async function() {
    if (this.dataset.loaded) return;
    this.dataset.loaded = 1;
    const el = document.getElementById('schema-content');
    el.innerHTML = '<div class="spinner"></div>';
    try {
      const schemas = await api('/api/db/schema');
      el.innerHTML = schemas.map(s => `
        <div style="margin-bottom:1.5rem">
          <div style="font-family:'Orbitron',sans-serif;font-size:.8rem;font-weight:700;color:var(--ng);letter-spacing:.1em;margin-bottom:.6rem;text-transform:uppercase">
            ${s.name}
          </div>
          <pre style="background:rgba(0,0,0,.4);border:1px solid rgba(0,255,135,.12);border-radius:var(--rs);
                      padding:1.2rem;overflow-x:auto;font-size:.78rem;line-height:1.8;color:var(--ts);
                      white-space:pre-wrap;word-break:break-word">${escHtml(s.sql)};</pre>
        </div>`).join('');
      if (typeof gsap !== 'undefined')
        gsap.fromTo('#schema-content > div', {opacity:0,y:15},{opacity:1,y:0,duration:.4,stagger:.07});
    } catch(e) {
      el.innerHTML = `<p class="text-muted">Error: ${e.message}</p>`;
    }
  });
}

function escHtml(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function loadTableData(tableName) {
  // Highlight selected card
  document.querySelectorAll('#db-table-list .stat-card').forEach(c => {
    const isThis = c.querySelector('.stat-label').textContent === tableName;
    c.style.borderColor = isThis ? 'var(--ng)' : 'rgba(255,255,255,.07)';
    c.style.boxShadow   = isThis ? '0 0 20px rgba(0,255,135,.1)' : '';
  });

  const el = document.getElementById('db-table-data');
  el.innerHTML = '<div class="spinner"></div>';
  try {
    const data = await api(`/api/db/table/${tableName}`);
    if (!data.rows.length) { el.innerHTML = '<p class="text-muted" style="padding:1rem">No records found.</p>'; return; }
    const cols = Object.keys(data.rows[0]);
    const colColors = {id:'var(--ng)',user_id:'var(--nb)',field_id:'var(--nb)',booking_id:'var(--nb)',password:'var(--tm)'};

    el.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.8rem;flex-wrap:wrap;gap:.5rem">
        <div style="font-family:'Orbitron',sans-serif;font-size:.85rem;font-weight:700;color:var(--tp);letter-spacing:.08em">
          ${tableName.toUpperCase()} — ${data.total} records
        </div>
        <div style="font-size:.8rem;color:var(--tm)">Page ${data.page} / ${data.pages}</div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>${cols.map(c => `<th style="color:${colColors[c]||'var(--ng)'}">${c}</th>`).join('')}</tr></thead>
          <tbody>
            ${data.rows.map(row => `<tr>${cols.map(c => {
              const v = row[c];
              const color = c==='id' ? 'var(--ng)' : c.endsWith('_id') ? 'var(--nb)' : c==='status'&&v==='confirmed' ? 'var(--ng)' : c==='status'&&v==='cancelled' ? '#ff5555' : c==='password' ? 'var(--tm)' : '';
              return `<td style="${color?'color:'+color+';font-weight:700':''}">${v===null?'<span style="color:var(--tm);font-style:italic">null</span>':(String(v).length>40?String(v).slice(0,40)+'…':v)}</td>`;
            }).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </div>
      ${data.pages > 1 ? `<div style="display:flex;gap:.5rem;margin-top:1rem;justify-content:center">
        ${data.page > 1 ? `<button class="btn btn-glass btn-sm" onclick="loadTableDataPage('${tableName}',${data.page-1})">← Prev</button>` : ''}
        ${data.page < data.pages ? `<button class="btn btn-glass btn-sm" onclick="loadTableDataPage('${tableName}',${data.page+1})">Next →</button>` : ''}
      </div>` : ''}`;
    if (typeof gsap !== 'undefined') gsap.fromTo('#db-table-data table tbody tr', {opacity:0,x:-10},{opacity:1,x:0,duration:.3,stagger:.03});
  } catch(e) {
    el.innerHTML = `<p class="text-muted">${e.message}</p>`;
  }
}

async function loadTableDataPage(table, page) {
  const el = document.getElementById('db-table-data');
  el.innerHTML = '<div class="spinner"></div>';
  try {
    const data = await api(`/api/db/table/${table}?page=${page}`);
    // Re-use loadTableData logic by calling the function
    await loadTableData(table);
  } catch {}
}

/* ── ERD SVG Drawing — full DOM-based, no innerHTML ─────────────────────── */
function drawERD() {
  const svg = document.getElementById('erd-svg');
  if (!svg) return;
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs = {}, text = null) {
    const e = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    if (text !== null) e.textContent = text;
    return e;
  }

  // Defs / filter
  const defs = el('defs');
  const filter = el('filter', { id:'glow', x:'-30%', y:'-30%', width:'160%', height:'160%' });
  const blur = el('feGaussianBlur', { stdDeviation:'3', result:'blur' });
  const merge = el('feMerge');
  merge.appendChild(el('feMergeNode', { in:'blur' }));
  merge.appendChild(el('feMergeNode', { in:'SourceGraphic' }));
  filter.appendChild(blur); filter.appendChild(merge);
  defs.appendChild(filter);
  svg.appendChild(defs);

  const ROW_H = 19, HEAD_H = 36, PAD = 8;

  const tables = {
    users:    { x:15,  y:30,  w:165, color:'#00ff87', label:'USERS',
                cols:[{n:'id',pk:true},{n:'name'},{n:'email'},{n:'password'},{n:'phone'},{n:'created_at'}] },
    fields:   { x:295, y:15,  w:185, color:'#00d4ff', label:'FIELDS',
                cols:[{n:'id',pk:true},{n:'name'},{n:'location'},{n:'price_per_hour'},{n:'capacity'},{n:'surface'},{n:'is_active'}] },
    bookings: { x:185, y:310, w:185, color:'#ffc107', label:'BOOKINGS',
                cols:[{n:'id',pk:true},{n:'user_id',fk:true},{n:'field_id',fk:true},{n:'booking_date'},{n:'start_time'},{n:'end_time'},{n:'total_price'},{n:'status'}] },
    payments: { x:425, y:320, w:175, color:'#ff6b6b', label:'PAYMENTS',
                cols:[{n:'id',pk:true},{n:'booking_id',fk:true},{n:'amount'},{n:'method'},{n:'status'},{n:'transaction_id'}] },
    reviews:  { x:530, y:25,  w:165, color:'#bf00ff', label:'REVIEWS',
                cols:[{n:'id',pk:true},{n:'user_id',fk:true},{n:'field_id',fk:true},{n:'rating'},{n:'comment'}] },
    admins:   { x:15,  y:335, w:155, color:'#888899', label:'ADMINS',
                cols:[{n:'id',pk:true},{n:'username'},{n:'password'}] },
  };

  function tH(t) { return HEAD_H + t.cols.length * ROW_H + PAD; }

  // Draw connections
  const conns = [
    { f:'users',    fp:[1,0.5],  t:'bookings', tp:[0,0.25], color:'#00ff87', label:'1:N' },
    { f:'fields',   fp:[0.5,1],  t:'bookings', tp:[0.4,0],  color:'#00d4ff', label:'1:N' },
    { f:'bookings', fp:[1,0.5],  t:'payments', tp:[0,0.5],  color:'#ffc107', label:'1:1' },
    { f:'users',    fp:[1,0.3],  t:'reviews',  tp:[0.3,1],  color:'#bf00ff', label:'1:N' },
    { f:'fields',   fp:[1,0.3],  t:'reviews',  tp:[0,0.5],  color:'#bf00ff', label:'1:N' },
  ];

  conns.forEach(c => {
    const ft = tables[c.f], tt = tables[c.t];
    const x1 = ft.x + ft.w * c.fp[0];
    const y1 = ft.y + tH(ft)  * c.fp[1];
    const x2 = tt.x + tt.w * c.tp[0];
    const y2 = tt.y + tH(tt)  * c.tp[1];
    const mx = (x1+x2)/2, my = (y1+y2)/2;

    svg.appendChild(el('path', {
      d: `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`,
      fill:'none', stroke: c.color, 'stroke-width':'1.5',
      'stroke-dasharray':'6 3', opacity:'.55'
    }));
    svg.appendChild(el('text', {
      x: mx, y: my - 6,
      'text-anchor':'middle', fill: c.color,
      'font-size':'9', 'font-family':'Orbitron,sans-serif', 'font-weight':'700'
    }, c.label));
  });

  // Draw tables
  Object.entries(tables).forEach(([name, t]) => {
    const h = tH(t);
    const g = el('g');

    // Card background
    g.appendChild(el('rect', { x:t.x, y:t.y, width:t.w, height:h, rx:'10',
      fill:'rgba(6,13,20,.95)', stroke:t.color, 'stroke-width':'1.5', filter:'url(#glow)' }));

    // Header background
    g.appendChild(el('rect', { x:t.x, y:t.y, width:t.w, height:HEAD_H, rx:'10',
      fill:t.color, opacity:'.18' }));
    g.appendChild(el('rect', { x:t.x, y:t.y+HEAD_H-3, width:t.w, height:'3',
      fill:t.color, opacity:'.5' }));

    // Header label
    g.appendChild(el('text', {
      x: t.x + t.w/2, y: t.y + HEAD_H/2 + 5,
      'text-anchor':'middle', fill:t.color,
      'font-size':'11', 'font-family':'Orbitron,sans-serif', 'font-weight':'900',
      filter:'url(#glow)'
    }, t.label));

    // Column rows
    t.cols.forEach((col, i) => {
      const cy = t.y + HEAD_H + PAD/2 + i * ROW_H + 13;
      const color = col.pk ? t.color : col.fk ? '#00d4ff' : 'rgba(180,210,255,.65)';
      const prefix = col.pk ? '▶ ' : col.fk ? '→ ' : '  ';
      g.appendChild(el('text', {
        x: t.x + 10, y: cy, fill: color,
        'font-size':'10', 'font-family':'Inter,monospace',
        'font-weight': col.pk ? '700' : '400'
      }, prefix + col.n));
    });

    svg.appendChild(g);
  });

  // Legend
  const lg = el('g');
  [[,'#00ff87','━ 1:N relation'],[,'#ffc107','━ 1:1 relation'],[,'rgba(180,210,255,.5)','→ Foreign Key']].forEach(([,color,label],i) => {
    lg.appendChild(el('line',{x1:'15',y1:`${545+i*16}`,x2:'35',y2:`${545+i*16}`,stroke:color,'stroke-width':'2','stroke-dasharray':'5 3'}));
    lg.appendChild(el('text',{x:'40',y:`${549+i*16}`,fill:'rgba(180,210,255,.6)','font-size':'9','font-family':'Inter,sans-serif'},label));
  });
  svg.appendChild(lg);

  // GSAP animate if available
  if (typeof gsap !== 'undefined') {
    gsap.fromTo(svg.querySelectorAll('path'), {opacity:0},{opacity:.55,duration:.8,stagger:.12,ease:'power2.out'});
    gsap.fromTo(svg.querySelectorAll('g'), {opacity:0,y:8},{opacity:1,y:0,duration:.45,stagger:.07,ease:'back.out(1.4)',delay:.2});
  }
}


async function init() {
  // Show loader then fade out
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
    initParticles();
  }, 2000);

  // Restore session
  try {
    const me = await api('/api/me');
    if (me.authenticated) STATE.user = { id: me.user_id, name: me.name, is_admin: me.is_admin };
  } catch {}

  renderNav();
  navigate('home');

  // GSAP ScrollTrigger for sections
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  // ── Auto-Refresh — أي تغيير في DB Browser يظهر في الموقع تلقائياً ──────────
  // بيعمل reload للصفحة الحالية كل 30 ثانية لو في صفحات الـ fields أو الـ admin
  setInterval(() => {
    const livePages = ['fields', 'field', 'home', 'admin', 'recommend', 'database', 'bookings'];
    if (livePages.includes(STATE.page)) {
      renderPage();   // يعيد تحميل الصفحة الحالية من الـ DB
    }
  }, 30000);
}

init();
