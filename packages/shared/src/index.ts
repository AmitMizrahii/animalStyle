export interface User {
  _id: string;
  username: string;
  email: string;
  profileImagePath?: string;
}

export interface UserWithToken extends User {
  token: string;
  refreshToken: string;
}
