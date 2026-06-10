/**
 * main.js — TAG Public v5.1
 * Fixed: video series tabs | hqdefault thumbnails | no episode labels
 * ALL data access through service layer.
 */

// ── NAV ───────────────────────────────────────────────────────────────
const _nav = document.getElementById('nav');
if (_nav) window.addEventListener('scroll', () =>
  _nav.classList.toggle('scrolled', scrollY > 38), { passive: true });

const _ham = document.querySelector('.ham');
const _mob = document.querySelector('.mob-nav');
if (_ham && _mob) {
  _ham.addEventListener('click', () => _mob.classList.toggle('open'));
  const _cl = document.querySelector('.mob-close');
  if (_cl) _cl.addEventListener('click', () => _mob.classList.remove('open'));
  _mob.querySelectorAll('a').forEach(a => a.addEventListener('click', () => _mob.classList.remove('open')));
}
(function() {
  const p = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mob-nav a').forEach(a => {
    const h = a.getAttribute('href') || '';
    if (h === p || (p === '' && h === 'index.html')) a.classList.add('active');
  });
})();

// ── SCROLL REVEAL ─────────────────────────────────────────────────────
const _srObs = new IntersectionObserver(entries =>
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); }),
  { threshold: 0.06, rootMargin: '0px 0px -20px 0px' }
);
function observeSR() {
  document.querySelectorAll('.sr:not(.vis)').forEach(el => _srObs.observe(el));
}
observeSR();

// ── MODAL / TOAST ─────────────────────────────────────────────────────
function openModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('open'); document.body.style.overflow = ''; }
}
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open'); document.body.style.overflow = '';
  }
});
function showToast(msg, type = '') {
  let t = document.getElementById('pub-toast');
  if (!t) { t = document.createElement('div'); t.id = 'pub-toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = 'toast' + (type ? ' ' + type : '');
  void t.offsetWidth;
  t.classList.add('show');
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove('show'), 3200);
}

// ── NEWSLETTER ────────────────────────────────────────────────────────
function nlSubmit(e) {
  e.preventDefault();
  const inp = e.target.querySelector('input[type=email]');
  const btn = e.target.querySelector('button[type=submit]');
  if (!inp || !inp.value) return;
  const email = inp.value.trim();
  if (!email.includes('@')) {
    btn.textContent = 'Invalid email';
    setTimeout(() => btn.textContent = 'Subscribe', 2000);
    return;
  }
  // prevent duplicate clicks
  if (btn.disabled) return;
  btn.disabled = true; btn.textContent = 'Subscribing...';

  fetch('/api/newsletter/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
    .then(async res => {
      if (res.status === 201) {
        btn.textContent = 'Subscribed ✓'; inp.value = '';
      } else if (res.status === 409) {
        btn.textContent = 'Already subscribed';
      } else {
        const body = await res.json().catch(() => ({}));
        btn.textContent = body.error || 'Subscription failed';
      }
    })
    .catch(() => { btn.textContent = 'Network error'; })
    .finally(() => { setTimeout(() => { btn.disabled = false; btn.textContent = 'Subscribe'; }, 3000); });
}

// ── SUBCATEGORY COLORS ────────────────────────────────────────────────
const SUBCAT_CLS = {
  'AI & Technology': 'tag-cy', 'Future of Humanity': 'tag-vi', 'Innovation': 'tag-li',
  'Thought Leadership': 'tag-pk', 'Deep Conversations': 'tag-or',
  'Industry Analysis': 'tag-cy', 'Research & Vision': 'tag-vi',
};
const TYPE_BADGE = {
  article:      { cls: 'tag-cy', label: 'Article' },
  opinion:      { cls: 'tag-pk', label: '✏ Opinion' },
  conversation: { cls: 'tag-vi', label: '🎙 Conversation' },
};

// ── INSIGHT CARD ──────────────────────────────────────────────────────
function insightCard(b, large = false) {
  const imgSrc = getItemImage(b);
  const badge  = TYPE_BADGE[b.type] || TYPE_BADGE.article;
  const subCls = SUBCAT_CLS[b.subcategory] || 'tag-dim';
  const h = large ? 220 : 180;
  return `<article class="card blog-card sr" onclick="location.href='insight.html?id=${b.id}'" style="cursor:pointer">
    <div class="blog-thumb" style="height:${h}px">
      <img src="${imgSrc}" alt="${b.title}" loading="lazy"
        onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <div class="blog-thumb-emoji" style="display:none;height:100%;background:var(--s2);align-items:center;justify-content:center;font-size:40px;opacity:.3">📄</div>
      <div class="blog-thumb-overlay"></div>
      <div class="blog-cat-badge"><span class="tag ${badge.cls}">${badge.label}</span></div>
    </div>
    <div class="card-body">
      <div class="blog-meta">
        <span>${b.date||''}</span>
        ${b.readTime ? `<span class="dot"></span><span>${b.readTime}</span>` : ''}
        ${b.featured ? '<span class="pill pill-feat" style="margin-left:auto">Featured</span>' : ''}
      </div>
      <h3 class="blog-title${large?' blog-title-lg':''}">${b.title}</h3>
      <p class="blog-excerpt">${b.excerpt||''}</p>
      <div class="flex-between">
        <span class="tag ${subCls}" style="font-size:9.5px">${b.subcategory||b.category||''}</span>
        <span class="read-link">Read <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
      </div>
    </div>
  </article>`;
}

// ── INSIGHTS LIST PAGE ────────────────────────────────────────────────
let _insCat = 'all', _insType = 'all', _insQ = '';

function renderInsights() {
  const grid = document.getElementById('insights-grid');
  if (!grid) return;
  insightService.getPublished().then(all => {
    let filtered = all.filter(b => {
      const catOk  = _insCat  === 'all' || b.subcategory === _insCat || b.category === _insCat;
      const typeOk = _insType === 'all' || b.type === _insType;
      const qOk    = !_insQ || b.title.toLowerCase().includes(_insQ) ||
                     (b.subcategory||'').toLowerCase().includes(_insQ) ||
                     (b.tags||[]).some(t => t.toLowerCase().includes(_insQ));
      return catOk && typeOk && qOk;
    });
    if (!filtered.length) {
      grid.innerHTML = '<div style="padding:48px;text-align:center;color:var(--sub)">No results found.</div>';
      return;
    }
    grid.innerHTML = filtered.map(b => insightCard(b)).join('');
    observeSR();
  });
}

function filterIns(val, btn, field) {
  if (field === 'cat')  _insCat  = val;
  else if (field === 'type') _insType = val;
  const group = btn.closest('[data-filter-group]');
  if (group) group.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  renderInsights();
}

// ── SINGLE INSIGHT POST ───────────────────────────────────────────────
function renderInsightPost() {
  const id = new URLSearchParams(location.search).get('id');
  const c  = document.getElementById('post-content');
  if (!id || !c) return;

  insightService.getById(id).then(b => {
    if (!b) {
      c.innerHTML = '<div class="wrap" style="padding:80px 0"><p>Post not found. <a href="insights.html" style="color:var(--cy)">← Back to Insights</a></p></div>';
      return;
    }
    document.title = b.title + ' — Techno AI Genius';
    const badge  = TYPE_BADGE[b.type] || TYPE_BADGE.article;
    const imgSrc = getItemImage(b);
    c.innerHTML = `
      <div class="post-hero">
        <div class="post-hero-img" style="background-image:url('${imgSrc}')"></div>
        <div class="wrap"><div class="post-header">
          <span class="tag ${badge.cls}">${badge.label}</span>
          <h1>${b.title}</h1>
          <div class="post-byline">
            <span style="font-weight:600;color:var(--tx)">${b.author||'Varish Gahlot'}</span>
            <span>&middot;</span><span>${b.date}</span>
            <span>&middot;</span><span>${b.readTime} read</span>
            <span class="tag ${SUBCAT_CLS[b.subcategory]||'tag-dim'}" style="font-size:9px">${b.subcategory||''}</span>
          </div>
        </div></div>
      </div>
      <div class="wrap"><div class="post-body">
        ${b.body || '<p>Content coming soon.</p>'}
        <div class="post-nav">
          <a href="insights.html" class="btn btn-ghost btn-sm">&#8592; All Insights</a>
        </div>
      </div></div>`;
  });
}

// ── VIDEO SYSTEM ──────────────────────────────────────────────────────
// State per-series for independent pagination
const VID_PER_PAGE = 4;
const _vs = {
  all:  { page: 0, showAll: false },
  s1:   { page: 0, showAll: false },
  s2:   { page: 0, showAll: false },
};
let _activeSeriesTab = 'all';

/**
 * renderVideos — called once on page load, then by tab/nav buttons.
 * Handles 3 tabs: all | s1 (Abstract Thought) | s2 (The AI Age)
 */
function renderVideos() {
  videoService.getEnabled().then(all => {
    const s1 = all.filter(v => v.series && v.series.toLowerCase().includes('abstract'));
    const s2 = all.filter(v => v.series && v.series.toLowerCase().includes('ai age'));

    // Update tab counts
    const tc = document.getElementById('tab-count-all');
    const t1 = document.getElementById('tab-count-s1');
    const t2 = document.getElementById('tab-count-s2');
    if (tc) tc.textContent = all.length;
    if (t1) t1.textContent = s1.length;
    if (t2) t2.textContent = s2.length;

    // Render active tab
    if (_activeSeriesTab === 'all') {
      _renderVideoList(all, 'vid-grid', 'vid-pagination', 'vid-showmore', _vs.all);
    } else if (_activeSeriesTab === 's1') {
      _renderVideoList(s1, 'vid-grid', 'vid-pagination', 'vid-showmore', _vs.s1);
    } else {
      _renderVideoList(s2, 'vid-grid', 'vid-pagination', 'vid-showmore', _vs.s2);
    }
  });
}

function _renderVideoList(videos, gridId, pgId, moreId, state) {
  const grid = document.getElementById(gridId);
  const pgW  = document.getElementById(pgId);
  const moreW = document.getElementById(moreId);
  if (!grid) return;

  if (!videos.length) {
    grid.innerHTML = '<div style="padding:48px;text-align:center;color:var(--sub)">No videos in this series yet.</div>';
    if (pgW) pgW.innerHTML = '';
    if (moreW) moreW.innerHTML = '';
    return;
  }

  const total = videos.length;
  const toShow = state.showAll ? videos : videos.slice(state.page * VID_PER_PAGE, (state.page + 1) * VID_PER_PAGE);

  grid.innerHTML = toShow.map(v => vidCard(v)).join('');
  observeSR();

  // Pagination (only when not showing all)
  if (pgW) {
    if (!state.showAll && total > VID_PER_PAGE) {
      const pages = Math.ceil(total / VID_PER_PAGE);
      let html = `<button class="pg-btn" ${state.page===0?'disabled':''} onclick="_vidPrev()">&#8592; Prev</button>`;
      for (let i = 0; i < pages; i++) {
        html += `<button class="pg-btn${i===state.page?' on':''}" onclick="_vidGoTo(${i})">${i+1}</button>`;
      }
      html += `<button class="pg-btn" ${state.page>=pages-1?'disabled':''} onclick="_vidNext()">Next &#8594;</button>`;
      pgW.innerHTML = html;
    } else {
      pgW.innerHTML = '';
    }
  }

  // Show All / Show Less button
  if (moreW) {
    if (!state.showAll && total > VID_PER_PAGE) {
      moreW.innerHTML = `<button class="btn btn-outline" onclick="_vidShowAll()">Show All ${total} Videos</button>`;
    } else if (state.showAll && total > VID_PER_PAGE) {
      moreW.innerHTML = `<button class="btn btn-ghost btn-sm" onclick="_vidShowLess()">&#8593; Show Less</button>`;
    } else {
      moreW.innerHTML = '';
    }
  }
}

function _getActiveState() { return _vs[_activeSeriesTab]; }

function _vidPrev() {
  const s = _getActiveState();
  if (s.page > 0) { s.page--; renderVideos(); }
}
function _vidNext() {
  const s = _getActiveState();
  s.page++; renderVideos();
}
function _vidGoTo(p) {
  const s = _getActiveState();
  s.page = p; renderVideos();
}
function _vidShowAll() {
  const s = _getActiveState();
  s.showAll = true; renderVideos();
}
function _vidShowLess() {
  const s = _getActiveState();
  s.showAll = false; s.page = 0; renderVideos();
}

function switchSeries(tab, btn) {
  _activeSeriesTab = tab;
  document.querySelectorAll('.series-tab').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  // Reset state for new tab
  _vs[tab].page = 0; _vs[tab].showAll = false;
  renderVideos();
  closePlayer();
}

function vidCard(v) {
  // Use reliable hqdefault.jpg thumbnail
  const thumb = v.youtubeId ? `https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg` : '';
  const seriesCls = v.series && v.series.includes('Abstract') ? 'tag-li' : 'tag-cy';

  return `<div class="card vid-card sr" onclick="playVid('${v.youtubeId||''}','${v.id}')" style="cursor:pointer">
    <div class="video-thumb">
      ${thumb
        ? `<img src="${thumb}" alt="${v.title}" loading="lazy"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        : ''}
      <div class="video-thumb-fallback" style="${thumb?'display:none':'display:flex'};width:100%;height:100%;background:var(--s2);align-items:center;justify-content:center;font-size:36px;opacity:.2">▶</div>
      <div class="video-overlay"><div class="play-btn">&#9658;</div></div>
    </div>
    <div class="card-body">
      <div style="margin-bottom:6px">
        <span class="tag ${seriesCls}" style="font-size:9px">${v.series}</span>
      </div>
      <div class="video-card-title">${v.title}</div>
      <div class="video-card-meta">
        <span>${v.topic||''}</span>
      </div>
    </div>
  </div>`;
}

// ── VIDEO PLAYER ──────────────────────────────────────────────────────
let _activeVidId = null;

function playVid(youtubeId, cardId) {
  const wrap  = document.getElementById('video-player');
  const frame = document.getElementById('player-frame');
  if (!youtubeId || !wrap || !frame) return;

  _activeVidId = cardId;
  document.querySelectorAll('.vid-active').forEach(c => c.classList.remove('vid-active'));
  const card = document.querySelector(`[onclick*="${cardId}"]`);
  if (card) card.classList.add('vid-active');

  frame.innerHTML = `<iframe
    src="https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1"
    allow="autoplay;encrypted-media;fullscreen" allowfullscreen></iframe>`;
  wrap.classList.add('active');
  setTimeout(() => wrap.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
}

function closePlayer() {
  const wrap  = document.getElementById('video-player');
  const frame = document.getElementById('player-frame');
  if (wrap)  wrap.classList.remove('active');
  if (frame) frame.innerHTML = '';
  document.querySelectorAll('.vid-active').forEach(c => c.classList.remove('vid-active'));
  _activeVidId = null;
}

// ── EVENTS ────────────────────────────────────────────────────────────
function renderEvents() {
  const grid = document.getElementById('events-grid');
  if (!grid) return;
  storageService.query('events', e => e.status === 'upcoming' && e.visibility !== false).then(evs => {
    if (!evs.length) {
      grid.innerHTML = '<div style="padding:48px;text-align:center;color:var(--sub)">Upcoming events will be announced here.</div>';
      return;
    }
    grid.innerHTML = evs.map(ev => eventCard(ev)).join('');
    observeSR();
  });
}

function eventCard(ev) {
  const d  = new Date(ev.date);
  const mo = d.toLocaleString('default', { month: 'short' }).toUpperCase();
  const dy = d.getDate();
  const typeLabels = { online:'Online Event', workshop:'Workshop', live:'Live Event', initiative:'Initiative' };
  return `<div class="card sr">
    <div style="padding:22px 22px 16px;border-bottom:1px solid var(--bdr)">
      <div class="ev-date-box"><span class="ev-mo">${mo}</span><span class="ev-dy">${dy}</span></div>
      <div class="ev-type-badge ${ev.type||'online'}">${typeLabels[ev.type]||'Event'}</div>
      <h3 style="font-family:Syne,sans-serif;font-size:15px;font-weight:700;margin-bottom:7px;line-height:1.3">${ev.title}</h3>
      <p style="font-size:13px;color:var(--sub);line-height:1.55">${ev.description}</p>
    </div>
    <div style="padding:13px 22px;display:flex;align-items:center;justify-content:space-between">
      <span style="font-size:11.5px;color:var(--sub)">${ev.capacity?`<strong style="color:var(--li)">${ev.capacity}</strong> spots`:'Open'}</span>
      <button class="btn btn-ghost btn-sm" onclick="openRegModal('${ev.id}')">Register &#8594;</button>
    </div>
  </div>`;
}

function openRegModal(id) {
  storageService.find('events', id).then(ev => {
    if (!ev) return;
    const t = document.getElementById('reg-event-title');
    if (t) t.textContent = ev.title;
    openModal('reg-modal');
  });
}
function submitReg(e) {
  e.preventDefault(); closeModal('reg-modal'); showToast("You're registered!", 'success');
}

// ── PODCASTS ──────────────────────────────────────────────────────────
function renderPodcasts() {
  const grid = document.getElementById('podcast-grid');
  if (!grid) return;
  storageService.query('podcasts', p => p.visibility !== false).then(eps => {
    if (!eps.length) {
      grid.innerHTML = '<div style="padding:48px;text-align:center;color:var(--sub)">Podcast episodes coming soon.</div>';
      return;
    }
    grid.innerHTML = eps.map((ep, idx) => `
      <div class="podcast-card sr">
        <div class="podcast-num">${String(idx+1).padStart(2,'0')}</div>
        <div>
          <div class="podcast-title">${ep.title}</div>
          <div class="podcast-meta">
            <span>${ep.episode}</span><span>${ep.duration}</span><span>${ep.date}</span>
            <span class="pill ${ep.status==='published'?'pill-pub':'pill-draft'}">${ep.status}</span>
          </div>
          <p class="podcast-desc">${ep.description}</p>
          ${ep.embedUrl
            ? `<iframe src="${ep.embedUrl}" width="100%" height="80" frameborder="0" style="border-radius:8px;margin-top:8px"></iframe>`
            : `<button class="btn btn-ghost btn-sm" disabled style="opacity:.5;margin-top:10px">Coming Soon</button>`}
        </div>
      </div>`).join('');
    observeSR();
  });
}

// ── MEDIA GALLERY (PUBLIC) ────────────────────────────────────────────
function renderGallery() {
  const grid = document.getElementById('gallery-grid');
  const empt = document.getElementById('gallery-empty');
  if (!grid) return;

  mediaService.getAll().then(items => {
    if (!items.length) {
      if (empt) empt.style.display = 'block';
      grid.innerHTML = '';
      return;
    }
    if (empt) empt.style.display = 'none';
    grid.innerHTML = items.map(item => `
      <div class="gallery-item" onclick="openLightbox('${item.id}')">
        <img src="${item.dataUrl||item.url||''}" alt="${item.alt||item.caption||''}" loading="lazy"
          onerror="this.style.opacity='.15'">
        <div class="gallery-item-overlay"></div>
        ${item.caption ? `<div class="gallery-item-caption">${item.caption}</div>` : ''}
      </div>`).join('');
    observeSR();
  });
}

function openLightbox(id) {
  mediaService.getById(id).then(item => {
    if (!item) return;
    let lb = document.getElementById('lightbox');
    if (!lb) {
      lb = document.createElement('div'); lb.id = 'lightbox'; lb.className = 'lightbox';
      lb.innerHTML = `<button class="lightbox-close" onclick="closeLightbox()">&#x2715;</button>
        <img class="lightbox-img" id="lb-img" alt="">
        <div class="lightbox-caption" id="lb-cap" style="position:absolute;bottom:20px;color:rgba(255,255,255,.7);font-size:13px;text-align:center;width:100%"></div>`;
      document.body.appendChild(lb);
      lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
    }
    const img = document.getElementById('lb-img');
    const cap = document.getElementById('lb-cap');
    if (img) { img.src = item.dataUrl||item.url||''; img.alt = item.alt||''; }
    if (cap) cap.textContent = item.caption || '';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  });
}
function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (lb) lb.classList.remove('open');
  document.body.style.overflow = '';
}

// ── COMMUNITY FORM ────────────────────────────────────────────────────
function submitJoin(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const entry = {
    firstName: fd.get('firstName')||'', lastName: fd.get('lastName')||'',
    email: fd.get('email')||'', role: fd.get('role')||'',
    country: fd.get('country')||'', message: fd.get('message')||'',
    newsletter: fd.get('newsletter') === 'on',
  };
  storageService.append('community', entry).then(() => {
    getSiteSettings().then(cfg => {
      if (cfg.formspreeId) {
        fetch('https://formspree.io/f/'+cfg.formspreeId, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({...entry, _replyto: entry.email})
        }).catch(()=>{});
      }
      e.target.style.display = 'none';
      const suc = document.getElementById('join-success');
      if (suc) suc.classList.add('show');
    });
  });
}

// ── CONTACT FORM ──────────────────────────────────────────────────────
function submitContact(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = {
    name: (fd.get('name')||'').trim(), email: (fd.get('email')||'').trim(),
    subject: (fd.get('subject')||'').trim(), message: (fd.get('message')||'').trim(),
  };
  const btn = e.target.querySelector('button[type=submit]');
  // basic client-side validation
  const errors = [];
  if (!data.name || data.name.length < 2) errors.push('Please enter your name.');
  if (!data.email || !data.email.includes('@')) errors.push('Please enter a valid email.');
  if (!data.subject || data.subject.length < 3) errors.push('Please select a subject.');
  if (!data.message || data.message.length < 10) errors.push('Please enter a longer message.');
  if (errors.length) {
    const first = errors[0];
    if (btn) { btn.textContent = first; setTimeout(() => btn.textContent = 'Send Message', 2200); }
    return;
  }

  if (btn.disabled) return;
  btn.disabled = true; btn.textContent = 'Sending...';

  fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    .then(async res => {
      if (res.status === 201) {
        e.target.style.display = 'none';
        const suc = document.getElementById('contact-success'); if (suc) suc.classList.add('show');
      } else {
        const body = await res.json().catch(() => ({}));
        btn.textContent = body.error || 'Send failed';
        setTimeout(() => { btn.textContent = 'Send Message'; }, 2500);
      }
    })
    .catch(() => { btn.textContent = 'Network error'; setTimeout(() => { btn.textContent = 'Send Message'; }, 2500); })
    .finally(() => { btn.disabled = false; });
}
