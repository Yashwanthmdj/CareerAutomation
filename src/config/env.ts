function getEnv(key: string): string | undefined {
  return (import.meta as any).env?.[key] as string | undefined;
}

export const ENV = {
  apiBaseUrl: getEnv("VITE_API_BASE_URL") ?? "http://localhost:8000",
  appEnv: getEnv("VITE_APP_ENV") ?? "development",
} as const;

