import { useMemo, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStates, createState } from "../../Hooks/useStates";
import style from './styles/index.module.scss';
import { showDate } from "../../Core/helper";

const host = window.location.hostname;
const protocol = window.location.protocol;
const port = window.location.port === '5173' ? ':8372' : (window.location.port ? `:${window.location.port}` : '');
const API_BASE = `${protocol}//${host}${port}`;

export const localStates = () => {
    const { f, s } = useStates();
    const { id } = useParams();
    const navigate = useNavigate();

    const [juego, setJuego] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState(0);
    const [comentario, setComentario] = useState('');
    const [sendingRating, setSendingRating] = useState(false);
    const [, setActualPage] = createState(['page', 'actual'], '');

    const getJuego = async () => {
        setLoading(true);
        try {
            const res = await f.catalog.getJuego({ juego_id: id });
            if (res?.juego) {
                setJuego(res.juego);
                if (res.juego.mi_calificacion) {
                    setRating(res.juego.mi_calificacion.calificacion || 0);
                    setComentario(res.juego.mi_calificacion.comentario || '');
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) getJuego();
    }, [id]);

    const handleRating = async () => {
        if (rating < 1 || rating > 10) return;
        setSendingRating(true);
        try {
            await f.catalog.postCalificacion({
                juego_id: id,
                calificacion: rating,
                comentario
            });
            f.general.notificacion({
                message: "Calificación guardada correctamente",
                title: "Éxito",
                mode: "success"
            });
            getJuego(); // Refresh to get updated average
        } catch (e) {
            console.error(e);
        } finally {
            setSendingRating(false);
        }
    };

    const getStars = (calif) => {
        if (!calif) return '☆☆☆☆☆';
        const fullStars = Math.floor(calif / 2);
        const hasHalfStar = (calif / 2) % 1 >= 0.5;
        let stars = '';
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) stars += '★';
            else if (i === fullStars && hasHalfStar) stars += '½';
            else stars += '☆';
        }
        return stars;
    };

    const getPortada = (j) => {
        if (!j?.imagenes?.length) return null;
        const portada = j.imagenes.find(img => img.es_portada);
        const img = portada || j.imagenes[0];
        if (img?.url) return `${API_BASE}${img.url}`;
        return null;
    };

    return {
        style, juego, loading, rating, setRating, comentario, setComentario,
        handleRating, sendingRating, getStars, getPortada, navigate, showDate,
        setActualPage,
        toggleFavorito: () => f.catalog.toggleFavorito(id).then(getJuego)
    }
}

export const localEffects = () => {
    const { setActualPage } = localStates();
    useEffect(() => {
        setActualPage('game_detail');
    }, []);
}
