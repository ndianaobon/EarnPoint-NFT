export type User = {
  id: string;
  username: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  referralCode: string;
  twoFactorEnabled: boolean;
  role: string;
  createdAt: string;
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

const UNAVAILABLE = "We can't reach the server right now. Please try again in a moment.";

export async function api<T = unknown>(path: string, method = "GET", body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "NETWORK", UNAVAILABLE);
  }

  const data = await response.json().catch(() => null);
  if (response.ok) return data as T;
  if (response.status === 429) {
    throw new ApiError(429, "RATE_LIMITED", "Too many attempts. Please wait a minute and try again.");
  }
  if (response.status >= 500 || !data?.message) {
    throw new ApiError(response.status, "UNAVAILABLE", UNAVAILABLE);
  }
  throw new ApiError(response.status, data.code, data.message, data.fields);
}

export const errorMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : UNAVAILABLE;
