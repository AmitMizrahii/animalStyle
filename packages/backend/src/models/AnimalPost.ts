import mongoose, { Schema, Document } from "mongoose";
import { IAnimalPost } from "../types";

type IAnimalPostDocument = IAnimalPost & Document;

const animalPostSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Animal name is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["dog", "cat", "other"],
      required: [true, "Animal type is required"],
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [0, "Age cannot be negative"],
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: [true, "Gender is required"],
    },
    size: {
      type: String,
      enum: ["small", "medium", "large"],
    },
    vaccinated: { type: Boolean, default: false },
    neutered: { type: Boolean, default: false },
    goodWithKids: { type: Boolean, default: false },
    goodWithOtherAnimals: { type: Boolean, default: false },
    adoptionStatus: {
      type: String,
      enum: ["available", "pending", "adopted"],
      default: "available",
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      minlength: [10, "Description must be at least 10 characters"],
    },
    location: {
      type: String,
      required: [true, "Location is required"],
    },
    imagePaths: {
      type: [String],
      required: [true, "At least one image is required"],
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: "At least one image is required",
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
);

animalPostSchema.index({ createdBy: 1 });
animalPostSchema.index({ type: 1 });
animalPostSchema.index({ location: 1 });
animalPostSchema.index({ createdAt: -1 });
animalPostSchema.index({ size: 1 });
animalPostSchema.index({ adoptionStatus: 1 });

export const AnimalPost = mongoose.model<IAnimalPostDocument>(
  "AnimalPost",
  animalPostSchema,
);
