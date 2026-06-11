import { z } from 'zod';

export const collectionSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(255),
  description: z.string().optional().nullable(),
});

export const addLocationSchema = z.object({
  locationId: z.number().int().positive(),
});

export const permissionSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['CREATOR', 'EDITOR', 'VIEWER']),
});
