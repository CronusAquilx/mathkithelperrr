import { z } from "zod";

export const MAX_UPLOAD_BYTES = 500 * 1024 * 1024;
export const relativeKey = z
  .string()
  .min(1)
  .max(1024)
  .refine((key) => {
    return (
      !/[\\%\x00-\x1f\x7f?#:]/.test(key) &&
      !key.startsWith("/") &&
      key
        .split("/")
        .every(
          (part) =>
            part.length > 0 &&
            part !== "." &&
            part !== ".." &&
            part.trim() === part &&
            part.length <= 255,
        )
    );
  }, "Use a relative file path without traversal or encoded characters.");
export const folderPath = z.union([z.literal(""), relativeKey]);
export const uploadMetadata = z
  .object({
    key: relativeKey,
    size: z.number().int().positive().max(MAX_UPLOAD_BYTES),
    contentType: z
      .string()
      .min(3)
      .max(127)
      .regex(/^[a-zA-Z0-9!#$&^_.+-]+\/[a-zA-Z0-9!#$&^_.+-]+$/),
  })
  .strict();
export const storageInput = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("list"), folder: folderPath.default("") }).strict(),
  uploadMetadata.extend({ operation: z.literal("upload") }).strict(),
  z
    .object({
      operation: z.literal("confirm"),
      key: relativeKey,
      size: z.number().int().positive().max(MAX_UPLOAD_BYTES),
    })
    .strict(),
  z.object({ operation: z.literal("download"), key: relativeKey }).strict(),
  z.object({ operation: z.literal("share"), key: relativeKey }).strict(),
]);
export type StorageInput = z.infer<typeof storageInput>;
export type StorageFile = {
  key: string;
  size: number;
  lastModified: string | null;
  contentType: string | null;
};
export type StorageResult =
  | { ok: true; operation: "list"; files: StorageFile[] }
  | {
      ok: true;
      operation: "upload";
      url: string;
      key: string;
      expiresInSeconds: number;
      contentType: string;
    }
  | { ok: true; operation: "download" | "share"; url: string }
  | { ok: true; operation: "confirm" }
  | { ok: false; status: number; error: string };
