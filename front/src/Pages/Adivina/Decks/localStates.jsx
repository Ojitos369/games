import { useMemo, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStates, createState } from '../../../Hooks/useStates';
import style from './styles/index.module.scss';

export const localStates = () => {
    const { s, f } = useStates();
    const navigate = useNavigate();

    const [, setTitulo] = createState(['page', 'title'], '');
    const [, setActualPage] = createState(['page', 'actual'], '');

    const decks = useMemo(() => s.adivina?.decks || [], [s.adivina?.decks]);
    const allTarjetas = useMemo(() => s.adivina?.tarjetas || [], [s.adivina?.tarjetas]);
    const tags = useMemo(() => s.adivina?.tags || [], [s.adivina?.tags]);
    const loadingDecks = useMemo(() => s.loadings?.adivina?.decks || false, [s.loadings?.adivina?.decks]);

    const [expandedDeck, setExpandedDeck] = useState(null);
    const [deckTarjetas, setDeckTarjetas] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [previewTarget, setPreviewTarget] = useState(null);
    const [form, setForm] = useState({ nombre: '', descripcion: '', tarjeta_ids: [] });
    const [tarjetaSearch, setTarjetaSearch] = useState('');
    const [tarjetaTagFilter, setTarjetaTagFilter] = useState('');

    const openPreview = useCallback((tarjeta) => {
        setPreviewTarget(tarjeta);
        setShowImageModal(true);
    }, []);

    const filteredTarjetas = useMemo(() => {
        let list = allTarjetas;
        if (tarjetaSearch.trim()) {
            const q = tarjetaSearch.toLowerCase();
            list = list.filter(t => t.nombre?.toLowerCase().includes(q));
        }
        if (tarjetaTagFilter) {
            list = list.filter(t => t.tags?.some(tg => tg.id === tarjetaTagFilter));
        }
        return list;
    }, [allTarjetas, tarjetaSearch, tarjetaTagFilter]);

    const toggleDeckTarjeta = useCallback((tarjeta_id) => {
        setForm(prev => ({
            ...prev,
            tarjeta_ids: prev.tarjeta_ids.includes(tarjeta_id)
                ? prev.tarjeta_ids.filter(id => id !== tarjeta_id)
                : [...prev.tarjeta_ids, tarjeta_id]
        }));
    }, []);

    const openCreate = useCallback(() => {
        setEditTarget(null);
        setForm({ nombre: '', descripcion: '', tarjeta_ids: [] });
        setShowModal(true);
    }, []);

    const openEdit = useCallback((deck) => {
        setEditTarget(deck);
        f.adivina.getDeckTarjetas(deck.id, (tarjetas) => {
            setForm({
                nombre: deck.nombre || '',
                descripcion: deck.descripcion || '',
                tarjeta_ids: tarjetas.map(t => t.id),
            });
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
        setTitulo('Decks');
        setActualPage('adivina_decks');
        f.adivina.getDecks();
        f.adivina.getTarjetas();
        f.adivina.getTags();
    }, []);
    return {
        style, decks, loadingDecks,
        tags, filteredTarjetas,
        expandedDeck, deckTarjetas, toggleExpand,
        showModal, setShowModal, editTarget,
        showImageModal, setShowImageModal,
        previewTarget, openPreview,
        form, setForm,
        tarjetaSearch, setTarjetaSearch,
        tarjetaTagFilter, setTarjetaTagFilter,
        toggleDeckTarjeta, openCreate, openEdit,
        handleSave, handleDelete,
        navigate, init,
    }
}

export const localEffects = () => {
    const { init } = localStates();
    useEffect(() => { init(); }, []);
};
