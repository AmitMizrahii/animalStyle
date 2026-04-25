import { z } from "zod";

export * from "./post-api";
export * from "./user-api";
export * from "./auth-api";
export * from "./search-api";

export const User = z.object({
  _id: z.string(),
  username: z.string(),
  email: z.string(),
  profileImagePath: z.string().optional(),
});

export type User = z.infer<typeof User>;

export const UserWithToken = z.object({
  ...User.shape,
  token: z.string(),
  refreshToken: z.string(),
});

export type UserWithToken = z.infer<typeof UserWithToken>;

export const ApiError = z.object({
  message: z.string(),
  code: z.string(),
  statusCode: z.number(),
});
export type ApiError = z.infer<typeof ApiError>;

export const Comment = z.object({
  _id: z.string(),
  postId: z.string(),
  userId: User,
  content: z.string(),
  createdAt: z.string(),
});

export type Comment = z.infer<typeof Comment>;

export const AnimalPost = z.object({
  _id: z.string(),
  name: z.string(),
  type: z.enum(["dog", "cat", "other"]),
  age: z.number(),
  gender: z.enum(["male", "female"]),
  description: z.string(),
  location: z.string(),
  imagePaths: z.array(z.string()),
  createdBy: User,
  likes: z.array(z.string()),
  commentsCount: z.number(),
  createdAt: z.string(),
  isLiked: z.boolean().optional(),
  size: z.enum(["small", "medium", "large"]).optional(),
  vaccinated: z.boolean().optional(),
  neutered: z.boolean().optional(),
  goodWithKids: z.boolean().optional(),
  goodWithOtherAnimals: z.boolean().optional(),
  adoptionStatus: z.enum(["available", "pending", "adopted"]).optional(),
});

export type AnimalPost = z.infer<typeof AnimalPost>;

export const PaginatedResponse = <T extends z.ZodTypeAny>(itemSchema: T) => {
  return z.object({
    data: z.array(itemSchema),
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    hasMore: z.boolean(),
  });
};

export type PaginatedResponse<T extends z.ZodTypeAny> = z.infer<
  z.ZodObject<{
    data: z.ZodArray<T>;
    page: z.ZodNumber;
    limit: z.ZodNumber;
    total: z.ZodNumber;
    hasMore: z.ZodBoolean;
  }>
>;
