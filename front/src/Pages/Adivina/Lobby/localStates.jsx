import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStates, createState } from '../../../Hooks/useStates';
import style from './styles/index.module.scss';

export const localStates = () => {
    const { s, f } = useStates();
    const navigate = useNavigate();

    const [, setTitulo] = createState(['page', 'title'], '');
    const [, setActualPage] = createState(['page', 'actual'], '');

    const salas = s.adivina?.salas || [];
    const loadingSalas = s.loadings?.adivina?.salas || false;

    const [showCreateModal, setShowCreateModal] = createState(['adivina', 'lobbyUI', 'showCreate'], false);
    const [joinCode, setJoinCode] = createState(['adivina', 'lobbyUI', 'joinCode'], '');
    const [createForm, setCreateForm] = createState(
        ['adivina', 'lobbyUI', 'createForm'],
        { nombre: '', max_jugadores: 8, visibilidad: 'publica' }
    );

    const init = useCallback(() => {
        const title = 'Adivina la Tarjeta';
        setTitulo(title);
        setActualPage('adivina');
        document.title = title;
        f.adivina.salas.listar();
    }, []);

    const handleJoin = useCallback(() => {
        const code = (joinCode || '').trim().toUpperCase();
        if (!code) return;
        navigate(`/adivina/sala/${code}`);
    }, [joinCode, navigate]);

    const handleJoinSala = useCallback((codigo) => {
        navigate(`/adivina/sala/${codigo}`);
    }, [navigate]);

    const handleCreateSala = useCallback(() => {
        f.adivina.salas.crear(createForm, (data) => {
            setShowCreateModal(false);
            navigate(`/adivina/sala/${data.codigo}`);
        });
    }, [createForm, f.adivina, navigate]);

    const refreshSalas = useCallback(() => {
        f.adivina.salas.listar();
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
