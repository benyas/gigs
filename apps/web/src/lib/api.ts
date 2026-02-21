const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type FetchOptions = RequestInit & { token?: string };

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...init } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/api${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `API error: ${res.status}`);
  }

  return res.json();
}

async function apiUpload<T>(path: string, formData: FormData, token: string): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Upload error: ${res.status}`);
  }
  return res.json();
}

// Auth
export const auth = {
  login: (email: string, password: string) =>
    apiFetch<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (data: { email: string; password: string; name: string; phone: string; role: string }) =>
    apiFetch<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Categories
export const categories = {
  list: () => apiFetch<any[]>('/categories'),
};

// Cities
export const cities = {
  list: () => apiFetch<any[]>('/cities'),
};

// Gigs
export const gigs = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<{ data: any[]; meta: any }>(`/gigs${query}`);
  },
  getBySlug: (slug: string) => apiFetch<any>(`/gigs/${slug}`),
  mine: (token: string) => apiFetch<any[]>('/gigs/mine', { token }),
  create: (data: any, token: string) =>
    apiFetch<any>('/gigs', { method: 'POST', body: JSON.stringify(data), token }),
  update: (id: string, data: any, token: string) =>
    apiFetch<any>(`/gigs/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),
  uploadMedia: (gigId: string, files: File[], token: string) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    return apiUpload<any[]>(`/gigs/${gigId}/media`, fd, token);
  },
  deleteMedia: (gigId: string, mediaId: string, token: string) =>
    apiFetch<any>(`/gigs/${gigId}/media/${mediaId}`, { method: 'DELETE', token }),
  suggestions: (q: string) =>
    apiFetch<any[]>(`/gigs/suggestions?q=${encodeURIComponent(q)}`),
};

// Bookings
export const bookings = {
  create: (data: any, token: string) =>
    apiFetch<any>('/bookings', { method: 'POST', body: JSON.stringify(data), token }),
  list: (token: string, page = 1) =>
    apiFetch<{ data: any[]; meta: any }>(`/bookings?page=${page}`, { token }),
  updateStatus: (id: string, status: string, token: string) =>
    apiFetch<any>(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      token,
    }),
  cancel: (id: string, reason: string, token: string) =>
    apiFetch<any>(`/bookings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
      token,
    }),
};

// Reviews
export const reviews = {
  listForProvider: (providerId: string, page = 1) =>
    apiFetch<{ data: any[]; meta: any }>(`/reviews/provider/${providerId}?page=${page}`),
  create: (data: any, token: string) =>
    apiFetch<any>('/reviews', { method: 'POST', body: JSON.stringify(data), token }),
  reply: (reviewId: string, reply: string, token: string) =>
    apiFetch<any>(`/reviews/${reviewId}/reply`, { method: 'PATCH', body: JSON.stringify({ reply }), token }),
};

// Profile
export const profile = {
  get: (token: string) => apiFetch<any>('/profile', { token }),
  update: (data: any, token: string) =>
    apiFetch<any>('/profile', { method: 'PATCH', body: JSON.stringify(data), token }),
  provider: (id: string) => apiFetch<any>(`/profile/provider/${id}`),
  stats: (token: string) => apiFetch<any>('/profile/stats', { token }),
  uploadAvatar: (file: File, token: string) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiUpload<any>('/profile/avatar', fd, token);
  },
};

// Availability
export const availability = {
  get: (token: string) => apiFetch<any[]>('/availability', { token }),
  update: (slots: any[], token: string) =>
    apiFetch<any[]>('/availability', { method: 'PUT', body: JSON.stringify({ slots }), token }),
  provider: (id: string) => apiFetch<any[]>(`/availability/provider/${id}`),
};

// Admin
export const admin = {
  stats: (token: string) => apiFetch<any>('/admin/stats', { token }),
  users: (token: string, page = 1, role?: string, q?: string) => {
    const params = new URLSearchParams({ page: String(page) });
    if (role) params.set('role', role);
    if (q) params.set('q', q);
    return apiFetch<{ data: any[]; meta: any }>(`/admin/users?${params}`, { token });
  },
  updateUserRole: (id: string, role: string, token: string) =>
    apiFetch<any>(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }), token }),
  verifyUser: (id: string, verified: boolean, token: string) =>
    apiFetch<any>(`/admin/users/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ verified }), token }),
  gigs: (token: string, page = 1, status?: string) => {
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set('status', status);
    return apiFetch<{ data: any[]; meta: any }>(`/admin/gigs?${params}`, { token });
  },
  updateGigStatus: (id: string, status: string, token: string) =>
    apiFetch<any>(`/admin/gigs/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }), token }),
  bookings: (token: string, page = 1, status?: string) => {
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.set('status', status);
    return apiFetch<{ data: any[]; meta: any }>(`/admin/bookings?${params}`, { token });
  },
  createCategory: (data: any, token: string) =>
    apiFetch<any>('/admin/categories', { method: 'POST', body: JSON.stringify(data), token }),
  updateCategory: (id: string, data: any, token: string) =>
    apiFetch<any>(`/admin/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),
  deleteCategory: (id: string, token: string) =>
    apiFetch<any>(`/admin/categories/${id}`, { method: 'DELETE', token }),
  createCity: (data: any, token: string) =>
    apiFetch<any>('/admin/cities', { method: 'POST', body: JSON.stringify(data), token }),
  updateCity: (id: string, data: any, token: string) =>
    apiFetch<any>(`/admin/cities/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),
  deleteCity: (id: string, token: string) =>
    apiFetch<any>(`/admin/cities/${id}`, { method: 'DELETE', token }),
};

// Messaging
export const messaging = {
  conversations: (token: string) =>
    apiFetch<any[]>('/messaging/conversations', { token }),
  messages: (conversationId: string, token: string, page = 1) =>
    apiFetch<any>(`/messaging/conversations/${conversationId}/messages?page=${page}`, { token }),
  send: (conversationId: string, content: string, token: string) =>
    apiFetch<any>(`/messaging/conversations/${conversationId}/messages`, {
      method: 'POST', body: JSON.stringify({ content }), token,
    }),
  start: (providerId: string, message: string, token: string, bookingId?: string) =>
    apiFetch<any>('/messaging/conversations', {
      method: 'POST', body: JSON.stringify({ providerId, message, bookingId }), token,
    }),
  unread: (token: string) =>
    apiFetch<number>('/messaging/unread', { token }),
};

// Notifications
export const notifications = {
  list: (token: string, page = 1) =>
    apiFetch<any>(`/notifications?page=${page}`, { token }),
  unreadCount: (token: string) =>
    apiFetch<number>('/notifications/unread-count', { token }),
  markRead: (id: string, token: string) =>
    apiFetch<any>(`/notifications/${id}/read`, { method: 'PATCH', token }),
  markAllRead: (token: string) =>
    apiFetch<any>('/notifications/read-all', { method: 'PATCH', token }),
};
