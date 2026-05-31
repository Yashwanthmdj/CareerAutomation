import type { Session, SignInInput, SignUpInput } from "@/types/auth";
import type { User } from "@/types/user";
import { apiClient, setStoredAccessToken } from "@/services/api/client";

type AuthApiResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

export const authService = {
  async signIn(input: SignInInput): Promise<Session> {
    const data = await apiClient.post<AuthApiResponse>("/auth/login", input);
    setStoredAccessToken(data.access_token);
    return {
      accessToken: data.access_token,
      user: data.user,
    };
  },

  async signUp(input: SignUpInput): Promise<Session> {
    const data = await apiClient.post<AuthApiResponse>("/auth/signup", input);
    setStoredAccessToken(data.access_token);
    return {
      accessToken: data.access_token,
      user: data.user,
    };
  },

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>("/auth/me");
  },

  async signOut(): Promise<void> {
    setStoredAccessToken(null);
  },
};

