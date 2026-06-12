import { z } from 'zod';

export const createVisitSchema = z.object({
  locationId: z.coerce.number().int().positive('ID de ubicación inválido'),
  type: z.enum(['SPONTANEOUS', 'CIRCUIT']).default('SPONTANEOUS'),
  circuitId: z.coerce.number().int().positive().optional(),
  comment: z.string().max(1000, 'El comentario es muy largo').optional(),
  formData: z.string().optional().transform(val => {
    if (!val) return null;
    try {
      return JSON.parse(val);
    } catch {
      return null;
    }
  }),
});
