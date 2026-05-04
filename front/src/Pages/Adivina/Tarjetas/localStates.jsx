import { useMemo, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStates, createState } from '../../../Hooks/useStates';
import style from './styles/index.module.scss';

const host = window.location.hostname;
const protocol = window.location.protocol;
const port = window.location.port === '5173' ? ':8372' : (window.location.port ? `:${window.location.port}` : '');
const API_BASE = `${protocol}//${host}${port}`;

export const localStates = () => {
    const { s, f } = useStates();
    const navigate = useNavigate();

    const [, setTitulo] = createState(['page', 'title'], '');
    const [, setActualPage] = createState(['page', 'actual'], '');

    const tarjetas = useMemo(() => s.adivina?.tarjetas || [], [s.adivina?.tarjetas]);
    const tags = useMemo(() => s.adivina?.tags || [], [s.adivina?.tags]);
    const isAdmin = useMemo(() => s.usuario?.data?.is_admin, [s.usuario?.data?.is_admin]);
    const currentUserId = useMemo(() => s.usuario?.data?.id, [s.usuario?.data?.id]);
    const loadingTarjetas = useMemo(() => s.loadings?.adivina?.tarjetas || false, [s.loadings?.adivina?.tarjetas]);

    const [searchQ, setSearchQ] = useState('');
    const [selectedTags, setSelectedTags] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [previewTarget, setPreviewTarget] = useState(null);
    const [form, setForm] = useState({ nombre: '', descripcion: '', tags: [] });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [newTagName, setNewTagName] = useState('');

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
        return isAdmin || tarjeta?.creador?.id === currentUserId;
    }, [isAdmin, currentUserId]);

    const toggleTag = useCallback((tagId) => {
        setSelectedTags(prev =>
            prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
        );
    }, []);

    const toggleFormTag = useCallback((tagId) => {
        setForm(prev => ({
            ...prev,
            tags: prev.tags.includes(tagId) ? prev.tags.filter(t => t !== tagId) : [...prev.tags, tagId]
        }));
    }, []);

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
            f.adivina.updateTarjeta({ tarjeta_id: editTarget.id, ...form }, (res) => {
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

    const handleSearch = useCallback(() => {
        f.adivina.getTarjetas({ q: searchQ, tags: selectedTags });
    }, [searchQ, selectedTags, f.adivina]);

    const init = useCallback(() => {
        const title = 'Tarjetas';
        setTitulo(title);
        setActualPage('adivina_tarjetas');
        document.title = title;
        f.adivina.getTarjetas();
        f.adivina.getTags();
    }, []);
    return {
        style, tarjetas, tags, loadingTarjetas,
        isAdmin,
        searchQ, setSearchQ,
        selectedTags, toggleTag,
        showModal, setShowModal,
        showImageModal, setShowImageModal,
        editTarget, previewTarget,
        form, setForm,
        imagePreview,
        newTagName, setNewTagName,
        getImageUrl, canEdit,
        toggleFormTag,
        openCreate, openEdit, handleImageChange, openPreview,
        handleSave, handleDelete, handleCreateTag, handleSearch,
        navigate, init,
    }
}

export const localEffects = () => {
    const { init } = localStates();
    useEffect(() => { init(); }, []);
};
