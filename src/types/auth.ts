import type { User } from "./user";

export type Session = {
  accessToken: string;
  user: User;
};

export type SignInInput = {
  email: string;
  password: string;
};

export type SignUpInput = {
  name: string;
  email: string;
  password: string;
};

