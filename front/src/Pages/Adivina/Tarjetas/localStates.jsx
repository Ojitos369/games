import { useMemo, useEffect, useState, useCallback, useRef } from 'react';
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
    const fRef = useRef(f);
    useEffect(() => { fRef.current = f; }, [f]);

    const [, setTitulo] = createState(['page', 'title'], '');
    const [, setActualPage] = createState(['page', 'actual'], '');

    const tarjetasAll = useMemo(() => s.adivina?.tarjetas || [], [s.adivina?.tarjetas]);
    const meta = useMemo(() => s.adivina?.tarjetasMeta || {
        total: 0, page: 1, page_size: DEFAULT_PAGE_SIZE, pages: 1,
        scope_counts: { all: 0, mine: 0, no_image: 0, no_tags: 0 }
    }, [s.adivina?.tarjetasMeta]);
    const tags = useMemo(() => s.adivina?.tags || [], [s.adivina?.tags]);
    const isAdmin = useMemo(() => s.usuario?.data?.is_admin, [s.usuario?.data?.is_admin]);
    const currentUserId = useMemo(() => s.usuario?.data?.id, [s.usuario?.data?.id]);
    const loadingTarjetas = useMemo(() => s.loadings?.adivina?.tarjetas || false, [s.loadings?.adivina?.tarjetas]);

    const [searchQ, setSearchQ] = useState('');
    const [debouncedQ, setDebouncedQ] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [tagMode, setTagMode] = useState('any');
    const [scope, setScope] = useState('all');
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
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [tagSearch, setTagSearch] = useState('');

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

    useEffect(() => {
        const id = setTimeout(() => setDebouncedQ(searchQ.trim()), 250);
        return () => clearTimeout(id);
    }, [searchQ]);

    useEffect(() => { setPage(1); }, [debouncedQ, selectedTags, tagMode, scope, sortBy, pageSize]);

    const tagIdToName = useMemo(() => {
        const m = new Map();
        for (const t of tags) m.set(t.id, t.nombre);
        return m;
    }, [tags]);

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
        f.adivina.getTags();
        f.adivina.getTarjetas({
            scope: 'all',
            sort_by: 'name_asc',
            page: 1,
            page_size: pageSize,
        });
    }, []);

    return {
        style, navigate,
        tarjetasAll, tags, tagsWithCounts, filteredSidebarTags, topTags, scopeCounts,
        loadingTarjetas, isAdmin, currentUserId,
        paginated: tarjetasAll,
        totalCount, totalPages, page: safePage, setPage,
        searchQ, setSearchQ,
        selectedTags, toggleTag,
        tagMode, setTagMode,
        scope, setScope,
        sortBy, setSortBy, sortOptions: SORT_OPTIONS,
        viewMode, setViewMode,
        pageSize, setPageSize, pageSizeOptions: PAGE_SIZE_OPTIONS,
        clearFilters, activeFiltersCount,
        filtersOpen, setFiltersOpen,
        tagSearch, setTagSearch,
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
