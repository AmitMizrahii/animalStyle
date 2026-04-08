import { IUser } from "../../types";

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  profileImagePath?: string;
}

export interface UpdateProfileData {
  username?: string;
  profileImagePath?: string;
}

export interface IUserRepository {
  findByEmailOrUsername(email: string, username: string): Promise<IUser | null>;

  findByEmailWithPassword(email: string): Promise<IUser | null>;

  findById(id: string): Promise<IUser | null>;

  findByIdWithRefreshToken(id: string): Promise<IUser | null>;

  create(data: CreateUserData): Promise<IUser>;

  updateRefreshToken(id: string, token: string | undefined): Promise<void>;

  isUsernameTakenByOther(
    username: string,
    excludeUserId: string,
  ): Promise<boolean>;

  updateProfile(id: string, data: UpdateProfileData): Promise<IUser | null>;
}
