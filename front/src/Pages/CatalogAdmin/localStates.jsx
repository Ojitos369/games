import { useMemo, useState, useEffect, useRef } from "react";
import { useStates } from "../../Hooks/useStates";
import style from './styles/index.module.scss';

const API_BASE = 'http://localhost:8369';

export const localStates = () => {
    const { s, f } = useStates();
    const juegos = useMemo(() => s.catalog?.juegos || [], [s.catalog?.juegos]);
    const categorias = useMemo(() => s.catalog?.categorias || [], [s.catalog?.categorias]);
    const isAdmin = useMemo(() => s.usuario?.data?.is_admin, [s.usuario?.data?.is_admin]);

    const [activeTab, setActiveTab] = useState('juegos');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Game form
    const [formNombre, setFormNombre] = useState('');
    const [formDescripcion, setFormDescripcion] = useState('');
    const [formJugadoresMin, setFormJugadoresMin] = useState(1);
    const [formJugadoresMax, setFormJugadoresMax] = useState(1);
    const [formUrl, setFormUrl] = useState('');
    const [formCalificacion, setFormCalificacion] = useState(0);
    const [formDestacado, setFormDestacado] = useState(false);
    const [formEtiqueta, setFormEtiqueta] = useState('');
    const [formCategorias, setFormCategorias] = useState([]);

    // Category form
    const [catNombre, setCatNombre] = useState('');

    const fileInputRef = useRef(null);

    const resetForm = () => {
        setFormNombre('');
        setFormDescripcion('');
        setFormJugadoresMin(1);
        setFormJugadoresMax(1);
        setFormUrl('');
        setFormCalificacion(0);
        setFormDestacado(false);
        setFormEtiqueta('');
        setFormCategorias([]);
        setCatNombre('');
        setEditingItem(null);
    };

    const openCreateModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        if (activeTab === 'juegos') {
            setFormNombre(item.nombre || '');
            setFormDescripcion(item.descripcion || '');
            setFormJugadoresMin(item.jugadores_min || 1);
            setFormJugadoresMax(item.jugadores_max || 1);
            setFormUrl(item.url || '');
            setFormCalificacion(item.calificacion || 0);
            setFormDestacado(item.destacado || false);
            setFormEtiqueta(item.etiqueta || '');
            setFormCategorias(item.categorias?.map(c => c.id) || []);
        } else {
            setCatNombre(item.nombre || '');
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        resetForm();
    };

    const toggleCategoria = (catId) => {
        if (formCategorias.includes(catId)) {
            setFormCategorias(formCategorias.filter(id => id !== catId));
        } else {
            setFormCategorias([...formCategorias, catId]);
        }
    };

    const saveJuego = () => {
        const data = {
            nombre: formNombre,
            descripcion: formDescripcion,
            jugadores_min: parseInt(formJugadoresMin),
            jugadores_max: parseInt(formJugadoresMax),
            url: formUrl,
            calificacion: parseFloat(formCalificacion),
            destacado: formDestacado,
            etiqueta: formEtiqueta,
            categorias: formCategorias
        };

        if (editingItem) {
            data.juego_id = editingItem.id;
            f.catalog.updateJuego(data, () => closeModal());
        } else {
            f.catalog.createJuego(data, () => closeModal());
        }
    };

    const saveCategoria = () => {
        const data = { nombre: catNombre };
        if (editingItem) {
            data.categoria_id = editingItem.id;
            f.catalog.updateCategoria(data, () => closeModal());
        } else {
            f.catalog.createCategoria(data, () => closeModal());
        }
    };

    const deleteJuego = (id) => {
        if (confirm('¿Eliminar este juego?')) {
            f.catalog.deleteJuego(id);
        }
    };

    const deleteCategoria = (id) => {
        if (confirm('¿Eliminar esta categoría?')) {
            f.catalog.deleteCategoria(id);
        }
    };

    const handleImageUpload = (juego, e) => {
        const file = e.target.files[0];
        if (!file) return;
        f.catalog.uploadImage(juego.id, file, { tipo: 'screenshot', es_portada: juego.imagenes?.length === 0 });
    };

    const deleteImagen = (imgId) => {
        if (confirm('¿Eliminar esta imagen?')) {
            f.catalog.deleteImagen(imgId);
        }
    };

    const getImageUrl = (juego, img) => {
        return `${API_BASE}/media/images/games/${juego.id}/${img.nombre}`;
    };

    return {
        style, juegos, categorias, isAdmin,
        activeTab, setActiveTab,
        showModal, setShowModal,
        editingItem,
        // Game form
        formNombre, setFormNombre,
        formDescripcion, setFormDescripcion,
        formJugadoresMin, setFormJugadoresMin,
        formJugadoresMax, setFormJugadoresMax,
        formUrl, setFormUrl,
        formCalificacion, setFormCalificacion,
        formDestacado, setFormDestacado,
        formEtiqueta, setFormEtiqueta,
        formCategorias, toggleCategoria,
        // Cat form
        catNombre, setCatNombre,
        // Actions
        openCreateModal, openEditModal, closeModal,
        saveJuego, saveCategoria,
        deleteJuego, deleteCategoria,
        handleImageUpload, deleteImagen, getImageUrl,
        fileInputRef, f
    };
};

export const localEffects = () => {
    const { f } = useStates();
    useEffect(() => {
        f.catalog.getJuegos();
        f.catalog.getCategorias();
    }, []);
};
