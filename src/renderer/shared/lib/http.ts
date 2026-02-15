const BASE_URL = '';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number>;
}

const fetcher = async <T>(url: string, options: RequestOptions = {}): Promise<T> => {
  const { params, headers, ...customOptions } = options;

  const queryString = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';

  const fullUrl = url.startsWith('http') ? `${url}${queryString}` : `${BASE_URL}${url}${queryString}`;

  const response = await fetch(fullUrl, {
    ...customOptions,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });

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
