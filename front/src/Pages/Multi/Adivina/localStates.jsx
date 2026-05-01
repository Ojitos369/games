import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useStates } from '../../../Hooks/useStates';
import styles from './styles/index.module.scss';

const WS_BASE = 'ws://localhost:8372/api/games/adivina/ws';

export const localStates = () => {
    const { s, f } = useStates();
    const me = useMemo(() => s.usuario?.data ?? {}, [s.usuario?.data]);
    const myId = useMemo(() => me.id ?? '', [me.id]);
    const myUsername = useMemo(() => me.username ?? '', [me.username]);

    // view: home | join | lobby | game | cards | decks
    const [view, setView] = useState('home');
    const [room, setRoom] = useState(null);
    const [myCard, setMyCard] = useState(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [gameOver, setGameOver] = useState(null);

    // Chat
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef(null);

    // Voting
    const [votingDeadline, setVotingDeadline] = useState(null);
    const [votingTimeLeft, setVotingTimeLeft] = useState(0);
    const [myVotes, setMyVotes] = useState(new Set());

    // Turn actions
    const [questionInput, setQuestionInput] = useState('');
    const [guessInput, setGuessInput] = useState('');
    const [guessPanel, setGuessPanel] = useState(false);
    const [currentTarget, setCurrentTarget] = useState(null);

    // Voice (WebRTC)
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const [muted, setMuted] = useState(false);
    const [speakingPeers, setSpeakingPeers] = useState(new Set());
    const peersRef = useRef({});
    const localStreamRef = useRef(null);

    const wsRef = useRef(null);
    const reconnectRef = useRef(null);
    const roomCodeRef = useRef(null);

    const wsSend = useCallback((msg) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(msg));
        }
    }, []);

    const addChat = useCallback((msg) => {
        setChatMessages(prev => [...prev.slice(-299), msg]);
    }, []);

    // ── WebRTC helpers ────────────────────────────────────────────────────

    const getOrCreatePeer = useCallback((peerId) => {
        if (peersRef.current[peerId]) return peersRef.current[peerId];
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

        pc.onicecandidate = (e) => {
            if (e.candidate) wsSend({ type: 'voice_signal', to_id: peerId, signal: e.candidate });
        };

        pc.ontrack = (e) => {
            let audio = document.getElementById(`voice-audio-${peerId}`);
            if (!audio) {
                audio = document.createElement('audio');
                audio.id = `voice-audio-${peerId}`;
                audio.autoplay = true;
                document.body.appendChild(audio);
            }
            audio.srcObject = e.streams[0];
        };

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current));
        }
        peersRef.current[peerId] = pc;
        return pc;
    }, [wsSend]);

    const handleVoiceSignal = useCallback(async (fromId, signal) => {
        if (!signal) return;
        try {
            if (signal.type === 'offer') {
                const pc = getOrCreatePeer(fromId);
                await pc.setRemoteDescription(new RTCSessionDescription(signal));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                wsSend({ type: 'voice_signal', to_id: fromId, signal: answer });
            } else if (signal.type === 'answer') {
                const pc = peersRef.current[fromId];
                if (pc) await pc.setRemoteDescription(new RTCSessionDescription(signal));
            } else if (signal.candidate) {
                const pc = peersRef.current[fromId];
                if (pc) await pc.addIceCandidate(new RTCIceCandidate(signal));
            }
        } catch { /* ignore stale signals */ }
    }, [getOrCreatePeer, wsSend]);

    // ── WS message handler ────────────────────────────────────────────────

    const handleWsMessage = useCallback((msg) => {
        switch (msg.type) {
            case 'room_state':
                setRoom(msg.room);
                if (msg.room?.game?.status === 'playing') setGameStarted(true);
                break;

            case 'player_joined':
                setRoom(prev => {
                    if (!prev) return prev;
                    const exists = prev.players.some(p => p.id === msg.player.id);
                    return exists ? prev : { ...prev, players: [...prev.players, msg.player] };
                });
                addChat({ type: 'system', text: `${msg.player.username} se unio` });
                break;

            case 'player_left':
                setRoom(prev => prev ? { ...prev, players: prev.players.filter(p => p.id !== msg.player_id) } : prev);
                addChat({ type: 'system', text: `${msg.username} salio` });
                break;

            case 'player_ready':
                setRoom(prev => prev ? {
                    ...prev,
                    players: prev.players.map(p => p.id === msg.player_id ? { ...p, is_ready: msg.is_ready } : p),
                } : prev);
                break;

            case 'cards_selected':
                setRoom(prev => prev ? { ...prev, selected_cards: msg.cards, selected_cards_count: msg.count, status: 'selecting' } : prev);
                break;

            case 'voting_started':
                setRoom(prev => prev ? { ...prev, status: 'voting', voting_enabled: true, voting_deadline: msg.deadline, selected_cards: msg.cards } : prev);
                setVotingDeadline(new Date(msg.deadline));
                setMyVotes(new Set());
                addChat({ type: 'event', text: `Votacion abierta — ${msg.duration}s` });
                break;

            case 'vote_update':
                setRoom(prev => {
                    if (!prev) return prev;
                    return { ...prev, card_votes: { ...(prev.card_votes || {}), [msg.card_id]: msg.voted_by } };
                });
                break;

            case 'voting_ended':
                setRoom(prev => prev ? { ...prev, status: 'selecting', voting_enabled: false, selected_cards: msg.selected_cards } : prev);
                setVotingDeadline(null);
                addChat({ type: 'event', text: 'Votacion cerrada' });
                break;

            case 'game_started':
                setMyCard(msg.my_card);
                setGameStarted(true);
                setView('game');
                setRoom(prev => prev ? {
                    ...prev,
                    status: 'playing',
                    players: msg.players,
                    game: {
                        status: 'playing',
                        current_asker: msg.current_asker,
                        current_target: null,
                        turn_number: 1,
                        current_questions: [],
                        history: [],
                        players: Object.fromEntries(msg.players.map(p => [p.id, { is_eliminated: false, card_revealed: null }])),
                        winner: null,
                    },
                } : prev);
                addChat({ type: 'event', text: 'El juego comenzo!' });
                break;

            case 'target_set':
                setCurrentTarget(msg.target_id);
                setRoom(prev => prev?.game ? { ...prev, game: { ...prev.game, current_target: msg.target_id, current_questions: [] } } : prev);
                break;

            case 'question_asked':
                setRoom(prev => {
                    if (!prev?.game) return prev;
                    const qs = [...(prev.game.current_questions || []), { question: msg.question, answer: null }];
                    return { ...prev, game: { ...prev.game, current_questions: qs } };
                });
                break;

            case 'question_answered':
                setRoom(prev => {
                    if (!prev?.game) return prev;
                    const qs = (prev.game.current_questions || []).map((q, i) =>
                        i === msg.q_idx ? { ...q, answer: msg.answer } : q
                    );
                    return { ...prev, game: { ...prev.game, current_questions: qs } };
                });
                break;

            case 'guess_result':
                if (msg.correct) {
                    setRoom(prev => {
                        if (!prev?.game) return prev;
                        const gp = { ...(prev.game.players || {}) };
                        if (gp[msg.target_id]) gp[msg.target_id] = { ...gp[msg.target_id], is_eliminated: true, card_revealed: msg.character };
                        return {
                            ...prev,
                            players: prev.players.map(p => p.id === msg.target_id ? { ...p, is_eliminated: true } : p),
                            game: { ...prev.game, players: gp },
                        };
                    });
                    addChat({ type: 'event', text: `${msg.asker_username} adivino a ${msg.target_username}: "${msg.character?.name}"` });
                } else {
                    addChat({ type: 'event', text: `${msg.asker_username} fallo con "${msg.guess}"` });
                }
                setGuessInput('');
                setGuessPanel(false);
                break;

            case 'turn_changed':
                setCurrentTarget(null);
                setQuestionInput('');
                setRoom(prev => prev?.game ? {
                    ...prev,
                    game: { ...prev.game, current_asker: msg.current_asker, current_target: null, turn_number: msg.turn_number, current_questions: [] },
                } : prev);
                break;

            case 'game_over':
                setGameOver(msg);
                setRoom(prev => prev?.game ? { ...prev, status: 'finished', game: { ...prev.game, status: 'finished', winner: msg.winner_id } } : prev);
                addChat({ type: 'event', text: `Ganador: ${msg.winner_username}!` });
                break;

            case 'room_restarted':
                setRoom(msg.room);
                setMyCard(null);
                setGameStarted(false);
                setGameOver(null);
                setCurrentTarget(null);
                setChatMessages([]);
                setView('lobby');
                break;

            case 'chat_message':
                addChat({ type: 'chat', from: msg.username, text: msg.message, fromId: msg.from_id });
                break;

            case 'voice_signal':
                handleVoiceSignal(msg.from_id, msg.signal);
                break;

            case 'error':
                addChat({ type: 'system', text: `Error: ${msg.message}` });
                break;
        }
    }, [addChat, handleVoiceSignal]);

    // ── WS connection ─────────────────────────────────────────────────────

    const connectWs = useCallback((roomCode) => {
        clearTimeout(reconnectRef.current);
        if (wsRef.current) wsRef.current.close();
        roomCodeRef.current = roomCode;
        const url = `${WS_BASE}/${roomCode}?user_id=${myId}&username=${encodeURIComponent(myUsername)}`;
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onmessage = (ev) => {
            try { handleWsMessage(JSON.parse(ev.data)); } catch { /* ignore */ }
        };

        ws.onclose = () => {
            reconnectRef.current = setTimeout(() => {
                if (roomCodeRef.current) connectWs(roomCodeRef.current);
            }, 3000);
        };
    }, [myId, myUsername, handleWsMessage]);

    // ── Effects ───────────────────────────────────────────────────────────

    useEffect(() => {
        if (!votingDeadline) { setVotingTimeLeft(0); return; }
        const iv = setInterval(() => {
            const left = Math.max(0, Math.round((votingDeadline - Date.now()) / 1000));
            setVotingTimeLeft(left);
            if (left === 0) clearInterval(iv);
        }, 1000);
        return () => clearInterval(iv);
    }, [votingDeadline]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    useEffect(() => {
        return () => {
            clearTimeout(reconnectRef.current);
            wsRef.current?.close();
            localStreamRef.current?.getTracks().forEach(t => t.stop());
            Object.values(peersRef.current).forEach(pc => pc.close());
        };
    }, []);

    // ── Derived ───────────────────────────────────────────────────────────

    const isHost = useMemo(() => room?.host_id === myId, [room?.host_id, myId]);
    const isMyTurn = useMemo(() => room?.game?.current_asker === myId, [room?.game?.current_asker, myId]);
    const activePlayers = useMemo(() => (room?.players || []).filter(p => !p.is_eliminated), [room?.players]);
    const currentAsker = useMemo(() => (room?.players || []).find(p => p.id === room?.game?.current_asker), [room]);

    // ── Action callbacks ──────────────────────────────────────────────────

    const sendChat = useCallback(() => {
        const msg = chatInput.trim();
        if (!msg) return;
        wsSend({ type: 'chat', message: msg });
        setChatInput('');
    }, [chatInput, wsSend]);

    const toggleReady = useCallback(() => wsSend({ type: 'ready' }), [wsSend]);
    const startGame = useCallback(() => wsSend({ type: 'start_game' }), [wsSend]);

    const selectTarget = useCallback((playerId) => {
        if (!isMyTurn || playerId === myId) return;
        if (room?.game?.players?.[playerId]?.is_eliminated) return;
        wsSend({ type: 'set_target', target_id: playerId });
    }, [isMyTurn, myId, room, wsSend]);

    const sendQuestion = useCallback(() => {
        const q = questionInput.trim();
        if (!q || !currentTarget) return;
        wsSend({ type: 'ask_question', question: q });
        setQuestionInput('');
    }, [questionInput, currentTarget, wsSend]);

    const answerQuestion = useCallback((q_idx, answer) => {
        wsSend({ type: 'answer_question', q_idx, answer });
    }, [wsSend]);

    const sendGuess = useCallback(() => {
        const g = guessInput.trim();
        if (!g) return;
        wsSend({ type: 'make_guess', character_name: g });
    }, [guessInput, wsSend]);

    const passTurn = useCallback(() => wsSend({ type: 'pass_turn' }), [wsSend]);

    const voteCard = useCallback((cardId) => {
        wsSend({ type: 'vote_card', card_id: cardId });
        setMyVotes(prev => {
            const next = new Set(prev);
            next.has(cardId) ? next.delete(cardId) : next.add(cardId);
            return next;
        });
    }, [wsSend]);

    const closeVoting = useCallback(() => wsSend({ type: 'close_voting' }), [wsSend]);
    const restartRoom = useCallback(() => { setGameOver(null); wsSend({ type: 'restart_room' }); }, [wsSend]);

    const joinRoom = useCallback((code) => {
        f.adivina.getRoom(
            code,
            () => { connectWs(code); setView('lobby'); },
            () => addChat({ type: 'system', text: 'Sala no encontrada' })
        );
    }, [f.adivina, connectWs, addChat]);

    const createRoom = useCallback(() => {
        f.adivina.createRoom((data) => { connectWs(data.room_code); setView('lobby'); });
    }, [f.adivina, connectWs]);

    const toggleVoice = useCallback(async () => {
        if (!voiceEnabled) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                localStreamRef.current = stream;
                setVoiceEnabled(true);
                for (const p of (room?.players || [])) {
                    if (p.id === myId) continue;
                    const pc = getOrCreatePeer(p.id);
                    stream.getTracks().forEach(t => pc.addTrack(t, stream));
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    wsSend({ type: 'voice_signal', to_id: p.id, signal: offer });
                }
            } catch { /* mic denied */ }
        } else {
            localStreamRef.current?.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
            Object.values(peersRef.current).forEach(pc => pc.close());
            peersRef.current = {};
            setVoiceEnabled(false);
        }
    }, [voiceEnabled, room, myId, getOrCreatePeer, wsSend]);

    const toggleMute = useCallback(() => {
        if (localStreamRef.current) {
            const nowMuted = !muted;
            localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !nowMuted; });
            setMuted(nowMuted);
        }
    }, [muted]);

    return {
        styles,
        me, myId, myUsername, isHost, isMyTurn,
        view, setView,
        room, setRoom, myCard, gameStarted,
        activePlayers, currentAsker,
        chatMessages, chatInput, setChatInput, sendChat, chatEndRef, addChat,
        votingTimeLeft, myVotes, voteCard, closeVoting,
        questionInput, setQuestionInput, guessInput, setGuessInput,
        guessPanel, setGuessPanel, currentTarget,
        sendQuestion, answerQuestion, sendGuess, passTurn, selectTarget,
        toggleReady, startGame, joinRoom, createRoom, restartRoom, wsSend,
        voiceEnabled, muted, speakingPeers, toggleVoice, toggleMute,
        gameOver,
        f,
    };
};
