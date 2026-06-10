/**
 * admin.js — TAG Admin v5.3
 * Fixed: Media Library with explicit upload button and proper caption handling
 * ALL data access via service layer. No direct localStorage.
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginWrap = document.getElementById('admin-login');
  const shell     = document.getElementById('admin-shell');

  if (authService.isAuthenticated()) {
    showShell();
  } else {
    if (loginWrap) loginWrap.style.display = 'flex';
  }

  const form = document.getElementById('login-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const pw = document.getElementById('admin-pw').value;
      authService.login(pw).then(ok => {
        if (ok) {
          showShell();
        } else {
          const err = document.getElementById('login-err');
          if (err) { err.style.display = 'block'; err.textContent = 'Incorrect password. Please try again.'; }
          document.getElementById('admin-pw').value = '';
        }
      });
    });
  }

  function showShell() {
    if (loginWrap) loginWrap.style.display = 'none';
    if (shell)     shell.style.display = 'block';
    updateStats();
    navTo('dash');
  }
});

// ── NAV ────────────────────────────────────────────────────────────
function navTo(sec, btn) {
  document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  else {
    const found = document.querySelector(`.admin-nav-item[data-sec="${sec}"]`);
    if (found) found.classList.add('on');
  }
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('on'));
  const el = document.getElementById('sec-' + sec);
  if (el) el.classList.add('on');
  const titles = { dash:'Dashboard', insights:'Insights', videos:'Videos', podcasts:'Podcast', events:'Events', community:'Members', contacts:'Contact Messages', subscribers:'Subscribers', gallery:'Media Library', settings:'Settings' };
  const title = document.querySelector('.admin-topbar-title');
  if (title) title.textContent = titles[sec] || sec;
  loadSection(sec);
}

function loadSection(s) {
  if (s === 'dash')      updateStats();
  else if (s === 'insights')  renderInsightTable();
  else if (s === 'videos')    renderVideoTable();
  else if (s === 'podcasts')  renderPodcastTable();
  else if (s === 'events')    renderEventTable();
  else if (s === 'community') renderCommunityTable();
  else if (s === 'contacts')  renderContactTable();
  else if (s === 'subscribers') renderSubscriberTable();
  else if (s === 'gallery')   renderGalleryAdmin();
  else if (s === 'settings')  renderSettings();
}

// ── STATS ────────────────────────────────────────────────────────────
function updateStats() {
  Promise.all([
    insightService.getAll(),
    insightService.getPublished(),
    videoService.getAll(),
    storageService.query('events', e => e.status === 'upcoming'),
    storageService.get('community'),
    storageService.get('podcasts'),
    mediaService.getAll(),
  ]).then(([ins, pub, vids, evs, comm, pods, gallery]) => {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('stat-insights', ins.length);
    set('stat-pub', pub.length);
    set('stat-videos', vids.length);
    set('stat-events', evs.length);
    set('stat-community', comm.length);
    set('stat-podcasts', pods.length);
    set('stat-gallery', gallery.length);
    set('stat-articles', ins.filter(i => i.type === 'article').length);
    set('stat-opinions', ins.filter(i => i.type === 'opinion').length);
    set('stat-convos',   ins.filter(i => i.type === 'conversation').length);
  });
}

// ── IMAGE UTILITIES ───────────────────────────────────────────────────
/**
 * Compress an image DataURL to max 800px wide, JPEG quality 0.72
 * This keeps base64 size under ~80KB, safe for localStorage.
 */
function compressImage(dataURL, maxW = 800, quality = 0.72) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxW) { height = Math.round(height * maxW / width); width = maxW; }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataURL); // fallback: use original
    img.src = dataURL;
  });
}

// ── INSIGHTS TABLE ────────────────────────────────────────────────────
function renderInsightTable() {
  const tbody = document.getElementById('insight-tbody');
  if (!tbody) return;
  const typeVal = document.getElementById('ins-type-filter')?.value || 'all';

  insightService.getAll().then(items => {
    const filtered = typeVal === 'all' ? items : items.filter(i => i.type === typeVal);
    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="tbl-empty">No content yet. Click + New to add.</td></tr>';
      return;
    }
    tbody.innerHTML = filtered.map(b => `<tr>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <img src="${getItemImage(b)}" style="width:42px;height:32px;object-fit:cover;border-radius:5px;flex-shrink:0"
            onerror="this.style.display='none'">
          <span style="font-weight:600;font-size:12.5px;line-height:1.3;max-width:220px">${b.title}</span>
        </div>
      </td>
      <td><span class="pill pill-${b.type==='article'?'pub':b.type==='opinion'?'draft':'up'}" style="font-size:9px">${b.type}</span></td>
      <td><span class="tag tag-dim" style="font-size:9px">${b.subcategory||b.category||'—'}</span></td>
      <td style="font-size:11.5px">${b.date||''}</td>
      <td><span class="pill ${b.status==='published'?'pill-pub':'pill-draft'}">${b.status}</span></td>
      <td><span class="pill ${b.visibility!==false?'pill-pub':'pill-draft'}">${b.visibility!==false?'Visible':'Hidden'}</span></td>
      <td><div class="tbl-actions">
        <button class="abtn abtn-edit" onclick="openInsightModal('${b.id}')">Edit</button>
        <button class="abtn abtn-pub"  onclick="toggleInsightPub('${b.id}')">${b.status==='published'?'Draft':'Publish'}</button>
        <button class="abtn abtn-vi"   onclick="toggleInsightVis('${b.id}')">${b.visibility!==false?'Hide':'Show'}</button>
        <button class="abtn abtn-del"  onclick="delInsight('${b.id}')">Del</button>
      </div></td>
    </tr>`).join('');
  });
}

function toggleInsightPub(id) {
  insightService.togglePublish(id).then(u => { if(u){renderInsightTable();updateStats();aToast(`Post ${u.status}`);} });
}
function toggleInsightVis(id) {
  insightService.toggleVisibility(id).then(() => { renderInsightTable(); aToast('Visibility updated'); });
}
function delInsight(id) {
  if (!confirm('Delete this post permanently?')) return;
  insightService.delete(id).then(() => { renderInsightTable(); updateStats(); aToast('Deleted'); });
}

// ── INSIGHT MODAL ─────────────────────────────────────────────────────
let _eInsId = null;           // id being edited (null = new)
let _pendingInsImg = null;    // compressed base64 of newly uploaded image
let _pendingInsFile = null;   // actual file selected for Cloudinary upload
let _existingInsImg = null;   // current imageData from item being edited

function openInsightModal(id) {
  _eInsId = id || null;
  _pendingInsImg = null;
  _pendingInsFile = null;
  _existingInsImg = null;

  // Reset file input so same file can be re-uploaded
  const fi = document.getElementById('im2-file');
  if (fi) fi.value = '';

  const fillForm = (b) => {
    _existingInsImg = b.imageData || null;

    document.getElementById('im2-type').value      = b.type || 'article';
    document.getElementById('im2-title').value     = b.title || '';
    document.getElementById('im2-subcat').value    = b.subcategory || 'AI & Technology';
    document.getElementById('im2-category').value  = b.category || '';
    document.getElementById('im2-tags').value      = (b.tags || []).join(', ');
    document.getElementById('im2-excerpt').value   = b.excerpt || '';
    document.getElementById('im2-body').value      = b.body || '';
    // FIX: new insights default to 'published'
    document.getElementById('im2-status').value    = b.status || 'published';
    document.getElementById('im2-date').value      = b.date || new Date().toISOString().split('T')[0];
    document.getElementById('im2-readtime').value  = b.readTime || '5 min';
    document.getElementById('im2-featured').checked = !!b.featured;
    document.getElementById('im2-imgnum').value    = b.image || 1;
    document.getElementById('im2-meta-title').value = b.seo?.metaTitle || '';
    document.getElementById('im2-meta-desc').value  = b.seo?.metaDescription || '';

    const prev = document.getElementById('im2-img-preview');
    if (prev) {
      const src = getItemImage(b);
      prev.src = src;
      prev.style.display = 'block';
      prev.onerror = () => { prev.style.display = 'none'; };
    }
    const m = document.getElementById('insight-modal');
    m.querySelector('h3').textContent = id ? 'Edit Content' : 'New Content';
    m.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  if (id) {
    insightService.getById(id).then(b => fillForm(b || {}));
  } else {
    fillForm({});
  }
}

function im2_handleImg(input) {
  const file = input.files[0];
  if (!file) return;
  _pendingInsFile = file;
  const reader = new FileReader();
  reader.onload = e => {
    compressImage(e.target.result).then(compressed => {
      _pendingInsImg = compressed;
      const prev = document.getElementById('im2-img-preview');
      if (prev) { prev.src = compressed; prev.style.display = 'block'; }
      aToast('Image ready — click Save to apply');
    });
  };
  reader.readAsDataURL(file);
}

async function saveInsightModal() {
  const g   = id => document.getElementById(id)?.value?.trim() || '';
  const gck = id => document.getElementById(id)?.checked || false;

  const item = {
    type:        g('im2-type'),
    title:       g('im2-title'),
    subcategory: g('im2-subcat'),
    category:    g('im2-category'),
    tags:        g('im2-tags').split(',').map(t => t.trim()).filter(Boolean),
    excerpt:     g('im2-excerpt'),
    body:        document.getElementById('im2-body')?.value || '',
    status:      g('im2-status'),
    date:        g('im2-date'),
    readTime:    g('im2-readtime') || '5 min',
    featured:    gck('im2-featured'),
    image:       parseInt(g('im2-imgnum')) || 1,
    author:      'Varish Gahlot',
    seo: {
      metaTitle:       g('im2-meta-title'),
      metaDescription: g('im2-meta-desc'),
    },
  };

  if (!item.title) { aToast('Title is required', 'err'); return; }

  const saveBtn = document.querySelector('#insight-modal .btn-primary');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving...'; }

  try {
    if (_pendingInsFile) {
      const upload = await mediaService.upload(_pendingInsFile, {
        category: 'insights',
        folder: 'insights',
        caption: item.excerpt,
        alt: item.title || _pendingInsFile.name
      });
      item.featuredImage = upload.url;
      item.imageData = '';
    } else if (_pendingInsImg) {
      item.imageData = _pendingInsImg;
    } else if (_eInsId && _existingInsImg) {
      item.imageData = _existingInsImg; // explicitly preserve
    } else {
      item.imageData = ''; // new post, no upload
    }

    const op = _eInsId
      ? await insightService.update(_eInsId, item)
      : await insightService.create(item);

    closeAdminModal('insight-modal');
    renderInsightTable();
    updateStats();
    aToast(_eInsId ? 'Content updated ✓' : 'Content published ✓', 'success');
  } catch (err) {
    aToast(err.message || 'Save failed — image may be too large', 'err');
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save'; }
  }
}

// ── VIDEO TABLE ───────────────────────────────────────────────────────
function renderVideoTable() {
  const tbody = document.getElementById('video-tbody');
  if (!tbody) return;
  videoService.getAll().then(vs => {
    if (!vs.length) { tbody.innerHTML = '<tr><td colspan="6" class="tbl-empty">No videos yet.</td></tr>'; return; }
    tbody.innerHTML = vs.map(v => `<tr>
      <td>${v.youtubeId
        ? `<img src="https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg"
             style="width:64px;height:40px;object-fit:cover;border-radius:5px;display:block"
             onerror="this.style.opacity='.3'">`
        : '<div style="width:64px;height:40px;background:var(--s2);border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:18px;opacity:.3">▶</div>'}</td>
      <td style="max-width:200px"><span style="font-weight:600;font-size:12.5px">${v.title}</span></td>
      <td style="font-size:11.5px;color:var(--sub)">${v.series}</td>
      <td><code style="font-size:10px;color:var(--cy);background:var(--s2);padding:2px 6px;border-radius:4px">${v.youtubeId||'—'}</code></td>
      <td><label class="toggle" title="Enable/Disable">
        <input type="checkbox" ${v.visibility!==false?'checked':''}
          onchange="videoService.update('${v.id}',{visibility:this.checked}).then(()=>{renderVideoTable();aToast('Updated')})">
        <span class="toggle-slider"></span>
      </label></td>
      <td><div class="tbl-actions">
        <button class="abtn abtn-edit" onclick="openVideoModal('${v.id}')">Edit</button>
        <button class="abtn abtn-del"  onclick="videoService.delete('${v.id}').then(()=>{renderVideoTable();updateStats();aToast('Deleted')})">Del</button>
      </div></td>
    </tr>`).join('');
  });
}

let _eVidId = null;
function openVideoModal(id) {
  _eVidId = id || null;
  const fill = v => {
    document.getElementById('vm-title').value   = v.title || '';
    document.getElementById('vm-ytid').value    = v.youtubeId || '';
    document.getElementById('vm-series').value  = v.series || 'The AI Age';
    document.getElementById('vm-topic').value   = v.topic || '';
    document.getElementById('vm-desc').value    = v.description || '';
    const m = document.getElementById('video-modal');
    m.querySelector('h3').textContent = id ? 'Edit Video' : 'Add Video';
    m.classList.add('open'); document.body.style.overflow = 'hidden';
  };
  id ? videoService.getById(id).then(v => fill(v||{})) : fill({});
}

function saveVideoModal() {
  const g = id => document.getElementById(id)?.value?.trim() || '';
  const v = { title:g('vm-title'), youtubeId:g('vm-ytid'), series:g('vm-series'), topic:g('vm-topic'), description:g('vm-desc'), visibility:true };
  if (!v.title) { aToast('Title required','err'); return; }
  const op = _eVidId ? videoService.update(_eVidId, v) : videoService.create(v);
  op.then(() => { closeAdminModal('video-modal'); renderVideoTable(); updateStats(); aToast(_eVidId?'Updated':'Added'); })
    .catch(e => aToast(e.message||'Save failed','err'));
}

// ── EVENT TABLE ───────────────────────────────────────────────────────
function renderEventTable() {
  const tbody = document.getElementById('event-tbody');
  if (!tbody) return;
  storageService.get('events').then(evs => {
    if (!evs.length) { tbody.innerHTML = '<tr><td colspan="6" class="tbl-empty">No events yet.</td></tr>'; return; }
    tbody.innerHTML = evs.map(ev => `<tr>
      <td style="font-weight:600;font-size:12.5px;max-width:200px">${ev.title}</td>
      <td style="font-size:12px">${ev.date}</td>
      <td><span class="tag tag-dim" style="font-size:9.5px">${ev.type}</span></td>
      <td><span class="pill ${ev.status==='upcoming'?'pill-up':'pill-past'}">${ev.status}</span></td>
      <td><label class="toggle"><input type="checkbox" ${ev.visibility!==false?'checked':''}
        onchange="storageService.update('events','${ev.id}',{visibility:this.checked}).then(()=>aToast('Updated'))">
        <span class="toggle-slider"></span></label></td>
      <td><div class="tbl-actions">
        <button class="abtn abtn-edit" onclick="openEventModal('${ev.id}')">Edit</button>
        <button class="abtn abtn-del"  onclick="storageService.remove('events','${ev.id}').then(()=>{renderEventTable();updateStats();aToast('Deleted')})">Del</button>
      </div></td>
    </tr>`).join('');
  });
}

let _eEvId = null;
function openEventModal(id) {
  _eEvId = id || null;
  const fill = ev => {
    document.getElementById('em-title').value  = ev.title||'';
    document.getElementById('em-desc').value   = ev.description||'';
    document.getElementById('em-date').value   = ev.date||'';
    document.getElementById('em-type').value   = ev.type||'online';
    document.getElementById('em-cap').value    = ev.capacity||'';
    document.getElementById('em-status').value = ev.status||'upcoming';
    const m = document.getElementById('event-modal');
    m.querySelector('h3').textContent = id ? 'Edit Event' : 'New Event';
    m.classList.add('open'); document.body.style.overflow = 'hidden';
  };
  id ? storageService.find('events',id).then(ev=>fill(ev||{})) : fill({});
}

function saveEventModal() {
  const g = id => document.getElementById(id)?.value?.trim()||'';
  const ev = { title:g('em-title'), description:g('em-desc'), date:g('em-date'), type:g('em-type'), capacity:g('em-cap'), status:g('em-status'), visibility:true };
  if (!ev.title) { aToast('Title required','err'); return; }
  const op = _eEvId ? storageService.update('events',_eEvId,ev) : storageService.append('events',ev);
  op.then(() => { closeAdminModal('event-modal'); renderEventTable(); updateStats(); aToast(_eEvId?'Updated':'Created'); })
    .catch(e => aToast(e.message||'Save failed','err'));
}

// ── PODCAST TABLE ─────────────────────────────────────────────────────
function renderPodcastTable() {
  const tbody = document.getElementById('podcast-tbody');
  if (!tbody) return;
  storageService.get('podcasts').then(items => {
    if (!items.length) { tbody.innerHTML = '<tr><td colspan="5" class="tbl-empty">No episodes yet.</td></tr>'; return; }
    tbody.innerHTML = items.map(item => `<tr>
      <td style="font-weight:600;font-size:12.5px;max-width:220px">${item.title}</td>
      <td style="font-size:12px">${item.episode}</td>
      <td style="font-size:12px">${item.duration}</td>
      <td><span class="pill ${item.status==='published'?'pill-pub':'pill-draft'}">${item.status}</span></td>
      <td><div class="tbl-actions">
        <button class="abtn abtn-edit" onclick="openPodcastModal('${item.id}')">Edit</button>
        <button class="abtn abtn-del"  onclick="storageService.remove('podcasts','${item.id}').then(()=>{renderPodcastTable();updateStats();aToast('Deleted')})">Del</button>
      </div></td>
    </tr>`).join('');
  });
}

let _ePodId = null;
function openPodcastModal(id) {
  _ePodId = id || null;
  const fill = item => {
    document.getElementById('pm-title').value   = item.title||'';
    document.getElementById('pm-episode').value = item.episode||'';
    document.getElementById('pm-dur').value     = item.duration||'';
    document.getElementById('pm-date').value    = item.date||new Date().toISOString().split('T')[0];
    document.getElementById('pm-desc').value    = item.description||'';
    document.getElementById('pm-embed').value   = item.embedUrl||'';
    document.getElementById('pm-status').value  = item.status||'upcoming';
    const m = document.getElementById('podcast-modal');
    m.querySelector('h3').textContent = id ? 'Edit Episode' : 'New Episode';
    m.classList.add('open'); document.body.style.overflow = 'hidden';
  };
  id ? storageService.find('podcasts',id).then(item=>fill(item||{})) : fill({});
}

function savePodcastModal() {
  const g = id => document.getElementById(id)?.value?.trim()||'';
  const item = { title:g('pm-title'), episode:g('pm-episode'), duration:g('pm-dur'), date:g('pm-date'), description:g('pm-desc'), embedUrl:g('pm-embed'), status:g('pm-status'), visibility:true };
  if (!item.title) { aToast('Title required','err'); return; }
  const op = _ePodId ? storageService.update('podcasts',_ePodId,item) : storageService.append('podcasts',item);
  op.then(() => { closeAdminModal('podcast-modal'); renderPodcastTable(); updateStats(); aToast(_ePodId?'Updated':'Created'); })
    .catch(e => aToast(e.message||'Save failed','err'));
}

// ── GALLERY / MEDIA LIBRARY ───────────────────────────────────────────
/**
 * renderGalleryAdmin — Displays uploaded media in the admin gallery grid
 * Fetches all gallery items from the database and renders them with preview + delete button
 * Shows caption and upload date below each image
 */
function renderGalleryAdmin() {
  const grid = document.getElementById('gallery-admin-grid');
  if (!grid) return;
  
  mediaService.getAll().then(items => {
    if (!items.length) { 
      grid.innerHTML = '<div class="tbl-empty">No media yet. Upload images using the form above.</div>'; 
      return; 
    }
    
    grid.innerHTML = items.map(item => {
      const uploadDate = item.uploaded_at 
        ? new Date(item.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
        : '';
      return `
      <div style="position:relative;border-radius:10px;overflow:hidden;background:var(--s2);aspect-ratio:4/3;border:1px solid var(--bdr)">
        <img src="${item.url||''}" alt="${item.alt||item.caption||''}"
          style="width:100%;height:100%;object-fit:cover" onerror="this.style.opacity='.2'">
        <div style="position:absolute;top:6px;right:6px">
          <button class="abtn abtn-del" onclick="mediaService.delete('${item.id}').then(()=>{renderGalleryAdmin();updateStats();aToast('Removed')})">&#x2715;</button>
        </div>
        <div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,.75);padding:8px 10px">
          ${item.caption?`<div style="font-size:10.5px;color:var(--tx2);margin-bottom:4px;line-height:1.3">${item.caption}</div>`:''}
          ${uploadDate?`<div style="font-size:8.5px;color:rgba(255,255,255,.5)">${uploadDate}</div>`:''}
        </div>
      </div>`;
    }).join('');
  });
}

/**
 * handleGalleryUpload — Process file selection from gallery upload input
 * 
 * Now with explicit upload button:
 * 1. User selects files
 * 2. User enters caption (optional)
 * 3. User clicks UPLOAD button
 * 4. Caption is passed to each file upload
 * 5. Backend saves caption to database
 * 6. Frontend renders gallery with captions
 * 7. Public /media page auto-syncs
 */
let _galleryPendingFiles = null;  // Store selected files until upload button clicked

function handleGalleryFileSelect(input) {
  const files = input.files;
  if (!files || !files.length) {
    _galleryPendingFiles = null;
    return;
  }
  
  // Store files for later upload
  _galleryPendingFiles = files;
  const uploadBtn = document.getElementById('gallery-upload-btn');
  if (uploadBtn) uploadBtn.disabled = false;
  
  aToast(`${files.length} file${files.length > 1 ? 's' : ''} selected. Click Upload to proceed.`);
}

async function handleGalleryUpload() {
  if (!_galleryPendingFiles || !_galleryPendingFiles.length) {
    aToast('No files selected', 'err');
    return;
  }
  
  const cap = document.getElementById('gallery-caption')?.value?.trim() || '';
  const uploadBtn = document.getElementById('gallery-upload-btn');
  
  if (uploadBtn) { uploadBtn.disabled = true; uploadBtn.textContent = 'Uploading...'; }
  aToast('Uploading to Cloudinary...');

  const uploads = Array.from(_galleryPendingFiles).map(file => {
    return mediaService.upload(file, {
      category: 'general',
      caption: cap,  // Caption passed to every file
      alt: cap || file.name
    });
  });

  try {
    const results = await Promise.all(uploads);
    renderGalleryAdmin();
    updateStats();
    aToast(`${results.length} image${results.length > 1 ? 's' : ''} uploaded ✓`, 'success');
    
    // Clear inputs
    const fileInput = document.getElementById('gallery-file-input');
    if (fileInput) fileInput.value = '';
    const capInput = document.getElementById('gallery-caption');
    if (capInput) capInput.value = '';
    
    _galleryPendingFiles = null;
  } catch (err) {
    aToast(err.message || 'Upload failed', 'err');
  } finally {
    if (uploadBtn) { uploadBtn.disabled = true; uploadBtn.textContent = 'Upload'; }
  }
}

// ── COMMUNITY TABLE ───────────────────────────────────────────────────
function renderCommunityTable() {
  const tbody = document.getElementById('community-tbody');
  if (!tbody) return;
  storageService.get('community').then(members => {
    if (!members.length) { tbody.innerHTML = '<tr><td colspan="5" class="tbl-empty">No submissions yet.</td></tr>'; return; }
    tbody.innerHTML = members.map(m => `<tr>
      <td style="font-weight:600;font-size:12.5px"> ${(m.firstName || m.first_name || '')} ${(m.lastName || m.last_name || '')}</td>
      
      <td style="font-size:12px;color:var(--cy)">${m.email||''}</td>
      <td style="font-size:12px">${m.role||'—'}</td>
      <td style="font-size:12px">${m.country||'—'}</td>
      <td><button class="abtn abtn-del" onclick="storageService.remove('community','${m.id}').then(()=>{renderCommunityTable();updateStats();aToast('Removed')})">Remove</button></td>
    </tr>`).join('');
  });
}

// ── CONTACT TABLE ─────────────────────────────────────────────────────
function renderContactTable() {
  const tbody = document.getElementById('contact-tbody');
  if (!tbody) return;

  fetch('/api/contact')
    .then(res => res.json())
    .then(items => {
      if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="tbl-empty">No contact messages yet.</td></tr>';
        return;
      }
      tbody.innerHTML = items.map(m => `<tr>
        <td>${m.name || ''}</td>
        <td>${m.email || ''}</td>
        <td>${m.subject || ''}</td>
        <td style="max-width:320px;white-space:pre-wrap;word-break:break-word">${m.message || ''}</td>
        <td>${new Date(m.created_at).toLocaleString()}</td>
      </tr>`).join('');
    })
    .catch(() => {
      tbody.innerHTML = '<tr><td colspan="5" class="tbl-empty">Unable to load contact messages.</td></tr>';
    });
}

function renderSubscriberTable() {
  const tbody = document.getElementById('subscriber-tbody');
  if (!tbody) return;

  fetch('/api/newsletter')
    .then(res => res.json())
    .then(items => {
      if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="2" class="tbl-empty">No newsletter subscribers yet.</td></tr>';
        return;
      }
      tbody.innerHTML = items.map(s => `<tr>
        <td>${s.email || ''}</td>
        <td>${new Date(s.created_at).toLocaleString()}</td>
      </tr>`).join('');
    })
    .catch(() => {
      tbody.innerHTML = '<tr><td colspan="2" class="tbl-empty">Unable to load newsletter subscribers.</td></tr>';
    });
}

// ── SETTINGS ──────────────────────────────────────────────────────────
function renderSettings() {
  const s = storageService.getSettings() || {};
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val||''; };
  set('cfg-sitename',  s.siteName);
  set('cfg-email',     s.email);
  set('cfg-youtube',   s.youtubeChannel);
  set('cfg-formspree', s.formspreeId);
  const pc = document.getElementById('cfg-podcast'); if (pc) pc.checked = !!s.showPodcast;
  const md = document.getElementById('cfg-media');   if (md) md.checked = !!s.showMedia;
}

function saveSettings() {
  const g  = id => document.getElementById(id)?.value?.trim()||'';
  const gc = id => document.getElementById(id)?.checked||false;
  const s = storageService.getSettings() || {};
  s.siteName       = g('cfg-sitename') || s.siteName;
  s.email          = g('cfg-email')    || s.email;
  s.youtubeChannel = g('cfg-youtube')  || s.youtubeChannel;
  s.formspreeId    = g('cfg-formspree');
  s.showPodcast    = gc('cfg-podcast');
  s.showMedia      = gc('cfg-media');
  storageService.setSettings(s);
  aToast('Settings saved ✓', 'success');
}

function changePw() {
  const cur = document.getElementById('pw-current')?.value||'';
  const nw  = document.getElementById('pw-new')?.value||'';
  const cf  = document.getElementById('pw-confirm')?.value||'';
  if (!cur||!nw||!cf) { aToast('Fill all password fields','err'); return; }
  if (nw !== cf)      { aToast('New passwords do not match','err'); return; }
  authService.changePassword(cur, nw).then(result => {
    if (result.ok) {
      ['pw-current','pw-new','pw-confirm'].forEach(id => { const el = document.getElementById(id); if(el) el.value=''; });
      aToast('Password changed ✓', 'success');
    } else { aToast(result.error, 'err'); }
  });
}

// ── SHARED HELPERS ────────────────────────────────────────────────────
function closeAdminModal(id) {
  const m = document.getElementById(id);
  if (m) { m.classList.remove('open'); document.body.style.overflow = ''; }
}

function aToast(msg, type = '') {
  let t = document.getElementById('admin-toast');
  if (!t) { t = document.createElement('div'); t.id = 'admin-toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = 'toast' + (type ? ' ' + type : '');
  void t.offsetWidth;
  t.classList.add('show');
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove('show'), 3200);
}

function adminLogout() {
  authService.logout().then(() => location.reload());
}
