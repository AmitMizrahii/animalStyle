import { AnimalPost } from "../../models/AnimalPost";
import { IUserDocument } from "../../models/User";
import { PostWithAuthor, IUser } from "../../types";
import {
  IAnimalPostRepository,
  CreatePostData,
  UpdatePostData,
  PostQueryOptions,
  PostSearchFilters,
} from "../interfaces/IAnimalPostRepository";
import { ICommentRepository } from "../interfaces/ICommentRepository";

type PopulatedPostDoc = {
  _id: { toString(): string };
  name: string;
  type: "dog" | "cat" | "other";
  age: number;
  gender: "male" | "female";
  description: string;
  location: string;
  imagePaths: string[];
  createdBy: IUserDocument;
  likes: Array<{ toString(): string }>;
  createdAt?: Date;
  size: "small" | "medium" | "large";
  vaccinated: boolean;
  neutered: boolean;
  goodWithKids: boolean;
  goodWithOtherAnimals: boolean;
  adoptionStatus: "available" | "pending" | "adopted";
};

function toPostWithAuthor(
  doc: PopulatedPostDoc,
  commentsCount: number,
): PostWithAuthor {
  const author = doc.createdBy;

  const createdBy = {
    _id: author._id.toString(),
    username: author.username,
    email: author.email,
    profileImagePath: author.profileImagePath ?? undefined,
  } as IUser;

  return {
    _id: doc._id.toString(),
    name: doc.name,
    type: doc.type,
    age: doc.age,
    gender: doc.gender,
    description: doc.description,
    location: doc.location,
    imagePaths: doc.imagePaths,
    createdBy,
    likes: doc.likes.map((id) => id.toString()),
    commentsCount,
    createdAt: doc.createdAt,
    size: doc.size,
    vaccinated: doc.vaccinated ?? false,
    neutered: doc.neutered ?? false,
    goodWithKids: doc.goodWithKids ?? false,
    goodWithOtherAnimals: doc.goodWithOtherAnimals ?? false,
    adoptionStatus: doc.adoptionStatus,
  };
}

export class AnimalPostMongoRepository implements IAnimalPostRepository {
  constructor(private readonly commentRepo: ICommentRepository) {}

  async create(data: CreatePostData): Promise<PostWithAuthor> {
    const doc = new AnimalPost({ ...data, likes: [] });
    await doc.save();
    const populated: PopulatedPostDoc = await doc.populate<{
      createdBy: IUserDocument;
    }>("createdBy");
    return toPostWithAuthor(populated, 0);
  }

  async findAll(
    opts: PostQueryOptions,
  ): Promise<{ posts: PostWithAuthor[]; total: number }> {
    const skip = (opts.page - 1) * opts.limit;
    const [docs, total]: [PopulatedPostDoc[], number] = await Promise.all([
      AnimalPost.find()
        .populate<{ createdBy: IUserDocument }>("createdBy")
        .skip(skip)
        .limit(opts.limit)
        .sort({ createdAt: -1 }),
      AnimalPost.countDocuments(),
    ]);

    const countMap = await this.commentRepo.countByPostIds(
      docs.map((d) => d._id.toString()),
    );

    return {
      posts: docs.map((doc) =>
        toPostWithAuthor(doc, countMap.get(doc._id.toString()) ?? 0),
      ),
      total,
    };
  }

  async findById(id: string): Promise<PostWithAuthor | null> {
    const [doc, commentsCount]: [PopulatedPostDoc | null, number] =
      await Promise.all([
        AnimalPost.findById(id).populate<{ createdBy: IUserDocument }>(
          "createdBy",
        ),
        this.commentRepo.countByPostId(id),
      ]);

    if (!doc) return null;

    return toPostWithAuthor(doc, commentsCount);
  }

  async findByUserId(
    userId: string,
    opts: PostQueryOptions,
  ): Promise<{ posts: PostWithAuthor[]; total: number }> {
    const skip = (opts.page - 1) * opts.limit;
    const filter = { createdBy: userId };
    const [docs, total]: [PopulatedPostDoc[], number] = await Promise.all([
      AnimalPost.find(filter)
        .populate<{ createdBy: IUserDocument }>("createdBy")
        .skip(skip)
        .limit(opts.limit)
        .sort({ createdAt: -1 }),
      AnimalPost.countDocuments(filter),
    ]);

    const countMap = await this.commentRepo.countByPostIds(
      docs.map((d) => d._id.toString()),
    );

    return {
      posts: docs.map((doc) =>
        toPostWithAuthor(doc, countMap.get(doc._id.toString()) ?? 0),
      ),
      total,
    };
  }

  async update(
    id: string,
    data: UpdatePostData,
  ): Promise<PostWithAuthor | null> {
    const doc = await AnimalPost.findById(id);
    if (!doc) return null;

    if (data.name !== undefined) doc.name = data.name;
    if (data.type !== undefined) doc.type = data.type;
    if (data.age !== undefined) doc.age = data.age;
    if (data.gender !== undefined) doc.gender = data.gender;
    if (data.description !== undefined) doc.description = data.description;
    if (data.location !== undefined) doc.location = data.location;
    if (data.imagePaths !== undefined) doc.imagePaths = data.imagePaths;
    if (data.size !== undefined) doc.size = data.size;
    if (data.vaccinated !== undefined) doc.vaccinated = data.vaccinated;
    if (data.neutered !== undefined) doc.neutered = data.neutered;
    if (data.goodWithKids !== undefined) doc.goodWithKids = data.goodWithKids;
    if (data.goodWithOtherAnimals !== undefined)
      doc.goodWithOtherAnimals = data.goodWithOtherAnimals;
    if (data.adoptionStatus !== undefined)
      doc.adoptionStatus = data.adoptionStatus;

    await doc.save();
    const [populated, commentsCount]: [PopulatedPostDoc, number] =
      await Promise.all([
        doc.populate<{ createdBy: IUserDocument }>("createdBy"),
        this.commentRepo.countByPostId(id),
      ]);
    return toPostWithAuthor(populated, commentsCount);
  }

  async delete(id: string): Promise<void> {
    await AnimalPost.findByIdAndDelete(id);
  }

  async toggleLike(
    postId: string,
    userId: string,
  ): Promise<{ isLiked: boolean; likesCount: number }> {
    const doc = await AnimalPost.findById(postId);
    if (!doc) {
      throw new Error("Post not found");
    }

    const hasLiked = doc.likes.some((id) => id.toString() === userId);
    if (hasLiked) {
      doc.likes = doc.likes.filter((id) => id.toString() !== userId);
    } else {
      doc.likes.push(userId);
    }

    await doc.save();
    return { isLiked: !hasLiked, likesCount: doc.likes.length };
  }

  async findLikedByUser(
    userId: string,
    opts: PostQueryOptions,
  ): Promise<{ posts: PostWithAuthor[]; total: number }> {
    const skip = (opts.page - 1) * opts.limit;
    const filter = { likes: userId };
    const [docs, total]: [PopulatedPostDoc[], number] = await Promise.all([
      AnimalPost.find(filter)
        .populate<{ createdBy: IUserDocument }>("createdBy")
        .skip(skip)
        .limit(opts.limit)
        .sort({ createdAt: -1 }),
      AnimalPost.countDocuments(filter),
    ]);

    const countMap = await this.commentRepo.countByPostIds(
      docs.map((d) => d._id.toString()),
    );

    return {
      posts: docs.map((doc) =>
        toPostWithAuthor(doc, countMap.get(doc._id.toString()) ?? 0),
      ),
      total,
    };
  }

  async search(
    filters: PostSearchFilters,
    opts: PostQueryOptions,
  ): Promise<{ posts: PostWithAuthor[]; total: number }> {
    const mongoQuery: Record<string, unknown> = {};

    if (filters.type) mongoQuery.type = filters.type;
    if (filters.location) {
      mongoQuery.location = { $regex: filters.location, $options: "i" };
    }
    if (filters.gender) mongoQuery.gender = filters.gender;
    if (filters.size) mongoQuery.size = filters.size;
    if (filters.vaccinated !== undefined)
      mongoQuery.vaccinated = filters.vaccinated;
    if (filters.neutered !== undefined) mongoQuery.neutered = filters.neutered;
    if (filters.goodWithKids !== undefined)
      mongoQuery.goodWithKids = filters.goodWithKids;
    if (filters.goodWithOtherAnimals !== undefined)
      mongoQuery.goodWithOtherAnimals = filters.goodWithOtherAnimals;
    if (filters.adoptionStatus)
      mongoQuery.adoptionStatus = filters.adoptionStatus;

    if (filters.ageMin !== undefined || filters.ageMax !== undefined) {
      const ageFilter: Record<string, number> = {};
      if (filters.ageMin !== undefined) ageFilter.$gte = filters.ageMin;
      if (filters.ageMax !== undefined) ageFilter.$lte = filters.ageMax;
      mongoQuery.age = ageFilter;
    }

    const skip = (opts.page - 1) * opts.limit;
    const [docs, total]: [PopulatedPostDoc[], number] = await Promise.all([
      AnimalPost.find(mongoQuery)
        .populate<{ createdBy: IUserDocument }>("createdBy")
        .skip(skip)
        .limit(opts.limit)
        .sort({ createdAt: -1 }),
      AnimalPost.countDocuments(mongoQuery),
    ]);

    const countMap = await this.commentRepo.countByPostIds(
      docs.map((d) => d._id.toString()),
    );

    return {
      posts: docs.map((doc) =>
        toPostWithAuthor(doc, countMap.get(doc._id.toString()) ?? 0),
      ),
      total,
    };
  }
}
