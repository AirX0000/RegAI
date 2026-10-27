import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const isMockFallbackEnabled = import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true' || import.meta.env.DEV;

async function getMockResponse(config: any): Promise<any> {
    if (!isMockFallbackEnabled) {
        throw new Error('Backend is unreachable and mock fallback is disabled in production.');
    }
    const { handleMockApiRequest } = await import('./mockApi');
    return handleMockApiRequest(config);
}

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api/v1',
    timeout: 45000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else if (token) {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    async (response) => {
        const isHtml =
            typeof response.data === 'string' &&
            (response.data.trim().toLowerCase().startsWith('<!doctype html') || response.data.includes('<html'));

        if (isHtml) {
            const config = response.config as any;
            const currentBase = config.baseURL || api.defaults.baseURL || '';

            // Auto port-swap fallback (8000 <-> 8001) in case of port collisions:
            if (!config._portSwapped && (currentBase.includes(':8000') || currentBase.includes(':8001'))) {
                config._portSwapped = true;
                const altBase = currentBase.includes(':8000')
                    ? currentBase.replace(':8000', ':8001')
                    : currentBase.replace(':8001', ':8000');
                try {
                    const altRes = await axios({ ...config, baseURL: altBase });
                    const altIsHtml =
                        typeof altRes.data === 'string' &&
                        (altRes.data.trim().toLowerCase().startsWith('<!doctype html') || altRes.data.includes('<html'));
                    if (!altIsHtml) {
                        api.defaults.baseURL = altBase;
                        console.info('[RegAI API] Successfully auto-switched backend port to:', altBase);
                        return altRes;
                    }
                } catch {
                    // Fall back to mock below
                }
            }

            console.warn('[RegAI API] Static Hosting HTML response detected, fallback to mock data:', response.config.url);
            const mockData = await getMockResponse(response.config);
            return {
                ...response,
                status: 200,
                statusText: 'OK',
                data: mockData,
            };
        }
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean; _portSwapped?: boolean }) | undefined;

        if (originalRequest) {
            const isHtmlError =
                error.response &&
                typeof error.response.data === 'string' &&
                (error.response.data.includes('<!doctype html') || error.response.data.includes('<html'));
            const isNetworkOrOffline =
                error.code === 'ERR_NETWORK' ||
                error.message?.includes('Network Error') ||
                error.response?.status === 503 ||
                error.response?.status === 502 ||
                error.response?.status === 404 ||
                error.response?.status === 405 ||
                Boolean(isHtmlError);

            if (isHtmlError || isNetworkOrOffline) {
                const currentBase = originalRequest.baseURL || api.defaults.baseURL || '';
                if (!originalRequest._portSwapped && (currentBase.includes(':8000') || currentBase.includes(':8001'))) {
                    originalRequest._portSwapped = true;
                    const altBase = currentBase.includes(':8000')
                        ? currentBase.replace(':8000', ':8001')
                        : currentBase.replace(':8001', ':8000');
                    try {
                        const altRes = await axios({ ...originalRequest, baseURL: altBase });
                        const altIsHtml =
                            typeof altRes.data === 'string' &&
                            (altRes.data.trim().toLowerCase().startsWith('<!doctype html') || altRes.data.includes('<html'));
                        if (!altIsHtml) {
                            api.defaults.baseURL = altBase;
                            console.info('[RegAI API] Successfully auto-switched backend port to:', altBase);
                            return altRes;
                        }
                    } catch {
                        // Fall back to mock below
                    }
                }

                console.warn('[RegAI API] Unreachable backend / HTML rewrite detected, serving mock data:', originalRequest.url);
                const mockData = await getMockResponse(originalRequest);
                return {
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    config: originalRequest,
                    data: mockData,
                };
            }
        }

        if (!error.response || !originalRequest) {
            return Promise.reject(error);
        }

        const isAuthEndpoint =
            originalRequest.url?.includes('/auth/login') ||
            originalRequest.url?.includes('/auth/refresh');

        // Only redirect on /users/me if it is an explicit 401 unauthorized and not offline/static hosting
        if (originalRequest.url?.includes('/users/me') && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }

        // If 401 unauthorized and not already retried and not a login/refresh request
        if (error.response.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            const currentToken = localStorage.getItem('token');
            if (!currentToken) {
                localStorage.removeItem('user');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // If another refresh is already running, wait in queue
                return new Promise<string>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const baseURL = import.meta.env.VITE_API_URL || '/api/v1';
                // Direct axios call without using interceptor to prevent loop
                const refreshRes = await axios.post<{ access_token: string; token_type: string }>(
                    `${baseURL}/auth/refresh`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${currentToken}`,
                        },
                    }
                );

                const newToken = refreshRes.data.access_token;
                localStorage.setItem('token', newToken);
                api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                originalRequest.headers.Authorization = `Bearer ${newToken}`;

                processQueue(null, newToken);
                return api(originalRequest);
            } catch (refreshErr) {
                processQueue(refreshErr, null);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshErr);
            } finally {
                isRefreshing = false;
            }
        }

        if (error.response.status === 429) {
            console.error('Rate limit exceeded');
        }

        // Auto-retry on 502/503/504 (gateway/server transient errors — Railway cold starts)
        const RETRY_STATUS = [502, 503, 504];
        const retryCount = (originalRequest as any)._retryCount || 0;
        if (RETRY_STATUS.includes(error.response.status) && retryCount < 2) {
            (originalRequest as any)._retryCount = retryCount + 1;
            const delay = 1200 * (retryCount + 1); // 1.2s, 2.4s
            await new Promise((res) => setTimeout(res, delay));
            return api(originalRequest);
        }

        return Promise.reject(error);
    }
);

export default api;
