const API_URL = 'http://localhost:4000/api';

document.addEventListener('alpine:init', () => {

  // Auth store
  Alpine.store('auth', {
    token: localStorage.getItem('gigs_admin_token'),
    user: JSON.parse(localStorage.getItem('gigs_admin_user') || 'null'),

    get isLoggedIn() { return !!this.token; },
    get isAdmin() { return this.user?.role === 'admin'; },
    get name() { return this.user?.profile?.name || this.user?.email || ''; },

    login(token, user) {
      this.token = token;
      this.user = user;
      localStorage.setItem('gigs_admin_token', token);
      localStorage.setItem('gigs_admin_user', JSON.stringify(user));
    },

    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('gigs_admin_token');
      localStorage.removeItem('gigs_admin_user');
      window.location.href = '/login.html';
    },

    guard() {
      if (!this.isLoggedIn) {
        window.location.href = '/login.html';
        return false;
      }
      return true;
    },
  });

  // API helper store
  Alpine.store('api', {
    async request(method, path, body) {
      const auth = Alpine.store('auth');
      const headers = { 'Authorization': 'Bearer ' + auth.token };
      if (body && !(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(body);
      }
      const res = await fetch(API_URL + path, { method, headers, body });
      if (res.status === 401) { auth.logout(); return null; }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Erreur ' + res.status);
      }
      return res.json();
    },

    get(path) { return this.request('GET', path); },
    post(path, body) { return this.request('POST', path, body); },
    patch(path, body) { return this.request('PATCH', path, body); },
    del(path) { return this.request('DELETE', path); },
  });

});

// Auth guard — run on every page except login
document.addEventListener('DOMContentLoaded', () => {
  if (!window.location.pathname.includes('login')) {
    Alpine.store('auth').guard();
  }
});
