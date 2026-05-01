import { useMemo, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStates, createState } from '../../../Hooks/useStates';
import style from './styles/index.module.scss';

export const localStates = () => {
    const { s, f } = useStates();
    const navigate = useNavigate();

    const [, setTitulo] = createState(['page', 'title'], '');
    const [, setActualPage] = createState(['page', 'actual'], '');

    const salas = useMemo(() => s.adivina?.salas || [], [s.adivina?.salas]);
    const loadingSalas = useMemo(() => s.loadings?.adivina?.salas || false, [s.loadings?.adivina?.salas]);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [createForm, setCreateForm] = useState({ nombre: '', max_jugadores: 8, visibilidad: 'publica' });

    const init = useCallback(() => {
        setTitulo('Adivina el Personaje');
        setActualPage('adivina');
        f.adivina.getSalas();
    }, []);

    const handleJoin = useCallback(() => {
        const code = joinCode.trim().toUpperCase();
        if (!code) return;
        navigate(`/adivina/sala/${code}`);
    }, [joinCode, navigate]);

    const handleJoinSala = useCallback((codigo) => {
        navigate(`/adivina/sala/${codigo}`);
    }, [navigate]);

    const handleCreateSala = useCallback(() => {
        f.adivina.createSala(createForm, (data) => {
            setShowCreateModal(false);
            navigate(`/adivina/sala/${data.codigo}`);
        });
    }, [createForm, f.adivina, navigate]);

    const refreshSalas = useCallback(() => {
        f.adivina.getSalas();
    }, [f.adivina]);

    return {
        style, salas, loadingSalas,
        showCreateModal, setShowCreateModal,
        joinCode, setJoinCode,
        createForm, setCreateForm,
        init, handleJoin, handleJoinSala, handleCreateSala, refreshSalas,
    };
};

export const localEffects = () => {
    const { init } = localStates();
    useEffect(() => { init(); }, []);
};
