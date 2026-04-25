import { z } from "zod";
import { AnimalPost, PaginatedResponse } from "shared";
import apiClient from "./apiClient";

export const searchAPI = {
  search: async (
    query: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<typeof AnimalPost>> => {
    const res = await apiClient.post<PaginatedResponse<typeof AnimalPost>>(
      "/search",
      {
        query,
        page,
        limit,
      },
    );

    return z.object({ data: PaginatedResponse(AnimalPost) }).parse(res.data).data;
  },
};
