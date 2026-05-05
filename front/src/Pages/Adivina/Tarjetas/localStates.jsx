import { useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStates, createState } from '../../../Hooks/useStates';
import style from './styles/index.module.scss';

const host = window.location.hostname;
const protocol = window.location.protocol;
const port = window.location.port === '5173' ? ':8372' : (window.location.port ? `:${window.location.port}` : '');
const API_BASE = `${protocol}//${host}${port}`;

export const PAGE_SIZE_OPTIONS = [24, 48, 96, 192];
export const DEFAULT_PAGE_SIZE = 48;

export const SORT_OPTIONS = [
    { id: 'name_asc', label: 'Nombre A→Z' },
    { id: 'name_desc', label: 'Nombre Z→A' },
    { id: 'recent', label: 'Más recientes' },
    { id: 'oldest', label: 'Más antiguos' },
];

export const VIEW_MODES = [
    { id: 'grid', icon: '▦', title: 'Grid' },
    { id: 'compact', icon: '▤', title: 'Compacto' },
    { id: 'list', icon: '☰', title: 'Lista' },
];

const stripDiacritics = (str = '') =>
    str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export const localStates = () => {
    const { s, f } = useStates();
    const navigate = useNavigate();

    const [, setTitulo] = createState(['page', 'title'], '');
    const [, setActualPage] = createState(['page', 'actual'], '');
    const [, setMenuBarMode] = createState(['menubar', 'menuMode'], null);
    const [, setMenuBarOpen] = createState(['menubar', 'open'], false);

    const tarjetasAll = useMemo(() => s.adivina?.tarjetas || [], [s.adivina?.tarjetas]);
    const meta = useMemo(() => s.adivina?.tarjetasMeta || {
        total: 0, page: 1, page_size: DEFAULT_PAGE_SIZE, pages: 1,
        scope_counts: { all: 0, mine: 0, no_image: 0, no_tags: 0 }
    }, [s.adivina?.tarjetasMeta]);
    const tags = useMemo(() => s.adivina?.tags || [], [s.adivina?.tags]);
    const isAdmin = useMemo(() => s.usuario?.data?.is_admin, [s.usuario?.data?.is_admin]);
    const currentUserId = useMemo(() => s.usuario?.data?.id, [s.usuario?.data?.id]);
    const loadingTarjetas = useMemo(() => s.loadings?.adivina?.tarjetas || false, [s.loadings?.adivina?.tarjetas]);

    const [searchQ, setSearchQ] = createState(['adivina', 'tarjetasUI', 'searchQ'], '');
    const [debouncedQ, setDebouncedQ] = createState(['adivina', 'tarjetasUI', 'debouncedQ'], '');
    const [selectedTags, setSelectedTags] = createState(['adivina', 'tarjetasUI', 'selectedTags'], []);
    const [tagMode, setTagMode] = createState(['adivina', 'tarjetasUI', 'tagMode'], 'any');
    const [scope, setScope] = createState(['adivina', 'tarjetasUI', 'scope'], 'all');
    const [sortBy, setSortBy] = createState(['adivina', 'tarjetasUI', 'sortBy'], 'name_asc');
    const [viewMode, setViewMode] = createState(['adivina', 'tarjetasUI', 'viewMode'], 'grid');
    const [pageSize, setPageSize] = createState(['adivina', 'tarjetasUI', 'pageSize'], DEFAULT_PAGE_SIZE);
    const [page, setPage] = createState(['adivina', 'tarjetasUI', 'page'], 1);
    const [tagSearch, setTagSearch] = createState(['adivina', 'tarjetasUI', 'tagSearch'], '');

    const [showModal, setShowModal] = createState(['adivina', 'tarjetasUI', 'showModal'], false);
    const [showImageModal, setShowImageModal] = createState(['adivina', 'tarjetasUI', 'showImageModal'], false);
    const [editTarget, setEditTarget] = createState(['adivina', 'tarjetasUI', 'editTarget'], null);
    const [previewTarget, setPreviewTarget] = createState(['adivina', 'tarjetasUI', 'previewTarget'], null);

    const tagIdToName = useMemo(() => {
        const m = new Map();
        for (const t of tags) m.set(t.id, t.nombre);
        return m;
    }, [tags]);

    const tagsWithCounts = useMemo(() => {
        return [...tags]
            .map(tg => ({ ...tg, count: tg.tarjetas_count ?? tg.count ?? 0 }))
            .sort((a, b) => (b.count - a.count) || stripDiacritics(a.nombre || '').localeCompare(stripDiacritics(b.nombre || '')));
    }, [tags]);

    const filteredSidebarTags = useMemo(() => {
        if (!tagSearch.trim()) return tagsWithCounts;
        const needle = stripDiacritics(tagSearch);
        return tagsWithCounts.filter(t => stripDiacritics(t.nombre || '').includes(needle));
    }, [tagsWithCounts, tagSearch]);

    const topTags = useMemo(() => tagsWithCounts.slice(0, 12), [tagsWithCounts]);

    const scopeCounts = meta.scope_counts || { all: 0, mine: 0, no_image: 0, no_tags: 0 };
    const totalCount = meta.total || 0;
    const totalPages = Math.max(1, meta.pages || 1);
    const safePage = Math.min(meta.page || page, totalPages);

    const activeFiltersCount = useMemo(() => {
        let n = 0;
        if (debouncedQ) n++;
        if (selectedTags.length) n++;
        if (scope !== 'all') n++;
        if (sortBy !== 'name_asc') n++;
        return n;
    }, [debouncedQ, selectedTags, scope, sortBy]);

    const toggleTag = useCallback((tagId) => {
        setSelectedTags(selectedTags.includes(tagId) ? selectedTags.filter(t => t !== tagId) : [...selectedTags, tagId]);
    }, [selectedTags]);

    const clearFilters = useCallback(() => {
        setSearchQ('');
        setDebouncedQ('');
        setSelectedTags([]);
        setTagMode('any');
        setScope('all');
        setSortBy('name_asc');
    }, []);

    const openPreview = useCallback((tarjeta) => {
        setPreviewTarget(tarjeta);
        setShowImageModal(true);
    }, []);

    const getImageUrl = useCallback((tarjeta) => {
        if (!tarjeta) return null;
        if (tarjeta.imagen_url) {
            if (tarjeta.imagen_url.startsWith('http')) return tarjeta.imagen_url;
            return `${API_BASE}${tarjeta.imagen_url}`;
        }
        if (tarjeta.imagen) return `${API_BASE}/media/images/adivina/${tarjeta.id}/${tarjeta.imagen}`;
        return null;
    }, []);

    const canEdit = useCallback((tarjeta) => {
        return isAdmin
            || tarjeta?.creador?.id === currentUserId
            || tarjeta?.creador_id === currentUserId;
    }, [isAdmin, currentUserId]);

    const openCreate = useCallback(() => {
        setEditTarget(null);
        setShowModal(true);
    }, []);

    const openEdit = useCallback((tarjeta) => {
        setEditTarget(tarjeta);
        setShowModal(true);
    }, []);

    const handleDelete = useCallback((tarjeta_id) => {
        if (!confirm('¿Eliminar esta tarjeta?')) return;
        f.adivina.deleteTarjeta(tarjeta_id);
    }, [f.adivina]);

    const openFiltersMenu = useCallback(() => {
        setMenuBarMode('adivina_tarjetas');
        setMenuBarOpen(true);
    }, []);

    return {
        style, navigate,
        tarjetasAll, tags, tagsWithCounts, filteredSidebarTags, topTags, scopeCounts,
        loadingTarjetas, isAdmin, currentUserId,
        paginated: tarjetasAll,
        totalCount, totalPages, page: safePage, setPage,
        searchQ, setSearchQ, debouncedQ, setDebouncedQ,
        selectedTags, setSelectedTags, toggleTag,
        tagMode, setTagMode,
        scope, setScope,
        sortBy, setSortBy, sortOptions: SORT_OPTIONS,
        viewMode, setViewMode, viewModes: VIEW_MODES,
        pageSize, setPageSize, pageSizeOptions: PAGE_SIZE_OPTIONS,
        clearFilters, activeFiltersCount,
        tagSearch, setTagSearch,
        showModal, setShowModal,
        showImageModal, setShowImageModal,
        editTarget, setEditTarget, previewTarget, setPreviewTarget,
        openPreview,
        tagIdToName,
        getImageUrl, canEdit,
        openCreate, openEdit, handleDelete,
        openFiltersMenu,
        setTitulo, setActualPage, setMenuBarMode, setMenuBarOpen,
        f,
    };
};

export const localEffects = () => {
    const ls = localStates();
    const {
        f, setMenuBarMode, searchQ, setDebouncedQ, debouncedQ,
        selectedTags, tagMode, scope, sortBy, page, pageSize,
        setPage, tagIdToName, viewMode,
        setTitulo, setActualPage,
    } = ls;

    const fRef = useRef(f);
    useEffect(() => { fRef.current = f; }, [f]);

    useEffect(() => {
        try { localStorage.setItem('adivina_tarjetas_view', viewMode); } catch { /* noop */ }
    }, [viewMode]);

    useEffect(() => {
        try { localStorage.setItem('adivina_tarjetas_pagesize', String(pageSize)); } catch { /* noop */ }
    }, [pageSize]);

    useEffect(() => {
        const id = setTimeout(() => setDebouncedQ((searchQ || '').trim()), 250);
        return () => clearTimeout(id);
    }, [searchQ]);

    useEffect(() => { setPage(1); }, [debouncedQ, selectedTags, tagMode, scope, sortBy, pageSize]);

    const fetchTarjetas = useCallback(() => {
        const tagNames = selectedTags
            .map(id => tagIdToName.get(id))
            .filter(Boolean);
        fRef.current.adivina.getTarjetas({
            q: debouncedQ || undefined,
            tags: tagNames.length ? tagNames : undefined,
            tag_mode: tagMode,
            scope,
            sort_by: sortBy,
            page,
            page_size: pageSize,
        });
    }, [debouncedQ, selectedTags, tagIdToName, tagMode, scope, sortBy, page, pageSize]);

    const initialFetchedRef = useRef(false);
    useEffect(() => {
        if (!initialFetchedRef.current) {
            initialFetchedRef.current = true;
            return;
        }
        fetchTarjetas();
    }, [fetchTarjetas]);

    useEffect(() => {
        const title = 'Tarjetas';
        setTitulo(title);
        setActualPage('adivina_tarjetas');
        document.title = title;
        f.adivina.getTags();
        f.adivina.getTarjetas({
            scope: 'all',
            sort_by: 'name_asc',
            page: 1,
            page_size: pageSize,
        });
        try {
            const v = localStorage.getItem('adivina_tarjetas_view');
            if (v) ls.setViewMode(v);
            const ps = parseInt(localStorage.getItem('adivina_tarjetas_pagesize') || '', 10);
            if (PAGE_SIZE_OPTIONS.includes(ps)) ls.setPageSize(ps);
        } catch { /* noop */ }
    }, []);

    useEffect(() => {
        setMenuBarMode('adivina_tarjetas');
        return () => {
            setMenuBarMode(null);
        };
    }, []);
};
