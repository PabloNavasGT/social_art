const API_BASE_URL = 'http://localhost:3000/api';

class ApiClient {
  getToken() {
    return localStorage.getItem('socialart_token');
  }

  getHeaders(withAuth = true, isJson = true) {
    const headers = {};
    if (isJson) headers['Content-Type'] = 'application/json';
    if (withAuth && this.getToken()) {
      headers['Authorization'] = `Bearer ${this.getToken()}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Error en la petición');
    }
    return data.data;
  }

  register(payload) {
    return this.request('/auth/register', {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify(payload)
    });
  }

  login(gmail, password) {
    return this.request('/auth/login', {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ gmail, password })
    });
  }

  getFeed(page = 1, limit = 6, tag = '') {
    const query = new URLSearchParams({ page, limit });
    if (tag) query.append('tag', tag);
    return this.request(`/artworks/feed?${query.toString()}`, {
      headers: this.getHeaders(true)
    });
  }

  createArtworkFormData(formData) {
    return this.request('/artworks', {
      method: 'POST',
      headers: this.getHeaders(true, false),
      body: formData
    });
  }

  getArtistGallery(userId) {
    return this.request(`/artworks/artist/${userId}`, {
      headers: this.getHeaders(true)
    });
  }

  toggleFollow(userId) {
    return this.request(`/users/${userId}/follow`, {
      method: 'POST',
      headers: this.getHeaders(true)
    });
  }

  toggleCommissions(aceptaComisiones) {
    return this.request('/users/commissions/toggle', {
      method: 'PATCH',
      headers: this.getHeaders(true),
      body: JSON.stringify({ aceptaComisiones })
    });
  }

  requestCommission(artistaId, detallesIniciales) {
    return this.request('/commissions', {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ artistaId, detallesIniciales })
    });
  }

  getMyCommissions() {
    return this.request('/commissions', {
      headers: this.getHeaders(true)
    });
  }

  respondCommission(id, estado) {
    return this.request(`/commissions/${id}/respond`, {
      method: 'PATCH',
      headers: this.getHeaders(true),
      body: JSON.stringify({ estado })
    });
  }

  sendCommissionMessage(id, texto) {
    return this.request(`/commissions/${id}/messages`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ texto })
    });
  }
}

// Helper para obtener siempre el ID del usuario sin importar si viene como id o _id
function getCurrentUserId() {
  if (!state.user) return null;
  return state.user.id || state.user._id || null;
}

function setupNavigationEvents() {
  const navFeed = document.getElementById('nav-feed');
  const navProfile = document.getElementById('nav-profile');
  const navComm = document.getElementById('nav-commissions');
  const sidebarUserBtn = document.getElementById('sidebar-user-btn');

  const hideAllViews = () => {
    [feedSection, profileSection, commissionsSection].forEach(el => {
      if (el) el.classList.add('hidden');
    });
    [navFeed, navProfile, navComm, sidebarUserBtn].forEach(el => {
      if (el) el.classList.remove('active');
    });
  };

  const switchToFeed = () => {
    hideAllViews();
    navFeed.classList.add('active');
    feedSection.classList.remove('hidden');
  };

  const switchToMyPortfolio = () => {
    const myId = getCurrentUserId();
    if (!myId) {
      console.error('No se encontró el ID del usuario en sesión:', state.user);
      return;
    }
    hideAllViews();
    navProfile.classList.add('active');
    sidebarUserBtn.classList.add('active');
    profileSection.classList.remove('hidden'); // 👈 Asegura que se muestre la sección
    openArtistProfile(myId);
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

const api = new ApiClient();