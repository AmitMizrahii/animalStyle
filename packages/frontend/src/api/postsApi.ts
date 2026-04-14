import { AnimalPost, CreatePostSchema } from "shared";
import apiClient from "./apiClient";

export const postsAPI = {
  createPost: (data: CreatePostSchema) =>
    apiClient.post<AnimalPost>("/posts", data),
};
