import { z } from "zod";
import { AnimalPost } from ".";

export const searchRequestSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export interface SearchQuery extends Partial<AnimalPost> {
  size?: "small" | "medium" | "large";
  location?: string;
  gender?: "male" | "female";
  vaccinated?: boolean;
  neutered?: boolean;
  goodWithKids?: boolean;
  goodWithOtherAnimals?: boolean;
  adoptionStatus?: "available" | "pending" | "adopted";
  ageMin?: number;
  ageMax?: number;
}
