import { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStates, createState } from '../../../Hooks/useStates';
import style from './styles/index.module.scss';

const host = window.location.hostname;
const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const httpProtocol = window.location.protocol;
const WS_BASE = `${protocol}://${host}:8372/api/games/adivina/ws`;
const API_BASE = `${httpProtocol}//${host}:8372`;

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
}

export const localStates = () => {
    const { s, f } = useStates();
    const { codigo } = useParams();
    const navigate = useNavigate();

    const [, setTitulo] = createState(['page', 'title'], '');

    // Refs para valores que no deben causar re-creación de callbacks
    const fRef = useRef(f);
    const userIdRef = useRef(s.usuario?.data?.id);
    const tokenRef = useRef(getCookie('gamestka') || '');
    const navigateRef = useRef(navigate);
    const codigoRef = useRef(codigo);

    useEffect(() => { fRef.current = f; }, [f]);
    useEffect(() => { userIdRef.current = s.usuario?.data?.id; }, [s.usuario?.data?.id]);
    useEffect(() => { tokenRef.current = getCookie('gamestka') || ''; }, []);
    useEffect(() => { navigateRef.current = navigate; }, [navigate]);
    useEffect(() => { codigoRef.current = codigo; }, [codigo]);

    const socket = useRef(null);
    const reconnectTimeout = useRef(null);
    const peerConnections = useRef({});
    const localStream = useRef(null);
    const iceCandidatesQueue = useRef({});
    const isCleaningUp = useRef(false);

    const [connected, setConnected] = useState(false);
    const [gameState, setGameState] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const [hearingEnabled, setHearingEnabled] = useState(true);
    const [voiceStates, setVoiceStates] = useState({});

    const [talkingStates, setTalkingStates] = useState({});
    const audioContexts = useRef({});
    const analysers = useRef({});
    const animationFrames = useRef({});

    const selectMode = useMemo(() => gameState?.seleccion?.modo || 'host', [gameState?.seleccion?.modo]);
    const [selectedTarjetas, setSelectedTarjetas] = useState([]);
    const [voteSelections, setVoteSelections] = useState([]);

    const [preguntaTexto, setPreguntaTexto] = useState('');
    const [preguntaTarget, setPreguntaTarget] = useState('');
    const [respuestaValue, setRespuestaValue] = useState('');
    const [showAdivinar, setShowAdivinar] = useState(false);
    const [adivinarTarget, setAdivinarTarget] = useState('');
    const [adivinarNombre, setAdivinarNombre] = useState('');
    const [guessResult, setGuessResult] = useState(null);
    const [gameOverData, setGameOverData] = useState(null);

    // Refs para valores de estado usados en callbacks estables (evitar stale closures)
    const chatInputRef = useRef('');
    useEffect(() => { chatInputRef.current = chatInput; }, [chatInput]);
    const voteSelectionsRef = useRef([]);
    useEffect(() => { voteSelectionsRef.current = voteSelections; }, [voteSelections]);
    const preguntaTextoRef = useRef('');
    useEffect(() => { preguntaTextoRef.current = preguntaTexto; }, [preguntaTexto]);
    const preguntaTargetRef = useRef('');
    useEffect(() => { preguntaTargetRef.current = preguntaTarget; }, [preguntaTarget]);
    const adivinarTargetRef = useRef('');
    useEffect(() => { adivinarTargetRef.current = adivinarTarget; }, [adivinarTarget]);
    const adivinarNombreRef = useRef('');
    useEffect(() => { adivinarNombreRef.current = adivinarNombre; }, [adivinarNombre]);
    const gameStateRef = useRef(null);
    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

    const tarjetas = useMemo(() => s.adivina?.tarjetas || [], [s.adivina?.tarjetas]);
    const decks = useMemo(() => s.adivina?.decks || [], [s.adivina?.decks]);
    const tags = useMemo(() => s.adivina?.tags || [], [s.adivina?.tags]);
    const userId = useMemo(() => s.usuario?.data?.id, [s.usuario?.data?.id]);
    const isAdmin = useMemo(() => s.usuario?.data?.is_admin, [s.usuario?.data?.is_admin]);

    const isHost = useMemo(() => {
        if (!gameState || !userId) return false;
        return gameState.creador_id === userId;
    }, [gameState, userId]);

    const myPlayer = useMemo(() => {
        if (!gameState || !userId) return null;
        return gameState.jugadores?.[userId] || null;
    }, [gameState, userId]);

    const activePlayers = useMemo(() => {
        if (!gameState?.jugadores) return [];
        return Object.values(gameState.jugadores).filter(p => !p.eliminado);
    }, [gameState]);

    const isMyTurn = useMemo(() => {
        if (!gameState || !userId) return false;
        return gameState.turno_actual === userId && gameState.estado === 'jugando';
    }, [gameState, userId]);

    // WS sender — estable, usa ref del socket
    const sendWs = useRef((msg) => {
        if (socket.current?.readyState === WebSocket.OPEN) {
            socket.current.send(JSON.stringify(msg));
        }
    }).current;

    // Voice signal handler — usa refs para evitar recrear
    const handleVoiceSignal = useRef(async (from, signal) => {
        let pc = peerConnections.current[from];

        if (signal.type === 'offer') {
            if (!pc) {
                pc = new RTCPeerConnection({
                    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
                });
                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        sendWs({ type: 'voice_signal', to: from, signal: { type: 'ice', candidate: event.candidate } });
                    }
                };
                pc.ontrack = (event) => {
                    const audio = document.getElementById(`audio-${from}`);
                    if (audio && event.streams[0]) {
                        audio.srcObject = event.streams[0];
                        audio.muted = !hearingEnabledRef.current;
                        setupAudioAnalysis(from, event.streams[0]);
                    }
                };
                if (localStream.current) {
                    localStream.current.getTracks().forEach(track => pc.addTrack(track, localStream.current));
                }
                peerConnections.current[from] = pc;
            }
            await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendWs({ type: 'voice_signal', to: from, signal: { type: 'answer', answer } });

            const queued = iceCandidatesQueue.current[from] || [];
            for (const cand of queued) {
                await pc.addIceCandidate(new RTCIceCandidate(cand.candidate));
            }
            iceCandidatesQueue.current[from] = [];
        } else if (signal.type === 'answer') {
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
            }
        } else if (signal.type === 'ice') {
            if (pc && pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            } else {
                if (!iceCandidatesQueue.current[from]) iceCandidatesQueue.current[from] = [];
                iceCandidatesQueue.current[from].push(signal);
            }
        }
    }).current;

    const hearingEnabledRef = useRef(true);
    useEffect(() => { hearingEnabledRef.current = hearingEnabled; }, [hearingEnabled]);

    const setupAudioAnalysis = useCallback((userId, stream) => {
        // Cleanup existing
        if (animationFrames.current[userId]) cancelAnimationFrame(animationFrames.current[userId]);
        if (audioContexts.current[userId]) audioContexts.current[userId].close();

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        audioContexts.current[userId] = audioContext;
        analysers.current[userId] = analyser;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const checkTalking = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
            const average = sum / bufferLength;
            
            setTalkingStates(prev => ({ ...prev, [userId]: average > 10 }));
            animationFrames.current[userId] = requestAnimationFrame(checkTalking);
        };
        checkTalking();
    }, []);

    useEffect(() => {
        // Apply hearing to all audio elements
        gameState?.jugadores && Object.keys(gameState.jugadores).forEach(uid => {
            if (uid === userId) return;
            const audio = document.getElementById(`audio-${uid}`);
            if (audio) audio.muted = !hearingEnabled;
        });
    }, [hearingEnabled, gameState?.jugadores, userId]);

    // Message handler — usa refs para valores dinámicos
    const handleMessage = useRef((msg) => {
        const currentUserId = userIdRef.current;
        const nav = navigateRef.current;

        switch (msg.type) {
            case 'state':
                setGameState(msg.state);
                break;
            case 'chat':
                setChatMessages(prev => [...prev, { from: msg.from, from_name: msg.from_name, text: msg.message }]);
                break;
            case 'player_joined':
                setChatMessages(prev => [...prev, { system: true, text: `${msg.username} se unió` }]);
                break;
            case 'player_left':
                setChatMessages(prev => [...prev, { system: true, text: `${msg.username} salió` }]);
                break;
            case 'player_disconnected':
                setChatMessages(prev => [...prev, { system: true, text: `${msg.username} se desconectó` }]);
                break;
            case 'player_kicked':
                if (msg.user_id === currentUserId) {
                    alert('Fuiste expulsado de la sala');
                    nav('/adivina');
                }
                break;
            case 'kicked':
                alert('Fuiste expulsado de la sala');
                nav('/adivina');
                break;
            case 'vote_open':
                setVoteSelections([]);
                setChatMessages(prev => [...prev, { system: true, text: '¡Votación abierta! Elige las tarjetas que quieres jugar.' }]);
                break;
            case 'vote_update':
                break;
            case 'vote_closed':
                setChatMessages(prev => [...prev, { system: true, text: 'Votación cerrada. Tarjetas seleccionadas.' }]);
                break;
            case 'game_started':
                setChatMessages(prev => [...prev, { system: true, text: '¡El juego ha comenzado!' }]);
                setShowAdivinar(false);
                setGuessResult(null);
                setGameOverData(null);
                break;
            case 'game_restarted':
                setChatMessages(prev => [...prev, { system: true, text: 'El anfitrión ha reiniciado la sala.' }]);
                setShowAdivinar(false);
                setGuessResult(null);
                setGameOverData(null);
                break;
            case 'pregunta':
                setChatMessages(prev => [...prev, {
                    system: true,
                    text: `${msg.de_nombre} pregunta a ${msg.para_nombre}: "${msg.texto}"`
                }]);
                break;
            case 'respuesta':
                setChatMessages(prev => [...prev, {
                    system: true,
                    text: `Respuesta: ${msg.respuesta.toUpperCase()}`
                }]);
                setRespuestaValue('');
                break;
            case 'guess_result':
                setGuessResult({
                    correct: msg.correct,
                    from_name: msg.from_name,
                    target_name: msg.target_name,
                    personaje: msg.personaje_nombre,
                    revealed: msg.revealed_tarjeta,
                });
                setTimeout(() => setGuessResult(null), 4000);
                if (msg.correct) {
                    setChatMessages(prev => [...prev, {
                        system: true,
                        text: `¡${msg.from_name} adivinó a ${msg.target_name}! Era ${msg.revealed_tarjeta?.nombre || '???'}`
                    }]);
                } else {
                    setChatMessages(prev => [...prev, {
                        system: true,
                        text: `${msg.from_name} intentó adivinar a ${msg.target_name} y falló.`
                    }]);
                }
                break;
            case 'game_over':
                setGameOverData({
                    ganador: msg.ganador,
                    ganador_username: msg.ganador_username,
                    jugadores: msg.jugadores,
                });
                setChatMessages(prev => [...prev, {
                    system: true,
                    text: `🏆 ¡Juego terminado! Ganador: ${msg.ganador_username}`
                }]);
                break;
            case 'voice_state':
                setVoiceStates(prev => ({ ...prev, [msg.user_id]: msg.enabled }));
                break;
            case 'voice_signal':
                handleVoiceSignal(msg.from, msg.signal);
                break;
            case 'error':
                console.error('WS error:', msg.message);
                break;
            default:
                break;
        }
    }).current;

    // Connect socket — estable, lee siempre de refs
    const connectSocket = useRef(() => {
        const code = codigoRef.current;
        const tok = tokenRef.current;
        if (!code || !tok) return;

        if (socket.current) {
            socket.current.close();
            socket.current = null;
        }

        const url = `${WS_BASE}/${code}?clientId=${tok}`;
        const ws = new WebSocket(url);
        socket.current = ws;

        ws.onopen = () => {
            setConnected(true);
            setChatMessages(prev => [...prev, { system: true, text: 'Conectado a la sala' }]);
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                handleMessage(msg);
            } catch (e) {
                console.error('WS parse error', e);
            }
        };

        ws.onclose = () => {
            setConnected(false);
            socket.current = null;
            if (!isCleaningUp.current) {
                reconnectTimeout.current = setTimeout(() => {
                    connectSocket.current();
                }, 3000);
            }
        };

        ws.onerror = () => {
            setConnected(false);
        };
    }).current;

    // Cleanup helper
    const doCleanup = useRef(() => {
        isCleaningUp.current = true;
        if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
            reconnectTimeout.current = null;
        }
        if (socket.current) {
            socket.current.close();
            socket.current = null;
        }
        localStream.current?.getTracks().forEach(t => t.stop());
        Object.values(peerConnections.current).forEach(pc => pc.close());
        peerConnections.current = {};

        Object.values(animationFrames.current).forEach(frame => cancelAnimationFrame(frame));
        Object.values(audioContexts.current).forEach(ctx => ctx.close());
    }).current;

    // Init effect — runs ONLY ONCE per codigo change
    useEffect(() => {
        setTitulo(`Sala ${codigo}`);
        fRef.current.adivina.getTarjetas();
        fRef.current.adivina.getTags();
        fRef.current.adivina.getDecks();
        connectSocket();

        return () => {
            doCleanup();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [codigo]);

    // Toggle voice handler
    const toggleVoice = useRef(async () => {
        setVoiceEnabled(prev => {
            const enabling = !prev;

            if (enabling) {
                (async () => {
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        localStream.current = stream;
                        sendWs({ type: 'voice_toggle', enabled: true });

                        const currentGameState = gameStateRef.current;
                        const currentUserId = userIdRef.current;
                        if (currentGameState?.jugadores) {
                            for (const uid of Object.keys(currentGameState.jugadores)) {
                                if (uid === currentUserId) continue;
                                const pc = new RTCPeerConnection({
                                    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
                                });
                                pc.onicecandidate = (event) => {
                                    if (event.candidate) {
                                        sendWs({ type: 'voice_signal', to: uid, signal: { type: 'ice', candidate: event.candidate } });
                                    }
                                };
                                pc.ontrack = (event) => {
                                    const audio = document.getElementById(`audio-${uid}`);
                                    if (audio && event.streams[0]) {
                                        audio.srcObject = event.streams[0];
                                    }
                                };
                                stream.getTracks().forEach(track => pc.addTrack(track, stream));
                                peerConnections.current[uid] = pc;
                                const offer = await pc.createOffer();
                                await pc.setLocalDescription(offer);
                                sendWs({ type: 'voice_signal', to: uid, signal: { type: 'offer', offer } });
                            }
                        }
                    } catch (e) {
                        console.error('Mic error:', e);
                        alert('No se pudo acceder al micrófono');
                        setVoiceEnabled(false);
                    }
                })();
            } else {
                localStream.current?.getTracks().forEach(t => t.stop());
                localStream.current = null;
                Object.values(peerConnections.current).forEach(pc => pc.close());
                peerConnections.current = {};
                sendWs({ type: 'voice_toggle', enabled: false });
            }

            return enabling;
        });
    }).current;

    // Chat
    const sendChat = useRef(() => {
        const text = chatInputRef.current.trim();
        if (!text) return;
        sendWs({ type: 'chat', message: text });
        setChatInput('');
    }).current;

    // Game action handlers (simple wrappers, stable)
    const setSeleccionModo = useRef((modo) => sendWs({ type: 'set_seleccion_modo', modo })).current;
    const handleSetTarjetas = useRef((tarjetaIds) => sendWs({ type: 'set_tarjetas', tarjeta_ids: tarjetaIds })).current;
    const handleOpenVote = useRef((tarjetaIds) => sendWs({ type: 'open_vote', tarjeta_ids: tarjetaIds })).current;
    const handleVoteCast = useRef(() => sendWs({ type: 'vote_cast', tarjeta_ids: voteSelectionsRef.current })).current;
    const handleCloseVote = useRef(() => sendWs({ type: 'close_vote' })).current;
    const handleStartGame = useRef(() => sendWs({ type: 'start_game' })).current;
    const handleRestartGame = useRef(() => sendWs({ type: 'restart_game' })).current;
    const handleAdvanceTurn = useRef(() => sendWs({ type: 'advance_turn' })).current;
    const handleKick = useRef((targetId) => {
        if (!confirm('¿Expulsar a este jugador?')) return;
        sendWs({ type: 'kick_player', user_id: targetId });
    }).current;

    const handleToggleDiscard = useRef((tarjetaId) => {
        sendWs({ type: 'toggle_discard', tarjeta_id: tarjetaId });
    }).current;

    const handlePregunta = useRef(() => {
        const text = preguntaTextoRef.current.trim();
        const target = preguntaTargetRef.current;
        if (!text || !target) return;
        sendWs({ type: 'pregunta', target_id: target, texto: text });
        setPreguntaTexto('');
    }).current;

    const handleRespuesta = useRef((valor) => {
        if (!['si', 'no', 'quizas'].includes(valor)) return;
        sendWs({ type: 'respuesta', respuesta: valor });
        setRespuestaValue(valor);
    }).current;

    const handleAdivinar = useRef(() => {
        const target = adivinarTargetRef.current;
        const nombre = adivinarNombreRef.current.trim();
        if (!target || !nombre) return;
        sendWs({ type: 'adivinar', target_id: target, personaje_nombre: nombre });
        setShowAdivinar(false);
        setAdivinarNombre('');
        setAdivinarTarget('');
    }).current;

    const toggleVoteSelection = useRef((tarjetaId) => {
        setVoteSelections(prev =>
            prev.includes(tarjetaId) ? prev.filter(id => id !== tarjetaId) : [...prev, tarjetaId]
        );
    }).current;

    const loadTarjetas = useRef(() => {
        fRef.current.adivina.getTarjetas();
        fRef.current.adivina.getTags();
        fRef.current.adivina.getDecks();
    }).current;

    const getImageUrl = useCallback((imagen_url) => {
        if (!imagen_url) return null;
        if (imagen_url.startsWith('http')) return imagen_url;
        return `${API_BASE}${imagen_url}`;
    }, []);

    const applyDeck = useCallback((deckId) => {
        if (!deckId) return;
        fRef.current.adivina.getDeckTarjetas(deckId, (deckTarjetas) => {
            if (!deckTarjetas || !deckTarjetas.length) return;
            const ids = deckTarjetas.map(t => t.id);
            setSelectedTarjetas(ids);
            if (isHost) {
                sendWs({ type: 'set_tarjetas', tarjeta_ids: ids });
            }
        });
    }, [isHost]);

    return {
        style, codigo, connected, gameState, chatMessages, chatInput, setChatInput,
        voiceEnabled, voiceStates, toggleVoice,
        hearingEnabled, setHearingEnabled, talkingStates,
        selectMode, selectedTarjetas, setSelectedTarjetas,
        voteSelections, toggleVoteSelection,
        preguntaTexto, setPreguntaTexto, preguntaTarget, setPreguntaTarget,
        respuestaValue, setRespuestaValue,
        showAdivinar, setShowAdivinar, adivinarTarget, setAdivinarTarget,
        adivinarNombre, setAdivinarNombre, guessResult, setGuessResult,
        gameOverData, setGameOverData,
        isHost, myPlayer, activePlayers, isMyTurn, userId,
        tarjetas, decks, tags, isAdmin,
        sendChat, setSeleccionModo, handleSetTarjetas,
        handleOpenVote, handleVoteCast, handleCloseVote, handleStartGame, handleRestartGame,
        handlePregunta, handleRespuesta, handleAdivinar, handleAdvanceTurn, handleKick,
        handleToggleDiscard,
        navigate, loadTarjetas, getImageUrl, applyDeck,
    };
};
