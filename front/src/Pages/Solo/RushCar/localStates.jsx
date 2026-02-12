import { useMemo, useEffect, useRef, useCallback, useState } from 'react';
import { useStates, createState } from '../../../Hooks/useStates';
import styles from './styles/index.module.scss';

const COLORS = {
    'A': '#dc143c', 'x': '#333333', 'B': '#4682b4', 'C': '#2e8b57',
    'D': '#ffa500', 'E': '#9370db', 'F': '#00ced1', 'G': '#ff69b4',
    'H': '#8b4513', 'I': '#ffd700', 'J': '#228b22', 'K': '#483d8b',
    'L': '#daa520', 'M': '#b22222'
};

const getColor = (char) => COLORS[char] || `hsl(${char.charCodeAt(0) * 35}, 60%, 45%)`;

export const localStates = () => {
    const { s, f } = useStates();
    const [titulo, setTitulo] = createState(['page', 'title'], "");
    const [actualPage, setActualPage] = createState(['page', 'actual'], "");

    const level = useMemo(() => s.solo?.rushcar?.level ?? null, [s.solo?.rushcar?.level]);
    const loading = useMemo(() => s.solo?.rushcar?.loading ?? false, [s.solo?.rushcar?.loading]);
    const worldRecords = useMemo(() => s.solo?.rushcar?.records?.world ?? [], [s.solo?.rushcar?.records?.world]);
    const topPlayers = useMemo(() => s.solo?.rushcar?.records?.topPlayers ?? [], [s.solo?.rushcar?.records?.topPlayers]);
    const popularLevels = useMemo(() => s.solo?.rushcar?.records?.popular ?? [], [s.solo?.rushcar?.records?.popular]);
    const recentLevels = useMemo(() => s.solo?.rushcar?.records?.recent ?? [], [s.solo?.rushcar?.records?.recent]);
    const userRecordsData = useMemo(() => s.solo?.rushcar?.userRecords?.data ?? [], [s.solo?.rushcar?.userRecords?.data]);
    const userRecordsUsername = useMemo(() => s.solo?.rushcar?.userRecords?.username ?? '', [s.solo?.rushcar?.userRecords?.username]);

    // Game engine state (local, not Redux — performance critical)
    const [pieces, setPieces] = useState([]);
    const [moveCount, setMoveCount] = useState(0);
    const [gameFinished, setGameFinished] = useState(false);
    const [timerDisplay, setTimerDisplay] = useState("00:00");
    const [showUserOverlay, setShowUserOverlay] = useState(false);
    const [copyStatusVisible, setCopyStatusVisible] = useState(false);
    const [expandedLevels, setExpandedLevels] = useState({});

    // Username from localStorage
    const [currentUsername, setCurrentUsername] = useState(() => localStorage.getItem('rh_user') || '');

    // Refs for drag state (performance: no re-renders)
    const dragRef = useRef({
        isDragging: false,
        activePiece: null,
        startX: 0, startY: 0,
        originalPos: { r: 0, c: 0 },
        dragInitialGridPos: { r: 0, c: 0 },
    });
    const timerRef = useRef({ startTime: null, interval: null });
    const boardRef = useRef(null);
    const piecesRef = useRef([]);

    // Keep piecesRef in sync
    useEffect(() => {
        piecesRef.current = pieces;
    }, [pieces]);

    // --- TIMER ---
    const startTimer = useCallback(() => {
        if (timerRef.current.startTime) return;
        timerRef.current.startTime = Date.now();
        timerRef.current.interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - timerRef.current.startTime) / 1000);
            const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const secs = (elapsed % 60).toString().padStart(2, '0');
            setTimerDisplay(`${mins}:${secs}`);
        }, 1000);
    }, []);

    const stopTimer = useCallback(() => {
        clearInterval(timerRef.current.interval);
    }, []);

    const resetTimer = useCallback(() => {
        stopTimer();
        setTimerDisplay("00:00");
        timerRef.current.startTime = null;
    }, [stopTimer]);

    const getElapsedSeconds = useCallback(() => {
        if (!timerRef.current.startTime) return 0;
        return Math.floor((Date.now() - timerRef.current.startTime) / 1000);
    }, []);

    // --- PARSE LAYOUT ---
    const parseLayout = useCallback((layout) => {
        const str = (layout || '').padEnd(36, 'o');
        const newPieces = [];
        const processed = new Set();

        for (let i = 0; i < 36; i++) {
            const char = str[i];
            if (char === 'o' || processed.has(i)) continue;

            const idxs = [];
            for (let j = 0; j < 36; j++) if (str[j] === char) idxs.push(j);
            idxs.forEach(idx => processed.add(idx));

            const rs = idxs.map(idx => Math.floor(idx / 6));
            const cs = idxs.map(idx => idx % 6);

            if (char === 'x') {
                idxs.forEach(idx => {
                    newPieces.push({
                        id: `x-${Math.floor(idx / 6)}-${idx % 6}`,
                        char: 'x', r: Math.floor(idx / 6), c: idx % 6,
                        w: 1, h: 1, color: COLORS['x'], isWall: true
                    });
                });
                continue;
            }

            const p = {
                id: char, char,
                r: Math.min(...rs), c: Math.min(...cs),
                w: Math.max(...cs) - Math.min(...cs) + 1,
                h: Math.max(...rs) - Math.min(...rs) + 1,
                orientation: (Math.max(...cs) - Math.min(...cs) > 0) ? 'h' : 'v',
                color: getColor(char),
                isWall: false
            };
            newPieces.push(p);
        }
        return newPieces;
    }, []);

    // --- CAN MOVE TO ---
    const canMoveTo = useCallback((piece, r, c, allPieces) => {
        for (let o of allPieces) {
            if (o.id === piece.id) continue;
            if (r < o.r + o.h && r + piece.h > o.r && c < o.c + o.w && c + piece.w > o.c) return false;
        }
        return true;
    }, []);

    // --- INIT / RESET ---
    const resetLevel = useCallback(() => {
        setMoveCount(0);
        setGameFinished(false);
        resetTimer();
        if (level?.layout) {
            setPieces(parseLayout(level.layout));
        }
    }, [level, resetTimer, parseLayout]);

    const fetchLevel = useCallback((params = {}) => {
        f.sl_rushcar.getLevel(params);
    }, [f.sl_rushcar]);

    // --- SAVE WIN ---
    const saveWin = useCallback((moves, seconds) => {
        if (!currentUsername || !level) return;
        f.sl_rushcar.saveRecord({
            username: currentUsername,
            level_id: level.id,
            moves,
            seconds
        });
    }, [currentUsername, level, f.sl_rushcar]);

    // --- USERNAME ---
    const saveUserName = useCallback((name) => {
        if (!name) return;
        const trimmed = name.trim();
        if (!trimmed) return;
        setCurrentUsername(trimmed);
        localStorage.setItem('rh_user', trimmed);
        setShowUserOverlay(false);
        if (!level) fetchLevel();
        f.sl_rushcar.getTopPlayers();
    }, [level, fetchLevel, f.sl_rushcar]);

    // --- SHARE ---
    const copyToClip = useCallback((type) => {
        if (!level) return;
        let text = '';
        if (type === 'id') text = level.id;
        else text = `${window.location.origin}${window.location.pathname}?level=${level.id}`;

        navigator.clipboard.writeText(text).then(() => {
            setCopyStatusVisible(true);
            setTimeout(() => setCopyStatusVisible(false), 2000);
        }).catch(() => {
            // Fallback
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setCopyStatusVisible(true);
            setTimeout(() => setCopyStatusVisible(false), 2000);
        });
    }, [level]);

    // --- MODALS ---
    const openWinModal = useCallback(() => {
        f.u2('modals', 'solo_rushcar', 'win', true);
    }, [f]);

    const closeWinModal = useCallback(() => {
        f.u2('modals', 'solo_rushcar', 'win', false);
    }, [f]);

    const openShareModal = useCallback(() => {
        f.u2('modals', 'solo_rushcar', 'share', true);
    }, [f]);

    const closeShareModal = useCallback(() => {
        f.u2('modals', 'solo_rushcar', 'share', false);
    }, [f]);

    const openUserRecordsModal = useCallback((username) => {
        f.sl_rushcar.getUserRecords({ username });
        f.u2('modals', 'solo_rushcar', 'userRecords', true);
    }, [f]);

    const closeUserRecordsModal = useCallback(() => {
        f.u2('modals', 'solo_rushcar', 'userRecords', false);
    }, [f]);

    const showWin = useMemo(() => s.modals?.solo_rushcar?.win ?? false, [s.modals?.solo_rushcar?.win]);
    const showShare = useMemo(() => s.modals?.solo_rushcar?.share ?? false, [s.modals?.solo_rushcar?.share]);
    const showUserRecords = useMemo(() => s.modals?.solo_rushcar?.userRecords ?? false, [s.modals?.solo_rushcar?.userRecords]);

    // --- TOGGLE LEVEL ROWS ---
    const toggleLevelExpand = useCallback((levelId) => {
        setExpandedLevels(prev => ({ ...prev, [levelId]: !prev[levelId] }));
    }, []);

    // --- FORMAT TIME ---
    const formatTime = useCallback((seconds) => {
        const m = Math.floor(seconds / 60);
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }, []);

    // --- INIT ---
    const init = useCallback(() => {
        setTitulo("Rush Car");
        setActualPage("solo_rushcar");
        f.u1('menubar', 'menuMode', 'menuBar1SLRC');

        // Check URL for level param
        const urlParams = new URLSearchParams(window.location.search);
        const urlLevel = urlParams.get('level');
        if (urlLevel) {
            fetchLevel({ id: urlLevel });
        } else {
            fetchLevel();
        }
        f.sl_rushcar.getTopPlayers();
        f.sl_rushcar.getTrending();

        if (!currentUsername) {
            setShowUserOverlay(true);
        }
    }, []);

    return {
        styles,
        // State
        level, loading, pieces, setPieces, moveCount, setMoveCount,
        gameFinished, setGameFinished, timerDisplay,
        showUserOverlay, setShowUserOverlay, currentUsername,
        copyStatusVisible,
        expandedLevels, toggleLevelExpand,
        // Records
        worldRecords, topPlayers, popularLevels, recentLevels,
        userRecordsData, userRecordsUsername,
        // Modal states
        showWin, showShare, showUserRecords,
        // Actions
        init, resetLevel, fetchLevel, saveWin, saveUserName,
        copyToClip, formatTime,
        openWinModal, closeWinModal,
        openShareModal, closeShareModal,
        openUserRecordsModal, closeUserRecordsModal,
        // Drag refs
        dragRef, timerRef, boardRef, piecesRef,
        // Engine
        startTimer, stopTimer, resetTimer, getElapsedSeconds,
        parseLayout, canMoveTo,
        // Hooks
        f,
    }
}

export const localEffects = () => {
    const { init, level, resetLevel } = localStates();

    useEffect(() => {
        init();
    }, []);

    // When level changes, reset the board
    useEffect(() => {
        if (level?.layout) {
            resetLevel();
        }
    }, [level?.id]);
}