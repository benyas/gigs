const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type FetchOptions = RequestInit & { token?: string; revalidate?: number | false };

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, revalidate, ...init } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit & { next?: { revalidate?: number | false } } = {
    ...init,
    headers,
  };

  // Add Next.js cache revalidation for server components
  if (revalidate !== undefined) {
    fetchOptions.next = { revalidate };
  }

  const res = await fetch(`${API_URL}/api${path}`, fetchOptions);

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

// Categories (cached 5 min — rarely changes)
export const categories = {
  list: () => apiFetch<any[]>('/categories', { revalidate: 300 }),
};

// Cities (cached 5 min — rarely changes)
export const cities = {
  list: () => apiFetch<any[]>('/cities', { revalidate: 300 }),
};

// Gigs
export const gigs = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<{ data: any[]; meta: any }>(`/gigs${query}`, { revalidate: 30 });
  },
  getBySlug: (slug: string) => apiFetch<any>(`/gigs/${slug}`, { revalidate: 60 }),
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
    apiFetch<any[]>(`/gigs/suggestions?q=${encodeURIComponent(q)}`, { revalidate: 60 }),
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
  provider: (id: string) => apiFetch<any>(`/profile/provider/${id}`, { revalidate: 60 }),
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
  provider: (id: string) => apiFetch<any[]>(`/availability/provider/${id}`, { revalidate: 60 }),
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

// Payments & Wallet
export const payments = {
  initiate: (bookingId: string, token: string) =>
    apiFetch<{ paymentUrl: string; orderId: string }>('/payments/initiate', {
      method: 'POST', body: JSON.stringify({ bookingId }), token,
    }),
  wallet: (token: string) =>
    apiFetch<{ balance: number; pendingBalance: number; totalEarned: number }>('/wallet', { token }),
  transactions: (token: string, page = 1) =>
    apiFetch<{ data: any[]; meta: any }>(`/wallet/transactions?page=${page}`, { token }),
  refund: (bookingId: string, token: string) =>
    apiFetch<any>(`/payments/refund/${bookingId}`, { method: 'POST', token }),
};


// Verification
export const verification = {
  upload: (file: File, type: string, token: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', type);
    return apiUpload<any>('/verification/upload', fd, token);
  },
  mine: (token: string) => apiFetch<any[]>('/verification/mine', { token }),
};

// Disputes
export const disputes = {
  create: (bookingId: string, reason: string, token: string) =>
    apiFetch<any>('/disputes', { method: 'POST', body: JSON.stringify({ bookingId, reason }), token }),
  list: (token: string, page = 1) =>
    apiFetch<{ data: any[]; meta: any }>(`/disputes?page=${page}`, { token }),
  get: (id: string, token: string) =>
    apiFetch<any>(`/disputes/${id}`, { token }),
  addMessage: (id: string, content: string, token: string) =>
    apiFetch<any>(`/disputes/${id}/messages`, { method: 'POST', body: JSON.stringify({ content }), token }),
};

// Favorites
export const favorites = {
  toggle: (gigId: string, token: string) =>
    apiFetch<{ favorited: boolean }>(`/favorites/${gigId}`, { method: 'POST', token }),
  list: (token: string, page = 1) =>
    apiFetch<{ data: any[]; meta: any }>(`/favorites?page=${page}`, { token }),
  check: (gigId: string, token: string) =>
    apiFetch<{ favorited: boolean }>(`/favorites/${gigId}/check`, { token }),
};

// Coupons
export const coupons = {
  validate: (code: string, orderValue: number, token: string) =>
    apiFetch<{ valid: boolean; discountAmount: number }>('/coupons/validate', {
      method: 'POST', body: JSON.stringify({ code, orderValue }), token,
    }),
};

// Referrals
export const referrals = {
  getCode: (token: string) =>
    apiFetch<{ code: string }>('/referrals/code', { token }),
  apply: (code: string, token: string) =>
    apiFetch<any>('/referrals/apply', { method: 'POST', body: JSON.stringify({ code }), token }),
  mine: (token: string) =>
    apiFetch<any>('/referrals', { token }),
};

// Portfolio
export const portfolio = {
  list: (providerId: string) =>
    apiFetch<any[]>(`/portfolio/${providerId}`, { revalidate: 60 }),
  create: (file: File, title: string, description: string, token: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', title);
    fd.append('description', description);
    return apiUpload<any>('/portfolio', fd, token);
  },
  update: (id: string, data: { title?: string; description?: string; sortOrder?: number }, token: string) =>
    apiFetch<any>(`/portfolio/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),
  remove: (id: string, token: string) =>
    apiFetch<any>(`/portfolio/${id}`, { method: 'DELETE', token }),
};

// Invoices
export const invoices = {
  download: (bookingId: string, token: string) =>
    `${API_URL}/api/bookings/${bookingId}/invoice?token=${token}`,
};

// Calendar
export const calendar = {
  bookingIcs: (bookingId: string, token: string) =>
    `${API_URL}/api/bookings/${bookingId}/calendar?token=${token}`,
  scheduleIcs: (token: string) =>
    `${API_URL}/api/availability/export?token=${token}`,
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
