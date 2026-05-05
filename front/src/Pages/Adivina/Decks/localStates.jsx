import { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStates, createState } from '../../../Hooks/useStates';
import style from './styles/index.module.scss';

const PAGE_SIZE_OPTIONS = [12, 24, 48, 96];
const DEFAULT_PAGE_SIZE = 24;

const SORT_OPTIONS_MIS = [
    { id: 'name_asc', label: 'Nombre A→Z' },
    { id: 'name_desc', label: 'Nombre Z→A' },
    { id: 'recent', label: 'Más recientes' },
    { id: 'oldest', label: 'Más antiguos' },
    { id: 'biggest', label: 'Más tarjetas' },
    { id: 'smallest', label: 'Menos tarjetas' },
];

const SORT_OPTIONS_PUBLIC = [
    { id: 'recent', label: 'Más recientes' },
    { id: 'popular', label: 'Más populares' },
    { id: 'biggest', label: 'Más tarjetas' },
    { id: 'name_asc', label: 'Nombre A→Z' },
    { id: 'name_desc', label: 'Nombre Z→A' },
    { id: 'oldest', label: 'Más antiguos' },
];

const PICKER_PAGE_SIZE = 30;

export const localStates = () => {
    const { s, f } = useStates();
    const navigate = useNavigate();

    const [, setTitulo] = createState(['page', 'title'], '');
    const [, setActualPage] = createState(['page', 'actual'], '');

    const decks = useMemo(() => s.adivina?.decks || [], [s.adivina?.decks]);
    const decksMeta = useMemo(() => s.adivina?.decksMeta || {
        total: 0, page: 1, page_size: DEFAULT_PAGE_SIZE, pages: 1,
        scope_counts: { all: 0, owned: 0, imported: 0 }
    }, [s.adivina?.decksMeta]);

    const decksPublicos = useMemo(() => s.adivina?.decksPublicos || [], [s.adivina?.decksPublicos]);
    const decksPublicosMeta = useMemo(() => s.adivina?.decksPublicosMeta || {
        total: 0, page: 1, page_size: DEFAULT_PAGE_SIZE, pages: 1
    }, [s.adivina?.decksPublicosMeta]);

    const tags = useMemo(() => s.adivina?.tags || [], [s.adivina?.tags]);
    const loadingDecks = useMemo(() => s.loadings?.adivina?.decks || false, [s.loadings?.adivina?.decks]);
    const loadingPublicos = useMemo(() => s.loadings?.adivina?.decksPublicos || false, [s.loadings?.adivina?.decksPublicos]);

    const [activeTab, setActiveTab] = useState(() => {
        try { return localStorage.getItem('adivina_decks_tab') || 'mis'; } catch { return 'mis'; }
    });
    const [misSearchQ, setMisSearchQ] = useState('');
    const [misDebouncedQ, setMisDebouncedQ] = useState('');
    const [misScope, setMisScope] = useState('all');
    const [misSort, setMisSort] = useState('name_asc');
    const [misPage, setMisPage] = useState(1);

    const [pubSearchQ, setPubSearchQ] = useState('');
    const [pubDebouncedQ, setPubDebouncedQ] = useState('');
    const [pubSort, setPubSort] = useState('recent');
    const [pubOnlyNew, setPubOnlyNew] = useState(false);
    const [pubPage, setPubPage] = useState(1);

    const [pageSize, setPageSize] = useState(() => {
        try {
            const v = parseInt(localStorage.getItem('adivina_decks_pagesize') || '', 10);
            return PAGE_SIZE_OPTIONS.includes(v) ? v : DEFAULT_PAGE_SIZE;
        } catch { return DEFAULT_PAGE_SIZE; }
    });

    const [filtersOpen, setFiltersOpen] = useState(false);
    const [expandedDeck, setExpandedDeck] = useState(null);
    const [deckTarjetas, setDeckTarjetas] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [previewTarget, setPreviewTarget] = useState(null);
    const [form, setForm] = useState({ nombre: '', descripcion: '', tarjeta_ids: [] });

    const [pickerSearch, setPickerSearch] = useState('');
    const [pickerDebouncedSearch, setPickerDebouncedSearch] = useState('');
    const [pickerTagFilter, setPickerTagFilter] = useState('');
    const [pickerPage, setPickerPage] = useState(1);
    const [pickerData, setPickerData] = useState({ tarjetas: [], total: 0, pages: 1 });
    const [pickerLoading, setPickerLoading] = useState(false);
    const [selectedTarjetasMap, setSelectedTarjetasMap] = useState({});

    useEffect(() => {
        try { localStorage.setItem('adivina_decks_tab', activeTab); } catch { /* noop */ }
    }, [activeTab]);
    useEffect(() => {
        try { localStorage.setItem('adivina_decks_pagesize', String(pageSize)); } catch { /* noop */ }
    }, [pageSize]);

    useEffect(() => {
        const id = setTimeout(() => setMisDebouncedQ(misSearchQ.trim()), 250);
        return () => clearTimeout(id);
    }, [misSearchQ]);
    useEffect(() => {
        const id = setTimeout(() => setPubDebouncedQ(pubSearchQ.trim()), 250);
        return () => clearTimeout(id);
    }, [pubSearchQ]);

    useEffect(() => { setMisPage(1); }, [misDebouncedQ, misScope, misSort, pageSize]);
    useEffect(() => { setPubPage(1); }, [pubDebouncedQ, pubSort, pubOnlyNew, pageSize]);

    const fetchMis = useCallback(() => {
        f.adivina.getDecks({
            q: misDebouncedQ || undefined,
            scope: misScope,
            sort_by: misSort,
            page: misPage,
            page_size: pageSize,
        });
    }, [f.adivina, misDebouncedQ, misScope, misSort, misPage, pageSize]);

    const fetchPub = useCallback(() => {
        f.adivina.getDecksPublicos({
            q: pubDebouncedQ || undefined,
            sort_by: pubSort,
            only_new: pubOnlyNew ? 1 : undefined,
            page: pubPage,
            page_size: pageSize,
        });
    }, [f.adivina, pubDebouncedQ, pubSort, pubOnlyNew, pubPage, pageSize]);

    const initialFetchedRef = useRef(false);
    useEffect(() => {
        if (!initialFetchedRef.current) return;
        if (activeTab === 'mis') fetchMis();
        else fetchPub();
    }, [fetchMis, fetchPub, activeTab]);

    useEffect(() => {
        const id = setTimeout(() => setPickerDebouncedSearch(pickerSearch.trim()), 250);
        return () => clearTimeout(id);
    }, [pickerSearch]);
    useEffect(() => { setPickerPage(1); }, [pickerDebouncedSearch, pickerTagFilter]);

    useEffect(() => {
        if (!showModal) return;
        setPickerLoading(true);
        const tagName = pickerTagFilter
            ? [tags.find(t => t.id === pickerTagFilter)?.nombre].filter(Boolean)
            : undefined;
        f.adivina.getTarjetasLite({
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
    }, [showModal, pickerDebouncedSearch, pickerTagFilter, pickerPage, tags, f.adivina]);

    const switchTab = useCallback((tab) => {
        setActiveTab(tab);
        if (tab === 'explorar' && decksPublicos.length === 0) {
            f.adivina.getDecksPublicos({
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
        setForm(prev => {
            const exists = prev.tarjeta_ids.includes(tarjeta.id);
            if (exists) {
                return { ...prev, tarjeta_ids: prev.tarjeta_ids.filter(id => id !== tarjeta.id) };
            }
            return { ...prev, tarjeta_ids: [...prev.tarjeta_ids, tarjeta.id] };
        });
        setSelectedTarjetasMap(prev => {
            const next = { ...prev };
            if (next[tarjeta.id]) delete next[tarjeta.id];
            else next[tarjeta.id] = tarjeta;
            return next;
        });
    }, []);

    const moveTarjetaUp = useCallback((index) => {
        setForm(prev => {
            if (index === 0) return prev;
            const newIds = [...prev.tarjeta_ids];
            [newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]];
            return { ...prev, tarjeta_ids: newIds };
        });
    }, []);

    const moveTarjetaDown = useCallback((index) => {
        setForm(prev => {
            if (index === prev.tarjeta_ids.length - 1) return prev;
            const newIds = [...prev.tarjeta_ids];
            [newIds[index + 1], newIds[index]] = [newIds[index], newIds[index + 1]];
            return { ...prev, tarjeta_ids: newIds };
        });
    }, []);

    const sortTarjetas = useCallback((type) => {
        setForm(prev => {
            const mapped = prev.tarjeta_ids.map(id => selectedTarjetasMap[id]).filter(Boolean);
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
            return { ...prev, tarjeta_ids: mapped.map(t => t.id) };
        });
    }, [selectedTarjetasMap]);

    const openCreate = useCallback(() => {
        setEditTarget(null);
        setForm({ nombre: '', descripcion: '', tarjeta_ids: [] });
        setSelectedTarjetasMap({});
        setPickerSearch(''); setPickerTagFilter(''); setPickerPage(1);
        setShowModal(true);
    }, []);

    const openEdit = useCallback((deck) => {
        setEditTarget(deck);
        f.adivina.getDeckTarjetas(deck.id, (tarjetas) => {
            const map = {};
            for (const t of tarjetas) map[t.id] = t;
            setSelectedTarjetasMap(map);
            setForm({
                nombre: deck.nombre || '',
                descripcion: deck.descripcion || '',
                tarjeta_ids: tarjetas.map(t => t.id),
            });
            setPickerSearch(''); setPickerTagFilter(''); setPickerPage(1);
            setShowModal(true);
        });
    }, [f.adivina]);

    const handleSave = useCallback(() => {
        if (!form.nombre.trim()) return;
        if (editTarget) {
            f.adivina.updateDeck({ deck_id: editTarget.id, ...form }, () => setShowModal(false));
        } else {
            f.adivina.createDeck(form, () => setShowModal(false));
        }
    }, [form, editTarget, f.adivina]);

    const handleDelete = useCallback((deck_id) => {
        if (!confirm('¿Eliminar este deck?')) return;
        f.adivina.deleteDeck(deck_id);
    }, [f.adivina]);

    const handleTogglePublico = useCallback((deck) => {
        f.adivina.publicarDeck(deck.id, !deck.publico);
    }, [f.adivina]);

    const handleDesvincular = useCallback((deck_id) => {
        if (!confirm('¿Desvincular este deck? Perderás acceso a sus actualizaciones.')) return;
        f.adivina.desvincularDeck(deck_id);
    }, [f.adivina]);

    const handleCopiar = useCallback((deck_id) => {
        if (!confirm('¿Copiar este deck como propio? Tendrás una copia independiente que no se actualiza cuando el original cambia.')) return;
        f.adivina.copiarDeck(deck_id);
    }, [f.adivina]);

    const handleImportar = useCallback((deck_id) => {
        f.adivina.importarDeck(deck_id);
    }, [f.adivina]);

    const toggleExpand = useCallback((deck) => {
        if (expandedDeck === deck.id) {
            setExpandedDeck(null);
            return;
        }
        setExpandedDeck(deck.id);
        if (!deckTarjetas[deck.id]) {
            f.adivina.getDeckTarjetas(deck.id, (tarjetas) => {
                setDeckTarjetas(prev => ({ ...prev, [deck.id]: tarjetas }));
            });
        }
    }, [expandedDeck, deckTarjetas, f.adivina]);

    const init = useCallback(() => {
        const title = 'Decks';
        setTitulo(title);
        setActualPage('adivina_decks');
        document.title = title;
        f.adivina.getTags();
        f.adivina.getDecks({
            scope: 'all',
            sort_by: 'name_asc',
            page: 1,
            page_size: pageSize,
        }, () => { initialFetchedRef.current = true; });
        if (activeTab === 'explorar') {
            f.adivina.getDecksPublicos({
                sort_by: 'recent',
                page: 1,
                page_size: pageSize,
            });
        }
    }, []);

    const orderedSelectedTarjetas = useMemo(() =>
        form.tarjeta_ids.map(id => selectedTarjetasMap[id]).filter(Boolean),
    [form.tarjeta_ids, selectedTarjetasMap]);

    return {
        style, navigate,
        decks, decksMeta, decksPublicos, decksPublicosMeta,
        loadingDecks, loadingPublicos,
        tags,
        activeTab, switchTab,
        misSearchQ, setMisSearchQ,
        misScope, setMisScope,
        misSort, setMisSort, sortOptionsMis: SORT_OPTIONS_MIS,
        misPage, setMisPage,
        pubSearchQ, setPubSearchQ,
        pubSort, setPubSort, sortOptionsPublic: SORT_OPTIONS_PUBLIC,
        pubOnlyNew, setPubOnlyNew,
        pubPage, setPubPage,
        pageSize, setPageSize, pageSizeOptions: PAGE_SIZE_OPTIONS,
        filtersOpen, setFiltersOpen,
        expandedDeck, deckTarjetas, toggleExpand,
        showModal, setShowModal, editTarget,
        showImageModal, setShowImageModal,
        previewTarget, openPreview,
        form, setForm,
        pickerSearch, setPickerSearch,
        pickerTagFilter, setPickerTagFilter,
        pickerPage, setPickerPage,
        pickerData, pickerLoading,
        orderedSelectedTarjetas,
        toggleDeckTarjeta, moveTarjetaUp, moveTarjetaDown, sortTarjetas,
        openCreate, openEdit,
        handleSave, handleDelete,
        handleTogglePublico, handleDesvincular, handleCopiar, handleImportar,
        init,
    };
};

export const localEffects = () => {
    const { init } = localStates();
    useEffect(() => { init(); }, []);
};
