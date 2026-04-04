import { IUser, AnimalPost, Comment, User } from "../types";

function toPublicUser(user: IUser): User {
  return {
    _id: user._id!,
    username: user.username,
    email: user.email,
    profileImagePath: user.profileImagePath,
  };
}

export type PopulatedPost = {
  _id: { toString(): string };
  name: string;
  type: "dog" | "cat" | "other";
  age: number;
  gender: "male" | "female";
  description: string;
  location: string;
  imagePaths: string[];
  createdBy: IUser;
  likes: Array<{ toString(): string } | string>;
  commentsCount: number;
  createdAt?: Date;
  vaccinated: boolean;
  neutered: boolean;
  goodWithKids: boolean;
  goodWithOtherAnimals: boolean;
  adoptionStatus: "available" | "pending" | "adopted";
};

export type PopulatedComment = {
  _id: { toString(): string };
  postId: { toString(): string };
  userId: IUser;
  content: string;
  createdAt?: Date;
};

export function buildCommentResponse(comment: PopulatedComment): Comment {
  return {
    _id: comment._id.toString(),
    postId: comment.postId.toString(),
    userId: toPublicUser(comment.userId),
    content: comment.content,
    createdAt: comment.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

export function buildPostResponse(
  post: PopulatedPost,
  userId?: string,
): AnimalPost {
  return {
    _id: post._id.toString(),
    name: post.name,
    type: post.type,
    age: post.age,
    gender: post.gender,
    description: post.description,
    location: post.location,
    vaccinated: post.vaccinated,
    neutered: post.neutered,
    goodWithKids: post.goodWithKids,
    goodWithOtherAnimals: post.goodWithOtherAnimals,
    adoptionStatus: post.adoptionStatus,
    imagePaths: post.imagePaths,
    createdBy: toPublicUser(post.createdBy),
    likes: post.likes.map((id) => id.toString()),
    commentsCount: post.commentsCount,
    createdAt: post.createdAt?.toISOString() ?? new Date().toISOString(),
    isLiked: userId ? post.likes.some((id) => id.toString() === userId) : false,
  };
}
