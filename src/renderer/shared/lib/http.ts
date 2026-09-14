interface RequestOptions {
  params?: Record<string, string | number>;
  method?: string;
  body?: string;
}

const fetcher = async <T>(url: string, options: RequestOptions = {}): Promise<T> => {
  const { params, ...init } = options;

  const queryString = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';

  const { status, body } = await window.api.googleRequest(`${url}${queryString}`, init);

  if (status < 200 || status >= 300) {
    throw new Error((body as { message?: string } | null)?.message || `HTTP 에러 발생: ${status}`);
  }

  return (body ?? {}) as T;
};

export const http = {
  get: <T>(url: string, options?: RequestOptions) => fetcher<T>(url, { ...options, method: 'GET' }),
  post: <T>(url: string, body: unknown, options?: RequestOptions) => fetcher<T>(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(url: string, body: unknown, options?: RequestOptions) => fetcher<T>(url, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  put: <T>(url: string, body: unknown, options?: RequestOptions) => fetcher<T>(url, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(url: string, options?: RequestOptions) => fetcher<T>(url, { ...options, method: 'DELETE' })
};
