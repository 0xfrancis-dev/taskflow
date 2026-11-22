const TOKEN_KEY = 'taskflow_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

export class ApiError extends Error {
    constructor(message, status, errors = {}) {
        super(message);
        this.status = status;
        this.errors = errors;
    }
}

export async function api(path, { method = 'GET', body, params } = {}) {
    let url = '/api' + path;
    if (params) {
        const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null));
        if ([...q].length) url += '?' + q.toString();
    }
    const headers = { Accept: 'application/json' };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    let payload = body;
    if (body && !(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        payload = JSON.stringify(body);
    }

    let res;
    try {
        res = await fetch(url, { method, headers, body: payload });
    } catch {
        throw new ApiError('Cannot reach the server. Check your connection.', 0);
    }
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        if (res.status === 401 && token) {
            setToken(null);
            window.dispatchEvent(new Event('taskflow:logout'));
        }
        const first = data.errors ? Object.values(data.errors)[0]?.[0] : null;
        throw new ApiError(first || data.message || 'Something went wrong.', res.status, data.errors || {});
    }
    return data;
}

export const naira = (n) => '₦' + Number(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
export const dateFmt = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
export const timeFmt = (d) => new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export const PLATFORMS = {
    instagram: { label: 'Instagram', icon: 'photo_camera', color: '#E1306C' },
    tiktok: { label: 'TikTok', icon: 'music_note', color: '#111111' },
    youtube: { label: 'YouTube', icon: 'smart_display', color: '#FF0000' },
    x: { label: 'X / Twitter', icon: 'alternate_email', color: '#1B1340' },
    facebook: { label: 'Facebook', icon: 'groups', color: '#1877F2' },
    telegram: { label: 'Telegram', icon: 'send', color: '#27A7E7' },
    whatsapp: { label: 'WhatsApp', icon: 'chat', color: '#25D366' },
    website: { label: 'Website', icon: 'language', color: '#6B4CFF' },
    other: { label: 'Other', icon: 'bolt', color: '#FFC247' },
};
