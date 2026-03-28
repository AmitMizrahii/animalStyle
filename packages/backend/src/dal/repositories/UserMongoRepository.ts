import { User, IUserDocument } from "../../models/User";
import { IUser } from "../../types";
import { IUserRepository, CreateUserData } from "../interfaces/IUserRepository";

function toUser(doc: IUserDocument): IUser {
  return {
    _id: doc._id.toString(),
    username: doc.username,
    email: doc.email,
    password: doc.password ?? "",
    profileImagePath: doc.profileImagePath ?? undefined,
    refreshToken: doc.refreshToken,
    createdAt: doc.createdAt,
  };
}

export class UserMongoRepository implements IUserRepository {
  async findByEmailOrUsername(
    email: string,
    username: string,
  ): Promise<IUser | null> {
    const doc = await User.findOne({ $or: [{ email }, { username }] });
    return doc ? toUser(doc) : null;
  }

  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    const doc = await User.findOne({ email }).select("+password");
    return doc ? toUser(doc) : null;
  }

  async findById(id: string): Promise<IUser | null> {
    const doc = await User.findById(id);
    return doc ? toUser(doc) : null;
  }

  async findByIdWithRefreshToken(id: string): Promise<IUser | null> {
    const doc = await User.findById(id).select("+refreshToken");
    return doc ? toUser(doc) : null;
  }

  async create(data: CreateUserData): Promise<IUser> {
    const doc = new User(data);
    await doc.save();
    return toUser(doc);
  }

  async updateRefreshToken(
    id: string,
    token: string | undefined,
  ): Promise<void> {
    await User.findByIdAndUpdate(id, { refreshToken: token ?? null });
  }

  async isUsernameTakenByOther(
    username: string,
    excludeUserId: string,
  ): Promise<boolean> {
    const doc = await User.findOne({ username, _id: { $ne: excludeUserId } });
    return doc !== null;
  }
}
