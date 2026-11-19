const state = {
  user: JSON.parse(localStorage.getItem('socialart_user')) || null,
  page: 1,
  limit: 6,
  hasMore: true,
  isLoadingFeed: false,
  activeTag: '',
  selectedFiles: [],
  selectedTags: [],
  currentViewedProfileId: null,
  activeCommissionId: null
};

const authView = document.getElementById('auth-view');
const appView = document.getElementById('app-view');
const feedSection = document.getElementById('feed-section');
const profileSection = document.getElementById('profile-section');
const commissionsSection = document.getElementById('commissions-section');
const feedList = document.getElementById('feed-list');

document.addEventListener('DOMContentLoaded', () => {
  setupAuthEvents();
  setupNavigationEvents();
  setupCreateModalEvents();
  setupProfileAndCommissionEvents();
  setupTagSearch();
  setupInfiniteScroll();

  if (api.getToken() && state.user) enterApp();
  else showAuthView();
});

function showAuthView() {
  authView.classList.remove('hidden');
  appView.classList.add('hidden');
}

function enterApp() {
  authView.classList.add('hidden');
  appView.classList.remove('hidden');

  const displayName = state.user.nombreArtista || state.user.nombre;
  document.getElementById('sidebar-artist-name').textContent = displayName;
  document.getElementById('sidebar-avatar').textContent = displayName.charAt(0).toUpperCase();
  document.getElementById('sidebar-role-badge').textContent = state.user.role;

  resetAndLoadFeed();
}

// ================= AUTH =================
function setupAuthEvents() {
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const authError = document.getElementById('auth-error');

  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active'); tabRegister.classList.remove('active');
    loginForm.classList.remove('hidden'); registerForm.classList.add('hidden');
  });

  tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active'); tabLogin.classList.remove('active');
    registerForm.classList.remove('hidden'); loginForm.classList.add('hidden');
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const res = await api.login(
        document.getElementById('login-gmail').value.trim(),
        document.getElementById('login-password').value
      );
      saveSession(res);
      enterApp();
    } catch (err) {
      authError.textContent = err.message;
      authError.classList.remove('hidden');
    }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const res = await api.register({
        nombre: document.getElementById('reg-nombre').value.trim(),
        nombreArtista: document.getElementById('reg-artista').value.trim() || undefined,
        gmail: document.getElementById('reg-gmail').value.trim(),
        password: document.getElementById('reg-password').value,
        adminPassword: document.getElementById('reg-admin').value.trim() || undefined
      });
      saveSession(res);
      enterApp();
    } catch (err) {
      authError.textContent = err.message;
      authError.classList.remove('hidden');
    }
  });

  document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.clear();
    state.user = null;
    showAuthView();
  });
}

function saveSession({ user, token }) {
  state.user = user;
  localStorage.setItem('socialart_token', token);
  localStorage.setItem('socialart_user', JSON.stringify(user));
}

function getCurrentUserId() {
  if (!state.user) return null;
  return state.user.id || state.user._id || null;
}
// ================= NAVEGACIÓN =================
function setupNavigationEvents() {
  const navFeed = document.getElementById('nav-feed');
  const navProfile = document.getElementById('nav-profile');
  const navComm = document.getElementById('nav-commissions');
  const sidebarUserBtn = document.getElementById('sidebar-user-btn');

  const hideAllViews = () => {
    [feedSection, profileSection, commissionsSection].forEach(el => el.classList.add('hidden'));
    [navFeed, navProfile, navComm, sidebarUserBtn].forEach(el => el.classList.remove('active'));
  };

  const switchToFeed = () => {
    hideAllViews();
    navFeed.classList.add('active');
    feedSection.classList.remove('hidden');
  };

  const switchToMyPortfolio = () => {
    hideAllViews();
    navProfile.classList.add('active');
    sidebarUserBtn.classList.add('active');
    openArtistProfile(state.user.id);
  };

  navFeed.addEventListener('click', switchToFeed);
  document.getElementById('nav-home-logo').addEventListener('click', switchToFeed);
  document.getElementById('btn-back-feed').addEventListener('click', switchToFeed);
  navProfile.addEventListener('click', switchToMyPortfolio);
  sidebarUserBtn.addEventListener('click', switchToMyPortfolio);

  navComm.addEventListener('click', () => {
    hideAllViews();
    navComm.classList.add('active');
    commissionsSection.classList.remove('hidden');
    loadCommissionsInbox();
  });
}

// ================= BUSCADOR DE ETIQUETAS =================
function setupTagSearch() {
  const input = document.getElementById('tag-search-input');
  const clearBtn = document.getElementById('btn-clear-tag');

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      filterByTag(input.value.trim());
    }
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    filterByTag('');
  });
}

function filterByTag(tag) {
  const cleanTag = tag.replace(/^#/, '').toLowerCase();
  state.activeTag = cleanTag;
  const banner = document.getElementById('active-tag-banner');
  const clearBtn = document.getElementById('btn-clear-tag');

  if (cleanTag) {
    banner.textContent = `Filtrando por etiqueta: #${cleanTag}`;
    banner.classList.remove('hidden');
    clearBtn.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
    clearBtn.classList.add('hidden');
  }

  resetAndLoadFeed();
}

// ================= FEED & INFINITE SCROLL =================
function setupInfiniteScroll() {
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && state.hasMore && !state.isLoadingFeed && !feedSection.classList.contains('hidden')) {
      loadNextFeedPage();
    }
  }, { rootMargin: '200px' });
  observer.observe(document.getElementById('scroll-sentinel'));
}

function resetAndLoadFeed() {
  state.page = 1;
  state.hasMore = true;
  feedList.innerHTML = '';
  document.getElementById('feed-end-msg').classList.add('hidden');
  loadNextFeedPage();
}

async function loadNextFeedPage() {
  if (state.isLoadingFeed || !state.hasMore) return;
  state.isLoadingFeed = true;
  document.getElementById('feed-spinner').classList.remove('hidden');

  try {
    const data = await api.getFeed(state.page, state.limit, state.activeTag);
    data.artworks.forEach(art => renderPostCard(art));
    state.hasMore = data.hasMore;
    state.page += 1;
    if (!state.hasMore) document.getElementById('feed-end-msg').classList.remove('hidden');
  } catch (err) {
    console.error(err);
  } finally {
    state.isLoadingFeed = false;
    document.getElementById('feed-spinner').classList.add('hidden');
  }
}

function renderPostCard(art) {
  const autor = art.autor || { _id: '', nombre: 'Anónimo', nombreArtista: 'Anónimo' };
  const artistName = autor.nombreArtista || autor.nombre;
  const mediaList = art.media && art.media.length > 0 ? art.media : [{ url: art.imagenUrl, tipo: 'image' }];

  const slidesHTML = mediaList.map((m, idx) => `
    <div class="carousel-slide ${idx === 0 ? 'active' : ''}" data-index="${idx}">
      ${m.tipo === 'video' 
        ? `<video src="${escapeHTML(m.url)}" controls playsinline></video>` 
        : `<img src="${escapeHTML(m.url)}" alt="${escapeHTML(art.titulo)}" loading="lazy" />`}
    </div>
  `).join('');

  const tagsHTML = (art.etiquetas || [])
    .map(t => `<span class="hashtag-pill" data-tag="${escapeHTML(t)}">#${escapeHTML(t)}</span>`)
    .join('');

  const card = document.createElement('article');
  card.className = 'post-card';
  card.innerHTML = `
    <div class="post-header">
      <div class="post-author" data-author-id="${autor._id}">
        <div class="avatar-circle small">${artistName.charAt(0).toUpperCase()}</div>
        <div class="author-details">
          <span class="author-name">${escapeHTML(artistName)}</span>
          <span class="author-sub">${autor.aceptaComisiones ? '🟢 Comisiones abiertas' : escapeHTML(autor.nombre)}</span>
        </div>
      </div>
      <span class="post-date">${new Date(art.createdAt).toLocaleDateString('es-ES')}</span>
    </div>

    <div class="carousel-wrapper">
      ${slidesHTML}
      ${mediaList.length > 1 ? `
        <button class="carousel-btn prev" type="button">‹</button>
        <button class="carousel-btn next" type="button">›</button>
        <span class="carousel-counter">1 / ${mediaList.length}</span>
      ` : ''}
    </div>

    <div class="post-body">
      <h3 class="post-title">${escapeHTML(art.titulo)}</h3>
      ${art.descripcion ? `<p class="post-description">${escapeHTML(art.descripcion)}</p>` : ''}
      ${tagsHTML ? `<div class="post-tags">${tagsHTML}</div>` : ''}
      <div class="social-tags">${buildSocialLinksHTML(art.redesSociales)}</div>
    </div>
  `;

  // Navegación del carrusel si hay más de 1 foto/video
  if (mediaList.length > 1) {
    let currentSlide = 0;
    const slides = card.querySelectorAll('.carousel-slide');
    const counter = card.querySelector('.carousel-counter');

    const showSlide = (n) => {
      slides[currentSlide].classList.remove('active');
      currentSlide = (n + slides.length) % slides.length;
      slides[currentSlide].classList.add('active');
      counter.textContent = `${currentSlide + 1} / ${slides.length}`;
    };

    card.querySelector('.prev').addEventListener('click', () => showSlide(currentSlide - 1));
    card.querySelector('.next').addEventListener('click', () => showSlide(currentSlide + 1));
  }

  // Clic en etiquetas para filtrar
  card.querySelectorAll('.hashtag-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.getElementById('tag-search-input').value = `#${pill.dataset.tag}`;
      filterByTag(pill.dataset.tag);
    });
  });

  // Clic en autor para abrir su perfil
  card.querySelector('.post-author').addEventListener('click', () => {
    if (autor._id) {
      feedSection.classList.add('hidden');
      profileSection.classList.remove('hidden');
      openArtistProfile(autor._id);
    }
  });

  feedList.appendChild(card);
}

// ================= PERFIL (SEGUIDORES, SEGUIDOS Y COMISIONES) =================
async function openArtistProfile(artistId) {
  state.currentViewedProfileId = artistId;
  const grid = document.getElementById('profile-grid');
  const isMe = artistId === state.user.id;

  document.getElementById('profile-quick-add').classList.toggle('hidden', !isMe);
  document.getElementById('my-commission-toggle-box').classList.toggle('hidden', !isMe);
  document.getElementById('other-user-actions').classList.toggle('hidden', isMe);

  grid.innerHTML = '<p style="color: var(--text-secondary);">Cargando portafolio...</p>';

  try {
    const data = await api.getArtistGallery(artistId);
    const { artista, totalPublicaciones, publicaciones } = data;
    const displayName = artista.nombreArtista || artista.nombre;

    document.getElementById('profile-handle-top').textContent = `@${displayName.toLowerCase().replace(/\s+/g, '')}`;
    document.getElementById('profile-avatar').textContent = displayName.charAt(0).toUpperCase();
    document.getElementById('profile-artist-name').textContent = displayName;
    document.getElementById('profile-posts-count').textContent = totalPublicaciones;
    document.getElementById('profile-followers-count').textContent = artista.totalSeguidores;
    document.getElementById('profile-following-count').textContent = artista.totalSiguiendo;
    document.getElementById('profile-real-name').textContent = artista.nombre;
    document.getElementById('profile-joined').textContent = `Miembro desde ${new Date(artista.miembroDesde).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;

    if (isMe) {
      const toggle = document.getElementById('toggle-my-commissions');
      toggle.checked = artista.aceptaComisiones;
      document.getElementById('commission-status-text').textContent =
        artista.aceptaComisiones ? '🟢 Aceptando comisiones' : '🔴 Comisiones cerradas';
    } else {
      const followBtn = document.getElementById('btn-follow-user');
      followBtn.textContent = artista.loSigo ? 'Siguiendo' : 'Seguir';
      followBtn.classList.toggle('following', artista.loSigo);

      const commBtn = document.getElementById('btn-request-comm');
      commBtn.classList.toggle('hidden', !artista.aceptaComisiones);
      document.getElementById('comm-target-name').textContent = displayName;
    }

    grid.innerHTML = '';
    if (publicaciones.length === 0) {
      grid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1;">Sin publicaciones aún.</p>';
      return;
    }

    publicaciones.forEach(art => {
      const firstMedia = art.media && art.media[0] ? art.media[0] : { url: art.imagenUrl, tipo: 'image' };
      const item = document.createElement('div');
      item.className = 'grid-item';
      item.innerHTML = `
        ${firstMedia.tipo === 'video' 
          ? `<video src="${escapeHTML(firstMedia.url)}" muted></video>` 
          : `<img src="${escapeHTML(firstMedia.url)}" alt="${escapeHTML(art.titulo)}" />`}
        <div class="grid-item-overlay">
          <strong>${escapeHTML(art.titulo)} ${art.media?.length > 1 ? `(+${art.media.length - 1})` : ''}</strong>
        </div>
      `;
      grid.appendChild(item);
    });
  } catch (err) {
    grid.innerHTML = `<p class="error-banner">${err.message}</p>`;
  }
}

function setupProfileAndCommissionEvents() {
  // Seguir / Dejar de seguir
  document.getElementById('btn-follow-user').addEventListener('click', async () => {
    try {
      const res = await api.toggleFollow(state.currentViewedProfileId);
      const btn = document.getElementById('btn-follow-user');
      btn.textContent = res.siguiendo ? 'Siguiendo' : 'Seguir';
      btn.classList.toggle('following', res.siguiendo);
      document.getElementById('profile-followers-count').textContent = res.totalSeguidores;
    } catch (err) { alert(err.message); }
  });

  // Interruptor de comisiones propio
  document.getElementById('toggle-my-commissions').addEventListener('change', async (e) => {
    try {
      const res = await api.toggleCommissions(e.target.checked);
      document.getElementById('commission-status-text').textContent =
        res.aceptaComisiones ? '🟢 Aceptando comisiones' : '🔴 Comisiones cerradas';
    } catch (err) { alert(err.message); }
  });

  // Modal solicitar comisión
  const commModal = document.getElementById('request-comm-modal');
  document.getElementById('btn-request-comm').addEventListener('click', () => commModal.classList.remove('hidden'));
  document.getElementById('close-comm-modal').addEventListener('click', () => commModal.classList.add('hidden'));

  document.getElementById('request-comm-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const detalles = document.getElementById('comm-details').value.trim();
      await api.requestCommission(state.currentViewedProfileId, detalles);
      document.getElementById('request-comm-form').reset();
      commModal.classList.add('hidden');
      alert('¡Solicitud enviada! Cuando el artista acepte se abrirá el chat en Comisiones & Chat.');
    } catch (err) { alert(err.message); }
  });
}

// ================= BANDEJA DE COMISIONES Y CHAT =================
async function loadCommissionsInbox() {
  const listEl = document.getElementById('commissions-list');
  listEl.innerHTML = '<p style="padding:16px; color:var(--text-secondary);">Cargando...</p>';

  try {
    const commissions = await api.getMyCommissions();
    listEl.innerHTML = '';

    if (commissions.length === 0) {
      listEl.innerHTML = '<p style="padding:16px; color:var(--text-secondary);">No tienes solicitudes de comisión aún.</p>';
      return;
    }

    commissions.forEach(comm => {
      const soyArtista = comm.artista._id === state.user.id;
      const contraparte = soyArtista ? comm.cliente : comm.artista;
      const nombreContraparte = contraparte.nombreArtista || contraparte.nombre;

      const item = document.createElement('div');
      item.className = 'comm-item';
      item.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
          <strong>${escapeHTML(nombreContraparte)}</strong>
          <span class="comm-status-badge ${comm.estado}">${comm.estado}</span>
        </div>
        <p style="font-size:0.8rem; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
          ${soyArtista ? 'Te pidió:' : 'Pediste:'} ${escapeHTML(comm.detallesIniciales)}
        </p>
      `;
      item.addEventListener('click', () => openCommissionChat(comm));
      listEl.appendChild(item);
    });
  } catch (err) {
    listEl.innerHTML = `<p class="error-banner">${err.message}</p>`;
  }
}

function openCommissionChat(comm) {
  state.activeCommissionId = comm._id;
  const chatBox = document.getElementById('commission-chat-box');
  const soyArtista = comm.artista._id === state.user.id;
  const contraparte = soyArtista ? comm.cliente : comm.artista;

  let actionAreaHTML = '';
  if (comm.estado === 'pendiente' && soyArtista) {
    actionAreaHTML = `
      <div style="display:flex; gap:8px;">
        <button id="btn-accept-comm" class="btn-follow" type="button">Aceptar Comisión</button>
        <button id="btn-reject-comm" class="btn-logout" type="button">Rechazar</button>
      </div>
    `;
  }

  const messagesHTML = comm.mensajes.map(m => {
    const isMine = m.remitente === state.user.id;
    return `<div class="msg-bubble ${isMine ? 'mine' : 'theirs'}">${escapeHTML(m.texto)}</div>`;
  }).join('');

  chatBox.innerHTML = `
    <div class="chat-header">
      <div>
        <strong>${escapeHTML(contraparte.nombreArtista || contraparte.nombre)}</strong>
        <span class="comm-status-badge ${comm.estado}" style="margin-left:8px;">${comm.estado}</span>
      </div>
      ${actionAreaHTML}
    </div>
    <div class="chat-messages" id="chat-messages-scroll">${messagesHTML}</div>
    ${comm.estado === 'aceptada' ? `
      <form id="chat-send-form" class="chat-input-bar">
        <input type="text" id="chat-msg-input" placeholder="Escribe un mensaje sobre la comisión..." required />
        <button type="submit" class="btn-primary" style="width:auto; margin:0; padding:0 18px;">Enviar</button>
      </form>
    ` : `<p style="padding:12px; text-align:center; color:var(--text-secondary); font-size:0.85rem;">
      ${comm.estado === 'pendiente' ? 'Esperando que el artista acepte para habilitar el chat...' : 'Esta solicitud fue rechazada.'}
    </p>`}
  `;

  if (document.getElementById('btn-accept-comm')) {
    document.getElementById('btn-accept-comm').addEventListener('click', async () => {
      const updated = await api.respondCommission(comm._id, 'aceptada');
      loadCommissionsInbox();
      openCommissionChat(updated);
    });
    document.getElementById('btn-reject-comm').addEventListener('click', async () => {
      const updated = await api.respondCommission(comm._id, 'rechazada');
      loadCommissionsInbox();
      openCommissionChat(updated);
    });
  }

  if (document.getElementById('chat-send-form')) {
    document.getElementById('chat-send-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = document.getElementById('chat-msg-input');
      const updated = await api.sendCommissionMessage(comm._id, input.value.trim());
      openCommissionChat(updated);
    });
  }
}

// ================= MODAL CREAR OBRA (DRAG & DROP + ETIQUETAS) =================
function setupCreateModalEvents() {
  const modal = document.getElementById('create-modal');
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('art-files');
  const tagInput = document.getElementById('art-tag-input');

  const openModal = () => modal.classList.remove('hidden');
  document.getElementById('nav-create').addEventListener('click', openModal);
  document.getElementById('profile-quick-add').addEventListener('click', openModal);
  document.getElementById('close-create-modal').addEventListener('click', () => modal.classList.add('hidden'));

  // Click o Arrastrar archivos
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    addSelectedFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener('change', (e) => addSelectedFiles(e.target.files));

  // Etiquetas interactivas
  tagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = tagInput.value.trim().replace(/^#/, '').replace(/,/g, '').toLowerCase();
      if (clean && !state.selectedTags.includes(clean)) {
        state.selectedTags.push(clean);
        renderSelectedTags();
      }
      tagInput.value = '';
    }
  });

  // Enviar publicación con FormData
  document.getElementById('create-artwork-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errBox = document.getElementById('create-error');
    errBox.classList.add('hidden');

    if (state.selectedFiles.length === 0) {
      errBox.textContent = 'Arrastra o selecciona al menos una imagen o video.';
      errBox.classList.remove('hidden');
      return;
    }

    const formData = new FormData();
    formData.append('titulo', document.getElementById('art-titulo').value.trim());
    formData.append('descripcion', document.getElementById('art-descripcion').value.trim());
    formData.append('etiquetas', JSON.stringify(state.selectedTags));
    formData.append('redesSociales', JSON.stringify({
      instagram: document.getElementById('social-ig').value.trim(),
      twitter: document.getElementById('social-tw').value.trim(),
      artstation: document.getElementById('social-artstation').value.trim(),
      otro: document.getElementById('social-otro').value.trim()
    }));

    state.selectedFiles.forEach(file => formData.append('media', file));

    try {
      await api.createArtworkFormData(formData);
      state.selectedFiles = [];
      state.selectedTags = [];
      renderMediaPreviews();
      renderSelectedTags();
      document.getElementById('create-artwork-form').reset();
      modal.classList.add('hidden');
      document.getElementById('nav-feed').click();
      resetAndLoadFeed();
    } catch (err) {
      errBox.textContent = err.message;
      errBox.classList.remove('hidden');
    }
  });
}

function addSelectedFiles(fileList) {
  Array.from(fileList).forEach(file => {
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      state.selectedFiles.push(file);
    }
  });
  renderMediaPreviews();
}

function renderMediaPreviews() {
  const grid = document.getElementById('multi-preview-grid');
  grid.innerHTML = '';
  grid.classList.toggle('hidden', state.selectedFiles.length === 0);

  state.selectedFiles.forEach((file, idx) => {
    const url = URL.createObjectURL(file);
    const thumb = document.createElement('div');
    thumb.className = 'preview-thumb';
    thumb.innerHTML = `
      ${file.type.startsWith('video/') ? `<video src="${url}" muted></video>` : `<img src="${url}" />`}
      <button type="button" class="remove-media-btn">✕</button>
    `;
    thumb.querySelector('.remove-media-btn').addEventListener('click', () => {
      state.selectedFiles.splice(idx, 1);
      renderMediaPreviews();
    });
    grid.appendChild(thumb);
  });
}

function renderSelectedTags() {
  const container = document.getElementById('selected-tags-list');
  container.innerHTML = state.selectedTags.map((tag, idx) => `
    <span class="tag-chip-edit">#${escapeHTML(tag)} <b style="cursor:pointer;" data-idx="${idx}">×</b></span>
  `).join('');

  container.querySelectorAll('b').forEach(btn => {
    btn.addEventListener('click', () => {
      state.selectedTags.splice(Number(btn.dataset.idx), 1);
      renderSelectedTags();
    });
  });
}

function buildSocialLinksHTML(redes = {}) {
  if (!redes) return '';
  const labels = { instagram: 'Instagram', twitter: 'X / Twitter', artstation: 'ArtStation', otro: 'Enlace' };
  return Object.entries(redes)
    .filter(([_, val]) => val && val.trim() !== '')
    .map(([key, val]) => {
      const href = val.startsWith('http') ? val : `https://${key}.com/${val.replace('@', '')}`;
      return `<a href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer" class="social-chip">🔗 ${labels[key] || key}</a>`;
    }).join('');
}

function escapeHTML(str = '') {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}