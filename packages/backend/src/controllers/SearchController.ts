import { Response } from "express";
import { IAnimalPostRepository } from "../dal/interfaces/IAnimalPostRepository";
import { AuthRequest } from "../middleware/authMiddleware";
import { AnimalPost, PaginatedResponse, searchRequestSchema } from "../types";
import { parseSearchQuery } from "../utils/aiHelper";
import { sendError, sendSuccess } from "../utils/errorHandler";
import { buildPostResponse } from "../utils/postUtils";
import { parseOrThrow } from "../utils/validation";

export class SearchController {
  constructor(private readonly postRepo: IAnimalPostRepository) {}

  async search(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { query, page, limit } = parseOrThrow(
        searchRequestSchema,
        req.body,
      );

      const filters = await parseSearchQuery(query);

      const { posts, total } = await this.postRepo.search(
        {
          type: filters.type,
          location: filters.location,
          gender: filters.gender,
          size: filters.size,
          vaccinated: filters.vaccinated,
          neutered: filters.neutered,
          goodWithKids: filters.goodWithKids ?? filters.friendly,
          goodWithOtherAnimals: filters.goodWithOtherAnimals,
          adoptionStatus: filters.adoptionStatus,
          ageMin: filters.ageMin,
          ageMax: filters.ageMax,
        },
        { page, limit },
      );

      const response: PaginatedResponse<AnimalPost> = {
        data: posts.map((post) => buildPostResponse(post, req.userId)),
        page,
        limit,
        total,
        hasMore: (page - 1) * limit + posts.length < total,
      };

      sendSuccess(res, response);
    } catch (error) {
      sendError(res, error);
    }
  }
}
