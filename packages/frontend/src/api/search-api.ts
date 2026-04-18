import { AnimalPost, PaginatedResponse } from "shared";
import apiClient from "./apiClient";

export const searchAPI = {
  search: (query: string, page: number = 1, limit: number = 10) =>
    apiClient.post<PaginatedResponse<AnimalPost>>("/search", {
      query,
      page,
      limit,
    }),
};
