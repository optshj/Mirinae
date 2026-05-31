let authToken: string | null = null;

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number>;
}

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

const executeRequest = async (url: string, queryString: string, customOptions: RequestInit, headers: HeadersInit | undefined): Promise<Response> => {
  const authHeaders: Record<string, string> = authToken ? { Authorization: `Bearer ${authToken}` } : {};

  return fetch(`${url}${queryString}`, {
    ...customOptions,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...headers
    }
  });
};

const fetcher = async <T>(url: string, options: RequestOptions = {}): Promise<T> => {
  const { params, headers, ...customOptions } = options;

  const queryString = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';

  let response = await executeRequest(url, queryString, customOptions, headers);

  if (response.status === 401) {
    try {
      const newTokens = await window.api.refreshToken?.();
      if (newTokens?.access_token) {
        setAuthToken(newTokens.access_token);
        response = await executeRequest(url, queryString, customOptions, headers);
      } else {
        setAuthToken(null);
        window.dispatchEvent(new CustomEvent('auth-expired'));
      }
    } catch {
      setAuthToken(null);
      window.dispatchEvent(new CustomEvent('auth-expired'));
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `HTTP 에러 발생: ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
};

export const http = {
  get: <T>(url: string, options?: RequestOptions) => fetcher<T>(url, { ...options, method: 'GET' }),
  post: <T>(url: string, body: unknown, options?: RequestOptions) => fetcher<T>(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(url: string, body: unknown, options?: RequestOptions) => fetcher<T>(url, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  put: <T>(url: string, body: unknown, options?: RequestOptions) => fetcher<T>(url, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(url: string, options?: RequestOptions) => fetcher<T>(url, { ...options, method: 'DELETE' })
};
