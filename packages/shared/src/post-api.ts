import { z } from "zod";

export const createPostSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["dog", "cat", "other"]),
  age: z.coerce.number().min(0, "Age cannot be negative"),
  gender: z.enum(["male", "female"]),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(1, "Location is required"),
  imagePaths: z
    .array(z.string().min(1))
    .min(1, "At least one image is required"),
  size: z.enum(["small", "medium", "large"]).optional(),
  vaccinated: z.boolean().optional(),
  neutered: z.boolean().optional(),
  goodWithKids: z.boolean().optional(),
  goodWithOtherAnimals: z.boolean().optional(),
  adoptionStatus: z
    .enum(["available", "pending", "adopted"])
    .default("available"),
});

export const updatePostSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["dog", "cat", "other"]).optional(),
  age: z.coerce.number().min(0).optional(),
  gender: z.enum(["male", "female"]).optional(),
  description: z.string().min(10).optional(),
  location: z.string().min(1).optional(),
  imagePaths: z.array(z.string().min(1)).min(1).optional(),
  size: z.enum(["small", "medium", "large"]).optional(),
  vaccinated: z.boolean().optional(),
  neutered: z.boolean().optional(),
  goodWithKids: z.boolean().optional(),
  goodWithOtherAnimals: z.boolean().optional(),
  adoptionStatus: z.enum(["available", "pending", "adopted"]).optional(),
});
