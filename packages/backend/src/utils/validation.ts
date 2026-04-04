import { z } from "zod";
import { AppError } from "./errorHandler";

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export function parseOrThrow<S extends z.ZodTypeAny>(
  schema: S,
  data: unknown,
): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues
      .map((e: z.core.$ZodIssue) => e.message)
      .join(", ");
    throw new AppError(message, "INVALID_INPUT", 400);
  }
  return result.data;
}
