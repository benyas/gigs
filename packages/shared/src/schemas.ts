import { z } from 'zod';

// Auth
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+212[0-9]{9}$/, 'Must be a valid Moroccan phone number (+212XXXXXXXXX)'),
  role: z.enum(['client', 'provider']),
});

export const otpRequestSchema = z.object({
  phone: z.string().regex(/^\+212[0-9]{9}$/),
});

export const otpVerifySchema = z.object({
  phone: z.string().regex(/^\+212[0-9]{9}$/),
  code: z.string().length(6),
});

// Gigs
export const createGigSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  basePrice: z.number().positive().max(100000),
  cityId: z.string().uuid(),
});

export const updateGigSchema = createGigSchema.partial();

export const gigFiltersSchema = z.object({
  categoryId: z.string().uuid().optional(),
  cityId: z.string().uuid().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  q: z.string().optional(),
  sort: z.enum(['recent', 'price_asc', 'price_desc', 'rating']).optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(50).default(20),
});

// Bookings
export const createBookingSchema = z.object({
  gigId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  address: z.string().min(5).max(500),
  notes: z.string().max(2000).optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['accepted', 'in_progress', 'completed', 'cancelled']),
});

// Reviews
export const createReviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(2000),
});

// Profile
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(2000).optional(),
  phone: z.string().regex(/^\+212[0-9]{9}$/, 'Must be a valid Moroccan phone number (+212XXXXXXXXX)').optional(),
  cityId: z.string().uuid().optional(),
});

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(50).default(20),
});

// Types inferred from schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateGigInput = z.infer<typeof createGigSchema>;
export type UpdateGigInput = z.infer<typeof updateGigSchema>;
export type GigFiltersInput = z.infer<typeof gigFiltersSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
