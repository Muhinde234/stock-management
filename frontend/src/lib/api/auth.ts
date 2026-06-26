import { api, setToken, removeToken } from "./client";

export interface LoginPayload {
  email: string;
  password: string;
}

// Shape returned by the backend
export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export const authApi = {
  login(payload: LoginPayload) {
    return api.post<AuthResponse>("/auth/login", payload);
  },

  logout() {
    removeToken();
  },

  async loginAndStore(payload: LoginPayload): Promise<AuthResponse> {
    const res = await authApi.login(payload);
    setToken(res.access_token);
    return res;
  },
};
