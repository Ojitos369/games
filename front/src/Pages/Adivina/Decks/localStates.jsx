import { useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStates, createState } from '../../../Hooks/useStates';
import style from './styles/index.module.scss';

export const PAGE_SIZE_OPTIONS = [12, 24, 48, 96];
export const DEFAULT_PAGE_SIZE = 24;

export const SORT_OPTIONS_MIS = [
    { id: 'name_asc', label: 'Nombre A→Z' },
    { id: 'name_desc', label: 'Nombre Z→A' },
    { id: 'recent', label: 'Más recientes' },
    { id: 'oldest', label: 'Más antiguos' },
    { id: 'biggest', label: 'Más tarjetas' },
    { id: 'smallest', label: 'Menos tarjetas' },
];

export const SORT_OPTIONS_PUBLIC = [
    { id: 'recent', label: 'Más recientes' },
    { id: 'popular', label: 'Más populares' },
    { id: 'biggest', label: 'Más tarjetas' },
    { id: 'name_asc', label: 'Nombre A→Z' },
    { id: 'name_desc', label: 'Nombre Z→A' },
    { id: 'oldest', label: 'Más antiguos' },
];

export const PICKER_PAGE_SIZE = 30;

const host = window.location.hostname;
const protocol = window.location.protocol;
const port = window.location.port === '5173' ? ':8372' : (window.location.port ? `:${window.location.port}` : '');
const API_BASE = `${protocol}//${host}${port}`;

export const getImageUrl = (t) => {
    if (!t) return null;
    if (t.imagen_url) {
        if (t.imagen_url.startsWith('http')) return t.imagen_url;
        return `${API_BASE}${t.imagen_url}`;
    }
    if (t.imagen) return `${API_BASE}/media/images/adivina/${t.id}/${t.imagen}`;
    return null;
};

export const localStates = () => {
    const { s, f } = useStates();
    const navigate = useNavigate();

    const [, setTitulo] = createState(['page', 'title'], '');
    const [, setActualPage] = createState(['page', 'actual'], '');
    const [, setMenuBarMode] = createState(['menubar', 'menuMode'], null);
    const [, setMenuBarOpen] = createState(['menubar', 'open'], false);

    const decks = useMemo(() => s.adivina?.decks || [], [s.adivina?.decks]);
    const decksMeta = useMemo(() => s.adivina?.decksMeta || {
        total: 0, page: 1, page_size: DEFAULT_PAGE_SIZE, pages: 1,
        scope_counts: { all: 0, owned: 0, imported: 0 }
    }, [s.adivina?.decksMeta]);
    const decksPublicos = useMemo(() => s.adivina?.decksPublicos || [], [s.adivina?.decksPublicos]);
    const decksPublicosMeta = useMemo(() => s.adivina?.decksPublicosMeta || {
        total: 0, page: 1, page_size: DEFAULT_PAGE_SIZE, pages: 1,
    }, [s.adivina?.decksPublicosMeta]);
    const tags = useMemo(() => s.adivina?.tags || [], [s.adivina?.tags]);
    const loadingDecks = useMemo(() => s.loadings?.adivina?.decks || false, [s.loadings?.adivina?.decks]);
    const loadingPublicos = useMemo(() => s.loadings?.adivina?.decksPublicos || false, [s.loadings?.adivina?.decksPublicos]);

    const [activeTab, setActiveTab] = createState(['adivina', 'decksUI', 'activeTab'], 'mis');
    const [misSearchQ, setMisSearchQ] = createState(['adivina', 'decksUI', 'misSearchQ'], '');
    const [misDebouncedQ, setMisDebouncedQ] = createState(['adivina', 'decksUI', 'misDebouncedQ'], '');
    const [misScope, setMisScope] = createState(['adivina', 'decksUI', 'misScope'], 'all');
    const [misSort, setMisSort] = createState(['adivina', 'decksUI', 'misSort'], 'name_asc');
    const [misPage, setMisPage] = createState(['adivina', 'decksUI', 'misPage'], 1);

    const [pubSearchQ, setPubSearchQ] = createState(['adivina', 'decksUI', 'pubSearchQ'], '');
    const [pubDebouncedQ, setPubDebouncedQ] = createState(['adivina', 'decksUI', 'pubDebouncedQ'], '');
    const [pubSort, setPubSort] = createState(['adivina', 'decksUI', 'pubSort'], 'recent');
    const [pubOnlyNew, setPubOnlyNew] = createState(['adivina', 'decksUI', 'pubOnlyNew'], false);
    const [pubPage, setPubPage] = createState(['adivina', 'decksUI', 'pubPage'], 1);

    const [pageSize, setPageSize] = createState(['adivina', 'decksUI', 'pageSize'], DEFAULT_PAGE_SIZE);
    const [expandedDeck, setExpandedDeck] = createState(['adivina', 'decksUI', 'expandedDeck'], null);
    const [deckTarjetas, setDeckTarjetas] = createState(['adivina', 'decksUI', 'deckTarjetas'], {});

    const [showModal, setShowModal] = createState(['adivina', 'decksUI', 'showModal'], false);
    const [showImageModal, setShowImageModal] = createState(['adivina', 'decksUI', 'showImageModal'], false);
    const [editTarget, setEditTarget] = createState(['adivina', 'decksUI', 'editTarget'], null);
    const [previewTarget, setPreviewTarget] = createState(['adivina', 'decksUI', 'previewTarget'], null);
    const [form, setForm] = createState(['adivina', 'decksUI', 'form'], { nombre: '', descripcion: '', tarjeta_ids: [] });

    const [pickerSearch, setPickerSearch] = createState(['adivina', 'decksUI', 'pickerSearch'], '');
    const [pickerDebouncedSearch, setPickerDebouncedSearch] = createState(['adivina', 'decksUI', 'pickerDebouncedSearch'], '');
    const [pickerTagFilter, setPickerTagFilter] = createState(['adivina', 'decksUI', 'pickerTagFilter'], '');
    const [pickerPage, setPickerPage] = createState(['adivina', 'decksUI', 'pickerPage'], 1);
    const [pickerData, setPickerData] = createState(['adivina', 'decksUI', 'pickerData'], { tarjetas: [], total: 0, pages: 1 });
    const [pickerLoading, setPickerLoading] = createState(['adivina', 'decksUI', 'pickerLoading'], false);
    const [selectedTarjetasMap, setSelectedTarjetasMap] = createState(['adivina', 'decksUI', 'selectedTarjetasMap'], {});

    const isMis = activeTab === 'mis';
    const meta = isMis ? decksMeta : decksPublicosMeta;
    const totalPages = Math.max(1, meta.pages || 1);
    const currentPage = isMis ? misPage : pubPage;
    const setCurrentPage = isMis ? setMisPage : setPubPage;
    const totalCount = meta.total || 0;
    const loading = isMis ? loadingDecks : loadingPublicos;
    const items = isMis ? decks : decksPublicos;

    const switchTab = useCallback((tab) => {
        setActiveTab(tab);
        if (tab === 'explorar' && decksPublicos.length === 0) {
            f.adivina.decks.listarPublicos({
                q: pubDebouncedQ || undefined,
                sort_by: pubSort,
                only_new: pubOnlyNew ? 1 : undefined,
                page: pubPage,
                page_size: pageSize,
            });
        }
    }, [f.adivina, pubDebouncedQ, pubSort, pubOnlyNew, pubPage, pageSize, decksPublicos.length]);

    const openPreview = useCallback((tarjeta) => {
        setPreviewTarget(tarjeta);
        setShowImageModal(true);
    }, []);

    const toggleDeckTarjeta = useCallback((tarjeta) => {
        const exists = (form.tarjeta_ids || []).includes(tarjeta.id);
        const newIds = exists
            ? form.tarjeta_ids.filter(id => id !== tarjeta.id)
            : [...(form.tarjeta_ids || []), tarjeta.id];
        setForm({ ...form, tarjeta_ids: newIds });

        const nextMap = { ...selectedTarjetasMap };
        if (nextMap[tarjeta.id]) delete nextMap[tarjeta.id];
        else nextMap[tarjeta.id] = tarjeta;
        setSelectedTarjetasMap(nextMap);
    }, [form, selectedTarjetasMap]);

    const moveTarjetaUp = useCallback((index) => {
        if (index === 0) return;
        const newIds = [...(form.tarjeta_ids || [])];
        [newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]];
        setForm({ ...form, tarjeta_ids: newIds });
    }, [form]);

    const moveTarjetaDown = useCallback((index) => {
        const ids = form.tarjeta_ids || [];
        if (index === ids.length - 1) return;
        const newIds = [...ids];
        [newIds[index + 1], newIds[index]] = [newIds[index], newIds[index + 1]];
        setForm({ ...form, tarjeta_ids: newIds });
    }, [form]);

    const sortTarjetas = useCallback((type) => {
        const mapped = (form.tarjeta_ids || []).map(id => selectedTarjetasMap[id]).filter(Boolean);
        if (type === 'name_asc') {
            mapped.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
        } else if (type === 'tag') {
            mapped.sort((a, b) => {
                const tagA = a.tags?.[0]?.nombre || '';
                const tagB = b.tags?.[0]?.nombre || '';
                return tagA.localeCompare(tagB) || (a.nombre || '').localeCompare(b.nombre || '');
            });
        } else if (type === 'random') {
            mapped.sort(() => Math.random() - 0.5);
        }
        setForm({ ...form, tarjeta_ids: mapped.map(t => t.id) });
    }, [form, selectedTarjetasMap]);

    const openCreate = useCallback(() => {
        setEditTarget(null);
        setForm({ nombre: '', descripcion: '', tarjeta_ids: [] });
        setSelectedTarjetasMap({});
        setPickerSearch('');
        setPickerTagFilter('');
        setPickerPage(1);
        setShowModal(true);
    }, []);

    const openEdit = useCallback((deck) => {
        setEditTarget(deck);
        f.adivina.decks.tarjetas(deck.id, (tarjetas) => {
            const map = {};
            for (const t of tarjetas) map[t.id] = t;
            setSelectedTarjetasMap(map);
            setForm({
                nombre: deck.nombre || '',
                descripcion: deck.descripcion || '',
                tarjeta_ids: tarjetas.map(t => t.id),
            });
            setPickerSearch('');
            setPickerTagFilter('');
            setPickerPage(1);
            setShowModal(true);
        });
    }, [f.adivina]);

    const handleSave = useCallback(() => {
        if (!form.nombre?.trim()) return;
        if (editTarget) {
            f.adivina.decks.actualizar({ deck_id: editTarget.id, ...form }, () => setShowModal(false));
        } else {
            f.adivina.decks.crear(form, () => setShowModal(false));
        }
    }, [form, editTarget, f.adivina]);

    const handleDelete = useCallback((deck_id) => {
        if (!confirm('¿Eliminar este deck?')) return;
        f.adivina.decks.eliminar(deck_id);
    }, [f.adivina]);

    const handleTogglePublico = useCallback((deck) => {
        f.adivina.decks.publicar(deck.id, !deck.publico);
    }, [f.adivina]);

    const handleDesvincular = useCallback((deck_id) => {
        if (!confirm('¿Desvincular este deck? Perderás acceso a sus actualizaciones.')) return;
        f.adivina.decks.desvincular(deck_id);
    }, [f.adivina]);

    const handleCopiar = useCallback((deck_id) => {
        if (!confirm('¿Copiar este deck como propio? Tendrás una copia independiente que no se actualiza cuando el original cambia.')) return;
        f.adivina.decks.copiar(deck_id);
    }, [f.adivina]);

    const handleImportar = useCallback((deck_id) => {
        f.adivina.decks.importar(deck_id);
    }, [f.adivina]);

    const toggleExpand = useCallback((deck) => {
        if (expandedDeck === deck.id) {
            setExpandedDeck(null);
            return;
        }
        setExpandedDeck(deck.id);
        if (!deckTarjetas[deck.id]) {
            f.adivina.decks.tarjetas(deck.id, (tarjetas) => {
                setDeckTarjetas({ ...deckTarjetas, [deck.id]: tarjetas });
            });
        }
    }, [expandedDeck, deckTarjetas, f.adivina]);

    const orderedSelectedTarjetas = useMemo(
        () => (form.tarjeta_ids || []).map(id => selectedTarjetasMap[id]).filter(Boolean),
        [form.tarjeta_ids, selectedTarjetasMap]
    );

    const openFiltersMenu = useCallback(() => {
        setMenuBarMode('adivina_decks');
        setMenuBarOpen(true);
    }, []);

    return {
        style, navigate,
        decks, decksMeta, decksPublicos, decksPublicosMeta,
        loadingDecks, loadingPublicos, tags,
        activeTab, setActiveTab, switchTab,
        misSearchQ, setMisSearchQ, misDebouncedQ, setMisDebouncedQ,
        misScope, setMisScope, misSort, setMisSort, sortOptionsMis: SORT_OPTIONS_MIS,
        misPage, setMisPage,
        pubSearchQ, setPubSearchQ, pubDebouncedQ, setPubDebouncedQ,
        pubSort, setPubSort, sortOptionsPublic: SORT_OPTIONS_PUBLIC,
        pubOnlyNew, setPubOnlyNew, pubPage, setPubPage,
        pageSize, setPageSize, pageSizeOptions: PAGE_SIZE_OPTIONS,
        isMis, meta, totalPages, currentPage, setCurrentPage, totalCount, loading, items,
        expandedDeck, deckTarjetas, toggleExpand,
        showModal, setShowModal, editTarget, setEditTarget,
        showImageModal, setShowImageModal, previewTarget, setPreviewTarget, openPreview,
        form, setForm,
        pickerSearch, setPickerSearch, pickerDebouncedSearch, setPickerDebouncedSearch,
        pickerTagFilter, setPickerTagFilter,
        pickerPage, setPickerPage,
        pickerData, setPickerData, pickerLoading, setPickerLoading,
        selectedTarjetasMap, setSelectedTarjetasMap,
        orderedSelectedTarjetas,
        toggleDeckTarjeta, moveTarjetaUp, moveTarjetaDown, sortTarjetas,
        openCreate, openEdit,
        handleSave, handleDelete,
        handleTogglePublico, handleDesvincular, handleCopiar, handleImportar,
        openFiltersMenu, getImageUrl,
        setTitulo, setActualPage, setMenuBarMode, setMenuBarOpen,
        f,
    };
};

export const localEffects = () => {
    const ls = localStates();
    const {
        f, setMenuBarMode,
        misSearchQ, setMisDebouncedQ, misDebouncedQ,
        pubSearchQ, setPubDebouncedQ, pubDebouncedQ,
        misScope, misSort, misPage, pageSize, setMisPage,
        pubSort, pubOnlyNew, pubPage, setPubPage,
        activeTab, decksPublicos,
        showModal, pickerSearch, setPickerDebouncedSearch, pickerDebouncedSearch,
        pickerTagFilter, pickerPage, setPickerPage,
        setPickerLoading, setPickerData, tags,
        setTitulo, setActualPage,
    } = ls;

    const fRef = useRef(f);
    useEffect(() => { fRef.current = f; }, [f]);

    useEffect(() => {
        try { localStorage.setItem('adivina_decks_pagesize', String(pageSize)); } catch { /* noop */ }
    }, [pageSize]);

    useEffect(() => {
        const id = setTimeout(() => setMisDebouncedQ((misSearchQ || '').trim()), 250);
        return () => clearTimeout(id);
    }, [misSearchQ]);

    useEffect(() => {
        const id = setTimeout(() => setPubDebouncedQ((pubSearchQ || '').trim()), 250);
        return () => clearTimeout(id);
    }, [pubSearchQ]);

    useEffect(() => { setMisPage(1); }, [misDebouncedQ, misScope, misSort, pageSize]);
    useEffect(() => { setPubPage(1); }, [pubDebouncedQ, pubSort, pubOnlyNew, pageSize]);

    const fetchMis = useCallback(() => {
        fRef.current.adivina.decks.listar({
            q: misDebouncedQ || undefined,
            scope: misScope,
            sort_by: misSort,
            page: misPage,
            page_size: pageSize,
        });
    }, [misDebouncedQ, misScope, misSort, misPage, pageSize]);

    const fetchPub = useCallback(() => {
        fRef.current.adivina.decks.listarPublicos({
            q: pubDebouncedQ || undefined,
            sort_by: pubSort,
            only_new: pubOnlyNew ? 1 : undefined,
            page: pubPage,
            page_size: pageSize,
        });
    }, [pubDebouncedQ, pubSort, pubOnlyNew, pubPage, pageSize]);

    const initialFetchedRef = useRef(false);
    useEffect(() => {
        if (!initialFetchedRef.current) return;
        if (activeTab === 'mis') fetchMis();
        else fetchPub();
    }, [fetchMis, fetchPub, activeTab]);

    useEffect(() => {
        const id = setTimeout(() => setPickerDebouncedSearch((pickerSearch || '').trim()), 250);
        return () => clearTimeout(id);
    }, [pickerSearch]);

    useEffect(() => { setPickerPage(1); }, [pickerDebouncedSearch, pickerTagFilter]);

    useEffect(() => {
        if (!showModal) return;
        setPickerLoading(true);
        const tagName = pickerTagFilter
            ? [tags.find(t => t.id === pickerTagFilter)?.nombre].filter(Boolean)
            : undefined;
        fRef.current.adivina.tarjetas.listarLite({
            q: pickerDebouncedSearch || undefined,
            tags: tagName,
            page: pickerPage,
            page_size: PICKER_PAGE_SIZE,
            sort_by: 'name_asc',
        }, (res) => {
            setPickerData({
                tarjetas: res.tarjetas || [],
                total: res.total || 0,
                pages: res.pages || 1,
            });
            setPickerLoading(false);
        });
    }, [showModal, pickerDebouncedSearch, pickerTagFilter, pickerPage, tags]);

    useEffect(() => {
        const title = 'Decks';
        setTitulo(title);
        setActualPage('adivina_decks');
        document.title = title;
        f.adivina.tags.listar();
        f.adivina.decks.listar({
            scope: 'all',
            sort_by: 'name_asc',
            page: 1,
            page_size: pageSize,
        }, () => { initialFetchedRef.current = true; });
        if (activeTab === 'explorar') {
            f.adivina.decks.listarPublicos({
                sort_by: 'recent',
                page: 1,
                page_size: pageSize,
            });
        }
        try {
            const ps = parseInt(localStorage.getItem('adivina_decks_pagesize') || '', 10);
            if (PAGE_SIZE_OPTIONS.includes(ps)) ls.setPageSize(ps);
        } catch { /* noop */ }
    }, []);

    useEffect(() => {
        setMenuBarMode('adivina_decks');
        return () => {
            setMenuBarMode(null);
        };
    }, []);
};
