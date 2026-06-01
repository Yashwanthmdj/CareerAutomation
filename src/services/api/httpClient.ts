export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

export class ApiRequestError extends Error {
  status: number;
  details?: unknown;

  constructor(input: ApiError) {
    super(input.message);
    this.name = "ApiRequestError";
    this.status = input.status;
    this.details = input.details;
  }
}

export type ApiClientOptions = {
  baseUrl: string;
  getAccessToken?: () => string | null;
};

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

export class ApiClient {
  constructor(private readonly opts: ApiClientOptions) {}

  async request<TResponse>(
    path: string,
    init: {
      method: HttpMethod;
      query?: QueryParams;
      body?: unknown;
      headers?: Record<string, string>;
      signal?: AbortSignal;
    },
  ): Promise<TResponse> {
    const url = new URL(path, this.opts.baseUrl);
    if (init.query) {
      for (const [k, v] of Object.entries(init.query)) {
        if (v === undefined || v === null) continue;
        url.searchParams.set(k, String(v));
      }
    }

    const headers: Record<string, string> = {
      ...(init.body !== undefined ? { "content-type": "application/json" } : {}),
      ...init.headers,
    };

    const token = this.opts.getAccessToken?.();
    if (token) headers.authorization = `Bearer ${token}`;

    const res = await fetch(url.toString(), {
      method: init.method,
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: init.signal,
    });

    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");

    if (!res.ok) {
      const message = extractErrorMessage(payload, res.statusText);
      const err: ApiError = { status: res.status, message, details: payload };
      throw new ApiRequestError(err);
    }

    return payload as TResponse;
  }

  get<T>(path: string, query?: QueryParams) {
    return this.request<T>(path, { method: "GET", query });
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: "POST", body });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: "PATCH", body });
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: "DELETE" });
  }

  async upload<T>(path: string, formData: FormData, signal?: AbortSignal): Promise<T> {
    const url = new URL(path, this.opts.baseUrl);
    const headers: Record<string, string> = {};
    const token = this.opts.getAccessToken?.();
    if (token) headers.authorization = `Bearer ${token}`;

    const res = await fetch(url.toString(), {
      method: "POST",
      headers,
      body: formData,
      signal,
    });

    const contentType = res.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");

    if (!res.ok) {
      const message = extractErrorMessage(payload, res.statusText);
      throw new ApiRequestError({ status: res.status, message, details: payload });
    }

    return payload as T;
  }

  async downloadBlob(path: string, signal?: AbortSignal): Promise<Blob> {
    const url = new URL(path, this.opts.baseUrl);
    const headers: Record<string, string> = {};
    const token = this.opts.getAccessToken?.();
    if (token) headers.authorization = `Bearer ${token}`;

    const res = await fetch(url.toString(), { method: "GET", headers, signal });
    if (!res.ok) {
      const contentType = res.headers.get("content-type") ?? "";
      const isJson = contentType.includes("application/json");
      const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");
      const message = extractErrorMessage(payload, res.statusText);
      throw new ApiRequestError({ status: res.status, message, details: payload });
    }
    return res.blob();
  }
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "object" && payload !== null) {
    if ("detail" in payload) {
      const detail = (payload as { detail: unknown }).detail;
      if (typeof detail === "string") return detail;
      if (Array.isArray(detail)) {
        return detail
          .map((item) => (typeof item === "object" && item && "msg" in item ? String(item.msg) : String(item)))
          .join(", ");
      }
    }
    if ("message" in payload) return String((payload as { message: unknown }).message);
  }
  return fallback || "Request failed";
}

