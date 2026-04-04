import mongoose from "mongoose";
import { Comment } from "../../models/Comment";
import { IUserDocument } from "../../models/User";
import { IComment, CommentWithUser, IUser } from "../../types";
import {
  ICommentRepository,
  CreateCommentData,
  CommentQueryOptions,
} from "../interfaces/ICommentRepository";

type PopulatedCommentDoc = {
  _id: { toString(): string };
  postId: { toString(): string };
  userId: IUserDocument;
  content: string;
  createdAt?: Date;
};

function toCommentWithUser(doc: PopulatedCommentDoc): CommentWithUser {
  const author = doc.userId;
  const userId = {
    _id: author._id.toString(),
    username: author.username,
    email: author.email,
    profileImagePath: author.profileImagePath ?? undefined,
  } as IUser;

  return {
    _id: doc._id.toString(),
    postId: doc.postId.toString(),
    userId,
    content: doc.content,
    createdAt: doc.createdAt,
  };
}

export class CommentMongoRepository implements ICommentRepository {
  async findByPostId(
    postId: string,
    opts: CommentQueryOptions,
  ): Promise<{ comments: CommentWithUser[]; total: number }> {
    const skip = (opts.page - 1) * opts.limit;
    const filter = { postId };
    const [docs, total]: [PopulatedCommentDoc[], number] = await Promise.all([
      Comment.find(filter)
        .populate<{ userId: IUserDocument }>("userId")
        .skip(skip)
        .limit(opts.limit)
        .sort({ createdAt: -1 }),
      Comment.countDocuments(filter),
    ]);

    return {
      comments: docs.map(toCommentWithUser),
      total,
    };
  }

  async findById(id: string): Promise<IComment | null> {
    const doc = await Comment.findById(id);

    if (!doc) return null;

    return {
      _id: doc._id.toString(),
      postId: doc.postId.toString(),
      userId: doc.userId.toString(),
      content: doc.content,
      createdAt: doc.createdAt,
    };
  }

  async create(data: CreateCommentData): Promise<CommentWithUser> {
    const doc = new Comment(data);
    await doc.save();
    const populated: PopulatedCommentDoc = await doc.populate<{
      userId: IUserDocument;
    }>("userId");

    return toCommentWithUser(populated);
  }

  async delete(id: string): Promise<void> {
    await Comment.findByIdAndDelete(id);
  }

  async deleteByPostId(postId: string): Promise<void> {
    await Comment.deleteMany({ postId });
  }

  async countByPostId(postId: string): Promise<number> {
    return Comment.countDocuments({ postId });
  }

  async countByPostIds(postIds: string[]): Promise<Map<string, number>> {
    const objectIds = postIds.map((id) => new mongoose.Types.ObjectId(id));
    const counts = await Comment.aggregate([
      { $match: { postId: { $in: objectIds } } },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
    ]);

    return new Map(counts.map((c) => [c._id.toString(), c.count]));
  }
}
