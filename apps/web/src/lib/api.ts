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
};

// Reviews
export const reviews = {
  listForProvider: (providerId: string, page = 1) =>
    apiFetch<{ data: any[]; meta: any }>(`/reviews/provider/${providerId}?page=${page}`),
  create: (data: any, token: string) =>
    apiFetch<any>('/reviews', { method: 'POST', body: JSON.stringify(data), token }),
};
