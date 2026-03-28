export type { User, UserWithToken, ApiError } from "shared";

export interface IUser {
  _id?: string;
  username: string;
  email: string;
  password: string;
  profileImagePath?: string;
  refreshToken?: string;
  createdAt?: Date;
}

export interface IUserResponse extends Omit<
  IUser,
  "password" | "refreshToken"
> {
  token: string;
  refreshToken: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
  jti: string;
}
export interface IAnimalPost {
  _id?: string;
  name: string;
  type: "dog" | "cat" | "other";
  age: number;
  gender: "male" | "female";
  description: string;
  location: string;
  imagePaths: string[];
  createdBy: string;
  likes: string[];
  commentsCount: number;
  createdAt?: Date;
  size: "small" | "medium" | "large";
  vaccinated: boolean;
  neutered: boolean;
  goodWithKids: boolean;
  goodWithOtherAnimals: boolean;
  adoptionStatus: "available" | "pending" | "adopted";
}

export type PostWithAuthor = Omit<IAnimalPost, "createdBy"> & {
  _id: string;
  createdBy: IUser;
};

export interface IComment {
  _id?: string;
  postId: string;
  userId: string;
  content: string;
  createdAt?: Date;
}

export type CommentWithUser = Omit<IComment, "userId"> & {
  _id: string;
  userId: IUser;
};
