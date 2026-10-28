import { z } from "zod";

const id = z.string().regex(/^[0-9a-f]{24}$/i);
export const createAlbumSchema = z.object({ name: z.string().trim().min(1).max(80) });
export const updateAlbumSchema = createAlbumSchema;
export const uploadInitSchema = z.object({
  albumId: id,
  fileName: z.string().trim().min(1).max(180),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  sizeBytes: z
    .number()
    .int()
    .min(1)
    .max(25 * 1024 * 1024),
  caption: z.string().trim().max(240).default(""),
});
export const uploadCompleteSchema = z.object({ photoId: id });
export const updatePhotoSchema = z
  .object({
    caption: z.string().trim().max(240).optional(),
    albumId: id.optional(),
    published: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0);
export type UploadInitInput = z.output<typeof uploadInitSchema>;
export type UpdatePhotoInput = z.output<typeof updatePhotoSchema>;
