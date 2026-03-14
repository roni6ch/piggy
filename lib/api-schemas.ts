import { z } from 'zod';

/** Valid club values for user-built cards (must match Club enum / DB). */
const clubValues = ['max', 'diners', 'cal', 'isracard', 'discount', 'yoter', 'leumi', 'hapoalim'] as const;

/** Valid provider values for user-built cards (must match Provider enum). */
const providerValues = ['MASTERCARD', 'AMERICAN EXPRESS', 'VISA', 'DINERS', 'BIT'] as const;

export const addCardBodySchema = z.object({
  club: z.enum(clubValues),
  provider: z.enum(providerValues),
});

export const registerBodySchema = z.object({
  username: z.string().min(1, 'Username is required').max(100).refine((s) => !s.includes(' '), 'Username must not contain spaces'),
  email: z.string().email('Invalid email').transform((s) => s.trim().toLowerCase()),
  password: z.string().min(6, 'Password must be at least 6 characters').max(20).refine((s) => !s.includes(' '), 'Invalid password'),
});

export const profilePatchBodySchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  avatarAnimal: z.string().optional(),
  buymeAmount: z.number().min(0).optional(),
  buymeType: z.string().max(100).trim().optional(),
}).refine((data) => Object.values(data).some((v) => v !== undefined && v !== ''), 'At least one field required');

export const aiSearchBodySchema = z.object({
  query: z.string().min(1, 'query is required').max(500).trim(),
});

export const placesSearchBodySchema = z.object({
  query: z.string().min(1, 'query is required').max(500).trim(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const cardsQuerySchema = z.object({
  id: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  page: z.coerce.number().int().min(1).optional().default(1),
  all: z.enum(['true', '1', 'false', '0']).optional(),
});

export type AddCardBody = z.infer<typeof addCardBodySchema>;
export type RegisterBody = z.infer<typeof registerBodySchema>;
export type ProfilePatchBody = z.infer<typeof profilePatchBodySchema>;
export type AiSearchBody = z.infer<typeof aiSearchBodySchema>;
export type PlacesSearchBody = z.infer<typeof placesSearchBodySchema>;
export type CardsQuery = z.infer<typeof cardsQuerySchema>;
