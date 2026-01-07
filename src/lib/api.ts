const BASE_URL = import.meta.env.VITE_API_URL ?? "https://api.example.com/api/v1";

export interface ApiErrorShape {
  success?: boolean;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: Record<string, unknown>;

  constructor(message: string, status: number, code?: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    let body: ApiErrorShape | undefined;
    if (isJson) {
      try {
        body = (await res.json()) as ApiErrorShape;
      } catch {
        // ignore parse error
      }
    }
    const message =
      body?.error?.message ||
      `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status, body?.error?.code, body?.error?.details);
  }

  if (!isJson) {
    // @ts-expect-error - caller should know it's not JSON
    return res as unknown as T;
  }

  return (await res.json()) as T;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions extends RequestInit {
  authToken?: string;
}

async function request<T>(path: string, method: HttpMethod, options: RequestOptions = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;

  const headers: HeadersInit = {
    ...(options.headers ?? {}),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
  }

  if (options.authToken) {
    headers["Authorization"] = `Bearer ${options.authToken}`;
  }

  const res = await fetch(url, {
    method,
    ...options,
    headers,
  });

  return handleResponse<T>(res);
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, "GET", options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, "POST", {
      ...options,
      body: body instanceof FormData ? body : body != null ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, "PUT", {
      ...options,
      body: body instanceof FormData ? body : body != null ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, "DELETE", options),
};


