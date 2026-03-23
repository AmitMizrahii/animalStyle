export type { User, UserWithToken } from "shared";

export interface IUser {
  _id?: string;
  username: string;
  email: string;
  password: string;
  profileImagePath?: string;
  refreshToken?: string;
  createdAt?: Date;
}
