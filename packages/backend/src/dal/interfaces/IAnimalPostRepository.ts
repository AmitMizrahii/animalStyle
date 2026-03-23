import { PostWithAuthor } from "../../types";

export interface CreatePostData {
  name: string;
  type: "dog" | "cat" | "other";
  age: number;
  gender: "male" | "female";
  description: string;
  location: string;
  imagePaths: string[];
  createdBy: string;
  size?: "small" | "medium" | "large";
  vaccinated?: boolean;
  neutered?: boolean;
  goodWithKids?: boolean;
  goodWithOtherAnimals?: boolean;
  adoptionStatus?: "available" | "pending" | "adopted";
}

export interface UpdatePostData {
  name?: string;
  type?: "dog" | "cat" | "other";
  age?: number;
  gender?: "male" | "female";
  description?: string;
  location?: string;
  imagePaths?: string[];
  size?: "small" | "medium" | "large";
  vaccinated?: boolean;
  neutered?: boolean;
  goodWithKids?: boolean;
  goodWithOtherAnimals?: boolean;
  adoptionStatus?: "available" | "pending" | "adopted";
}

export interface PostQueryOptions {
  page: number;
  limit: number;
}

export interface PostSearchFilters {
  type?: string;
  location?: string;
  gender?: "male" | "female";
  ageMin?: number;
  ageMax?: number;
  size?: "small" | "medium" | "large";
  vaccinated?: boolean;
  neutered?: boolean;
  goodWithKids?: boolean;
  goodWithOtherAnimals?: boolean;
  adoptionStatus?: "available" | "pending" | "adopted";
}

export interface IAnimalPostRepository {
  create(data: CreatePostData): Promise<PostWithAuthor>;

  findAll(
    opts: PostQueryOptions,
  ): Promise<{ posts: PostWithAuthor[]; total: number }>;

  findById(id: string): Promise<PostWithAuthor | null>;

  findByUserId(
    userId: string,
    opts: PostQueryOptions,
  ): Promise<{ posts: PostWithAuthor[]; total: number }>;

  findLikedByUser(
    userId: string,
    opts: PostQueryOptions,
  ): Promise<{ posts: PostWithAuthor[]; total: number }>;

  update(id: string, data: UpdatePostData): Promise<PostWithAuthor | null>;

  delete(id: string): Promise<void>;

  toggleLike(
    postId: string,
    userId: string,
  ): Promise<{ isLiked: boolean; likesCount: number }>;

  search(
    filters: PostSearchFilters,
    opts: PostQueryOptions,
  ): Promise<{ posts: PostWithAuthor[]; total: number }>;
}
