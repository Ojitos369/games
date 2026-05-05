import { useMemo, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStates, createState } from '../../../Hooks/useStates';
import style from './styles/index.module.scss';

const host = window.location.hostname;
const protocol = window.location.protocol;
const port = window.location.port === '5173' ? ':8372' : (window.location.port ? `:${window.location.port}` : '');
const API_BASE = `${protocol}//${host}${port}`;

const PAGE_SIZE_OPTIONS = [24, 48, 96, 192];
const DEFAULT_PAGE_SIZE = 48;

const SORT_OPTIONS = [
    { id: 'name_asc', label: 'Nombre A→Z' },
    { id: 'name_desc', label: 'Nombre Z→A' },
    { id: 'recent', label: 'Más recientes' },
    { id: 'oldest', label: 'Más antiguos' },
];

const stripDiacritics = (str = '') =>
    str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export const localStates = () => {
    const { s, f } = useStates();
    const navigate = useNavigate();

    const [, setTitulo] = createState(['page', 'title'], '');
    const [, setActualPage] = createState(['page', 'actual'], '');

    const tarjetasAll = useMemo(() => s.adivina?.tarjetas || [], [s.adivina?.tarjetas]);
    const tags = useMemo(() => s.adivina?.tags || [], [s.adivina?.tags]);
    const isAdmin = useMemo(() => s.usuario?.data?.is_admin, [s.usuario?.data?.is_admin]);
    const currentUserId = useMemo(() => s.usuario?.data?.id, [s.usuario?.data?.id]);
    const loadingTarjetas = useMemo(() => s.loadings?.adivina?.tarjetas || false, [s.loadings?.adivina?.tarjetas]);

    // Search & filter state
    const [searchQ, setSearchQ] = useState('');
    const [debouncedQ, setDebouncedQ] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [tagMode, setTagMode] = useState('any'); // 'any' | 'all'
    const [scope, setScope] = useState('all'); // 'all' | 'mine' | 'no_image' | 'no_tags'
    const [sortBy, setSortBy] = useState('name_asc');
    const [viewMode, setViewMode] = useState(() => {
        try { return localStorage.getItem('adivina_tarjetas_view') || 'grid'; } catch { return 'grid'; }
    });
    const [pageSize, setPageSize] = useState(() => {
        try {
            const v = parseInt(localStorage.getItem('adivina_tarjetas_pagesize') || '', 10);
            return PAGE_SIZE_OPTIONS.includes(v) ? v : DEFAULT_PAGE_SIZE;
        } catch { return DEFAULT_PAGE_SIZE; }
    });
    const [page, setPage] = useState(1);
    const [filtersOpen, setFiltersOpen] = useState(false); // mobile drawer

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [previewTarget, setPreviewTarget] = useState(null);
    const [form, setForm] = useState({ nombre: '', descripcion: '', tags: [] });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [newTagName, setNewTagName] = useState('');

    useEffect(() => {
        try { localStorage.setItem('adivina_tarjetas_view', viewMode); } catch { /* noop */ }
    }, [viewMode]);
    useEffect(() => {
        try { localStorage.setItem('adivina_tarjetas_pagesize', String(pageSize)); } catch { /* noop */ }
    }, [pageSize]);

    // Debounce search
    useEffect(() => {
        const id = setTimeout(() => setDebouncedQ(searchQ.trim()), 200);
        return () => clearTimeout(id);
    }, [searchQ]);

    // Reset page on filter change
    useEffect(() => { setPage(1); }, [debouncedQ, selectedTags, tagMode, scope, sortBy, pageSize]);

    const openPreview = useCallback((tarjeta) => {
        setPreviewTarget(tarjeta);
        setShowImageModal(true);
    }, []);

    const getImageUrl = useCallback((tarjeta) => {
        if (!tarjeta?.imagen_url) return null;
        if (tarjeta.imagen_url.startsWith('http')) return tarjeta.imagen_url;
        return `${API_BASE}${tarjeta.imagen_url}`;
    }, []);

    const canEdit = useCallback((tarjeta) => {
        return isAdmin
            || tarjeta?.creador?.id === currentUserId
            || tarjeta?.creador_id === currentUserId;
    }, [isAdmin, currentUserId]);

    const toggleTag = useCallback((tagId) => {
        setSelectedTags(prev =>
            prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
        );
    }, []);

    const clearFilters = useCallback(() => {
        setSearchQ('');
        setDebouncedQ('');
        setSelectedTags([]);
        setTagMode('any');
        setScope('all');
        setSortBy('name_asc');
    }, []);

    const toggleFormTag = useCallback((tagId) => {
        setForm(prev => ({
            ...prev,
            tags: prev.tags.includes(tagId) ? prev.tags.filter(t => t !== tagId) : [...prev.tags, tagId]
        }));
    }, []);

    // ── Filter pipeline ────────────────────────────────────────────────
    const filteredByScope = useMemo(() => {
        if (scope === 'all') return tarjetasAll;
        if (scope === 'mine') return tarjetasAll.filter(t => (t.creador?.id || t.creador_id) === currentUserId);
        if (scope === 'no_image') return tarjetasAll.filter(t => !t.imagen_url && !t.imagen);
        if (scope === 'no_tags') return tarjetasAll.filter(t => !t.tags || t.tags.length === 0);
        return tarjetasAll;
    }, [tarjetasAll, scope, currentUserId]);

    const filteredByTags = useMemo(() => {
        if (!selectedTags.length) return filteredByScope;
        return filteredByScope.filter(t => {
            const tagIds = (t.tags || []).map(x => x.id);
            if (tagMode === 'all') return selectedTags.every(id => tagIds.includes(id));
            return selectedTags.some(id => tagIds.includes(id));
        });
    }, [filteredByScope, selectedTags, tagMode]);

    const filteredBySearch = useMemo(() => {
        if (!debouncedQ) return filteredByTags;
        const needle = stripDiacritics(debouncedQ);
        return filteredByTags.filter(t => {
            const hay = stripDiacritics(`${t.nombre || ''} ${t.descripcion || ''}`);
            return hay.includes(needle);
        });
    }, [filteredByTags, debouncedQ]);

    const sorted = useMemo(() => {
        const arr = [...filteredBySearch];
        switch (sortBy) {
            case 'name_desc':
                arr.sort((a, b) => stripDiacritics(b.nombre || '').localeCompare(stripDiacritics(a.nombre || '')));
                break;
            case 'recent':
                arr.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
                break;
            case 'oldest':
                arr.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
                break;
            case 'name_asc':
            default:
                arr.sort((a, b) => stripDiacritics(a.nombre || '').localeCompare(stripDiacritics(b.nombre || '')));
                break;
        }
        return arr;
    }, [filteredBySearch, sortBy]);

    const totalCount = sorted.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(page, totalPages);
    const pageStart = (safePage - 1) * pageSize;
    const pageEnd = pageStart + pageSize;
    const paginated = useMemo(() => sorted.slice(pageStart, pageEnd), [sorted, pageStart, pageEnd]);

    const tagsWithCounts = useMemo(() => {
        const counts = {};
        for (const t of tarjetasAll) {
            for (const tg of (t.tags || [])) {
                counts[tg.id] = (counts[tg.id] || 0) + 1;
            }
        }
        return tags
            .map(tg => ({ ...tg, count: counts[tg.id] || 0 }))
            .sort((a, b) => (b.count - a.count) || stripDiacritics(a.nombre || '').localeCompare(stripDiacritics(b.nombre || '')));
    }, [tags, tarjetasAll]);

    const scopeCounts = useMemo(() => ({
        all: tarjetasAll.length,
        mine: tarjetasAll.filter(t => (t.creador?.id || t.creador_id) === currentUserId).length,
        no_image: tarjetasAll.filter(t => !t.imagen_url && !t.imagen).length,
        no_tags: tarjetasAll.filter(t => !t.tags || t.tags.length === 0).length,
    }), [tarjetasAll, currentUserId]);

    const activeFiltersCount = useMemo(() => {
        let n = 0;
        if (debouncedQ) n++;
        if (selectedTags.length) n++;
        if (scope !== 'all') n++;
        if (sortBy !== 'name_asc') n++;
        return n;
    }, [debouncedQ, selectedTags, scope, sortBy]);

    // ── Modal handlers ─────────────────────────────────────────────────
    const openCreate = useCallback(() => {
        setEditTarget(null);
        setForm({ nombre: '', descripcion: '', tags: [] });
        setImageFile(null);
        setImagePreview(null);
        setShowModal(true);
    }, []);

    const openEdit = useCallback((tarjeta) => {
        setEditTarget(tarjeta);
        setForm({
            nombre: tarjeta.nombre || '',
            descripcion: tarjeta.descripcion || '',
            tags: tarjeta.tags?.map(t => t.id) || [],
        });
        setImageFile(null);
        setImagePreview(getImageUrl(tarjeta));
        setShowModal(true);
    }, [getImageUrl]);

    const handleImageChange = useCallback((e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    }, []);

    const handleSave = useCallback(() => {
        if (!form.nombre.trim()) return;
        if (editTarget) {
            f.adivina.updateTarjeta({ tarjeta_id: editTarget.id, ...form }, () => {
                if (imageFile) f.adivina.uploadTarjetaImage(editTarget.id, imageFile);
                setShowModal(false);
            });
        } else {
            f.adivina.createTarjeta(form, (res) => {
                if (imageFile) f.adivina.uploadTarjetaImage(res.id, imageFile);
                setShowModal(false);
            });
        }
    }, [form, editTarget, imageFile, f.adivina]);

    const handleDelete = useCallback((tarjeta_id) => {
        if (!confirm('¿Eliminar esta tarjeta?')) return;
        f.adivina.deleteTarjeta(tarjeta_id);
    }, [f.adivina]);

    const handleCreateTag = useCallback(() => {
        if (!newTagName.trim()) return;
        f.adivina.createTag(newTagName.trim(), (res) => {
            setForm(prev => ({ ...prev, tags: [...prev.tags, res.id] }));
            setNewTagName('');
        }, true);
    }, [newTagName, f.adivina]);

    const init = useCallback(() => {
        const title = 'Tarjetas';
        setTitulo(title);
        setActualPage('adivina_tarjetas');
        document.title = title;
        f.adivina.getTarjetas();
        f.adivina.getTags();
    }, []);

    return {
        style, navigate,
        tarjetasAll, tags, tagsWithCounts, scopeCounts,
        loadingTarjetas, isAdmin, currentUserId,
        paginated, totalCount, totalPages, page: safePage, setPage,
        searchQ, setSearchQ,
        selectedTags, toggleTag,
        tagMode, setTagMode,
        scope, setScope,
        sortBy, setSortBy, sortOptions: SORT_OPTIONS,
        viewMode, setViewMode,
        pageSize, setPageSize, pageSizeOptions: PAGE_SIZE_OPTIONS,
        clearFilters, activeFiltersCount,
        filtersOpen, setFiltersOpen,
        showModal, setShowModal,
        showImageModal, setShowImageModal,
        editTarget, previewTarget,
        form, setForm,
        imagePreview,
        newTagName, setNewTagName,
        getImageUrl, canEdit, toggleFormTag,
        openCreate, openEdit, handleImageChange, openPreview,
        handleSave, handleDelete, handleCreateTag,
        init,
    };
};

export const localEffects = () => {
    const { init } = localStates();
    useEffect(() => { init(); }, []);
};
