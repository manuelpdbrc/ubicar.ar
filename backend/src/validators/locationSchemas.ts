import { z } from 'zod';

export const createLocationSchema = z.object({
  name: z.string()
    .min(1, 'El nombre es obligatorio')
    .max(200, 'El nombre no puede superar 200 caracteres')
    .trim(),
  latitude: z.number({ coerce: true })
    .min(-90, 'Latitud debe estar entre -90 y 90')
    .max(90, 'Latitud debe estar entre -90 y 90'),
  longitude: z.number({ coerce: true })
    .min(-180, 'Longitud debe estar entre -180 y 180')
    .max(180, 'Longitud debe estar entre -180 y 180'),
  categoryId: z.number({ coerce: true })
    .int('El ID de categoría debe ser un número entero')
    .positive('El ID de categoría debe ser positivo'),
});

export const updateLocationSchema = createLocationSchema.partial();

export const locationCodeParamSchema = z.object({
  code: z.string().min(1, 'El código es obligatorio'),
});

export const locationIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID inválido').transform(Number),
});
