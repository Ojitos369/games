import { useMemo, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useStates } from "../../Hooks/useStates";
import style from './styles/index.module.scss';

const API_BASE = 'http://localhost:8369';

export const localStates = () => {
    const { s, f } = useStates();
    const juegos = useMemo(() => s.catalog?.juegos || [], [s.catalog?.juegos]);
    const categorias = useMemo(() => s.catalog?.categorias || [], [s.catalog?.categorias]);
    const [search, setSearch] = useState('');
    const location = useLocation();
    const activeCategory = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get('cat') || null;
    }, [location.search]);
    
    const showFavs = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get('favs') === '1';
    }, [location.search]);

    const destacado = useMemo(() => {
        return juegos.find(j => j.destacado) || juegos[0] || null;
    }, [juegos]);

    const filteredJuegos = useMemo(() => {
        let filtered = juegos;
        if (activeCategory) {
            filtered = filtered.filter(j =>
                j.categorias?.some(c => c.id === activeCategory)
            );
        }
        if (showFavs) {
            filtered = filtered.filter(j => j.es_favorito);
        }
        if (search.trim()) {
            const term = search.toLowerCase();
            filtered = filtered.filter(j =>
                j.nombre?.toLowerCase().includes(term)
            );
        }
        return filtered;
    }, [juegos, activeCategory, search, showFavs]);

    const getPortada = (juego) => {
        if (!juego?.imagenes?.length) return null;
        const portada = juego.imagenes.find(i => i.es_portada);
        const img = portada || juego.imagenes[0];
        if (img?.url) return `${API_BASE}${img.url}`;
        return null;
    };

    const getStars = (cal) => {
        if (!cal) return '';
        const full = Math.floor(cal / 2);
        const half = (cal / 2) % 1 >= 0.5;
        return '★'.repeat(full) + (half ? '½' : '');
    };

    const getRatingClass = (cal) => {
        if (cal >= 8.5) return 'high';
        if (cal >= 6) return 'mid';
        return 'low';
    };

    const getPlaceholderColor = (index) => {
        return `placeholderColor${index % 6}`;
    };

    const getInitials = (nombre) => {
        if (!nombre) return '';
        return nombre.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
    };

    return {
        style, juegos, categorias, search, setSearch,
        activeCategory, 
        destacado, filteredJuegos,
        getPortada, getStars, getRatingClass, getPlaceholderColor, getInitials,
        f, toggleFavorito: f.catalog.toggleFavorito
    };
};

export const localEffects = () => {
    const { f } = useStates();
    useEffect(() => {
        f.catalog.getJuegos();
        f.catalog.getCategorias();
    }, []);
};
