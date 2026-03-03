// src/api/client.js
import config from '../config/config';

class APIClient {
    constructor() {
        this.config = config;
        this.timeout = config.http.timeout;
    }

    async request(method, url, data = null, params = {}) {
        try {
            const fetchOptions = {
                method,
                headers: this.config.http.headers,
            };

            if (data && (method === 'POST' || method === 'PATCH')) {
                fetchOptions.body = JSON.stringify(data);
            }

            const queryString = new URLSearchParams(params).toString();
            const fullUrl = queryString ? `${url}?${queryString}` : url;

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(fullUrl, {
                ...fetchOptions,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                let body = response.statusText;
                try {
                    const text = await response.text();
                    if (text) {
                        try {
                            const parsed = JSON.parse(text);
                            body = typeof parsed === 'object' && (parsed.message ?? parsed.error ?? parsed.detail)
                                ? (parsed.message ?? parsed.error ?? parsed.detail)
                                : text;
                        } catch (_) {
                            // Not JSON — use raw text
                            body = text;
                        }
                    }
                } catch (_) {
                    // keep body as response.statusText
                }
                throw new Error(`HTTP ${response.status}: ${body}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`❌ API Error: ${error.message} (URL: ${url})`);
            throw error;
        }
    }

    get(url, params = {}) {
        return this.request('GET', url, null, params);
    }

    post(url, data) {
        return this.request('POST', url, data);
    }

    patch(url, data) {
        return this.request('PATCH', url, data);
    }

    delete(url) {
        return this.request('DELETE', url);
    }
}

export default new APIClient();
