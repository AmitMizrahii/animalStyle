export * from "./post-api";
export * from "./user-api";
export * from "./auth-api";
export * from "./search-api";

export interface User {
  _id: string;
  username: string;
  email: string;
  profileImagePath?: string;
}

export interface UserWithToken extends User {
  token: string;
  refreshToken: string;
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
}

export interface Comment {
  _id: string;
  postId: string;
  userId: User;
  content: string;
  createdAt: string;
}

export interface AnimalPost {
  _id: string;
  name: string;
  type: "dog" | "cat" | "other";
  age: number;
  gender: "male" | "female";
  description: string;
  location: string;
  imagePaths: string[];
  createdBy: User;
  likes: string[];
  commentsCount: number;
  createdAt: string;
  isLiked?: boolean;
  size?: "small" | "medium" | "large";
  vaccinated?: boolean;
  neutered?: boolean;
  goodWithKids?: boolean;
  goodWithOtherAnimals?: boolean;
  adoptionStatus?: "available" | "pending" | "adopted";
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}
