import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';

/** Fetch on mount / when deps change. Returns { data, loading, error, reload }. */
export function useFetch(path, params, deps = []) {
    const [state, setState] = useState({ data: null, loading: true, error: null });
    const key = JSON.stringify(params || {});
    const load = useCallback(async () => {
        setState((s) => ({ ...s, loading: true, error: null }));
        try { setState({ data: await api(path, { params }), loading: false, error: null }); }
        catch (e) { setState({ data: null, loading: false, error: e.message }); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path, key, ...deps]);
    useEffect(() => { load(); }, [load]);
    return { ...state, reload: load };
}

/** Adds the "in" class once the element scrolls into view. */
export function useReveal() {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('in'); io.disconnect(); } }, { threshold: 0.15 });
        io.observe(el);
        return () => io.disconnect();
    }, []);
    return ref;
}

export function useDebounced(value, ms = 350) {
    const [v, setV] = useState(value);
    useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
    return v;
}
