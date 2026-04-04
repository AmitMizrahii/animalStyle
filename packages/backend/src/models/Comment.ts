import mongoose, { Schema, Document } from "mongoose";
import { IComment } from "../types";

type ICommentDocument = IComment & Document;

const commentSchema = new Schema(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: "AnimalPost",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: [true, "Comment content is required"],
      minlength: [1, "Comment cannot be empty"],
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
  },
  { timestamps: true },
);

commentSchema.index({ postId: 1 });
commentSchema.index({ userId: 1 });
commentSchema.index({ postId: 1, createdAt: -1 });

export const Comment = mongoose.model<ICommentDocument>(
  "Comment",
  commentSchema,
);
