import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string()
    .min(1, 'El nombre es obligatorio')
    .max(100, 'El nombre no puede superar 100 caracteres')
    .trim(),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'El color debe ser un código hexadecimal válido (#RRGGBB)')
    .optional()
    .default('#3B82F6'),
});

export const updateCategorySchema = createCategorySchema.partial();
