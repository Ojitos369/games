import { useEffect, useCallback, useRef } from 'react';
import { localStates } from "./localStates";

export const Board = () => {
    const {
        styles, level, pieces, setPieces, moveCount, setMoveCount,
        gameFinished, setGameFinished, loading,
        dragRef, boardRef, piecesRef,
        startTimer, canMoveTo,
        openWinModal, saveWin, getElapsedSeconds,
        showUserOverlay, setShowUserOverlay, currentUsername, saveUserName,
    } = localStates();

    const usernameInputRef = useRef(null);

    // --- CHECK WIN ---
    const checkWin = useCallback((updatedPieces, currentMoveCount) => {
        const carA = updatedPieces.find(p => p.char === 'A');
        if (carA && carA.r === 2 && carA.c === 4) {
            setGameFinished(true);

            // Contar movimiento de victoria
            const finalMoves = currentMoveCount + 1;
            setMoveCount(finalMoves);

            // Detener drag
            dragRef.current.isDragging = false;
            dragRef.current.activePiece = null;

            // Animación del carro A saliendo
            const newPieces = updatedPieces.map(p => {
                if (p.char === 'A') return { ...p, c: 6 };
                return p;
            });
            setPieces(newPieces);

            // Guardar y mostrar win
            const seconds = getElapsedSeconds();
            saveWin(finalMoves, seconds);

            setTimeout(() => {
                openWinModal();
            }, 300);
        }
    }, [setGameFinished, setMoveCount, dragRef, setPieces, getElapsedSeconds, saveWin, openWinModal]);

    // --- DRAG HANDLERS ---
    const handlePointerDown = useCallback((e, piece) => {
        if (gameFinished || piece.isWall) return;
        e.preventDefault();

        const cx = e.clientX ?? e.touches?.[0]?.clientX;
        const cy = e.clientY ?? e.touches?.[0]?.clientY;

        dragRef.current = {
            isDragging: true,
            activePiece: piece,
            startX: cx,
            startY: cy,
            originalPos: { r: piece.r, c: piece.c },
            dragInitialGridPos: { r: piece.r, c: piece.c },
        };
    }, [gameFinished, dragRef]);

    const handlePointerMove = useCallback((e) => {
        const drag = dragRef.current;
        if (!drag.isDragging || !drag.activePiece || gameFinished) return;

        const cx = e.clientX ?? e.touches?.[0]?.clientX;
        const cy = e.clientY ?? e.touches?.[0]?.clientY;
        const rect = boardRef.current?.getBoundingClientRect();
        if (!rect) return;

        const dx = (cx - drag.startX) / (rect.width / 6);
        const dy = (cy - drag.startY) / (rect.height / 6);
        const piece = drag.activePiece;

        let nr = drag.originalPos.r;
        let nc = drag.originalPos.c;
        if (piece.orientation === 'h') nc = Math.round(drag.originalPos.c + dx);
        else nr = Math.round(drag.originalPos.r + dy);

        nc = Math.max(0, Math.min(nc, 6 - piece.w));
        nr = Math.max(0, Math.min(nr, 6 - piece.h));

        const currentPieces = piecesRef.current;
        const stepR = Math.sign(nr - piece.r);
        const stepC = Math.sign(nc - piece.c);
        let finalR = piece.r;
        let finalC = piece.c;

        while (finalR !== nr || finalC !== nc) {
            const nextR = finalR + stepR;
            const nextC = finalC + stepC;
            if (canMoveTo(piece, nextR, nextC, currentPieces)) {
                finalR = nextR;
                finalC = nextC;
            } else {
                break;
            }
        }

        if (finalR !== piece.r || finalC !== piece.c) {
            drag.activePiece = { ...piece, r: finalR, c: finalC };

            const newPieces = currentPieces.map(p =>
                p.id === piece.id ? { ...p, r: finalR, c: finalC } : p
            );
            setPieces(newPieces);
            checkWin(newPieces, moveCount);
        }
    }, [gameFinished, dragRef, boardRef, piecesRef, canMoveTo, setPieces, checkWin, moveCount]);

    const handlePointerUp = useCallback(() => {
        const drag = dragRef.current;
        if (drag.isDragging && drag.activePiece) {
            if (drag.activePiece.r !== drag.dragInitialGridPos.r ||
                drag.activePiece.c !== drag.dragInitialGridPos.c) {
                if (!timerStartedRef.current) {
                    startTimer();
                    timerStartedRef.current = true;
                }
                setMoveCount(prev => prev + 1);
            }
        }
        drag.isDragging = false;
        drag.activePiece = null;
    }, [dragRef, startTimer, setMoveCount]);

    const timerStartedRef = useRef(false);

    // Reset timerStartedRef when level changes
    useEffect(() => {
        timerStartedRef.current = false;
    }, [level?.id]);

    // Global event listeners
    useEffect(() => {
        const handleMove = (e) => handlePointerMove(e);
        const handleUp = () => handlePointerUp();
        const handleTouchMove = (e) => {
            if (dragRef.current.isDragging) e.preventDefault();
            handlePointerMove(e);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleUp);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleUp);
        };
    }, [handlePointerMove, handlePointerUp]);

    const handleSaveUser = () => {
        const name = usernameInputRef.current?.value || '';
        saveUserName(name);
    };

    return (
        <div className={styles.boardWrapper}>
            <div className={styles.boardContainer} ref={boardRef}>
                {/* Grid cells */}
                {Array.from({ length: 36 }).map((_, i) => (
                    <div key={i} className={styles.cell} />
                ))}

                {/* Pieces */}
                {pieces.map((p) => {
                    const isTarget = p.char === 'A';
                    const cellPct = 100 / 6;
                    const inset = 4; // px gap matching cell margin
                    const pieceStyle = {
                        width: `calc(${p.w * cellPct}% - ${inset * 2}px)`,
                        height: `calc(${p.h * cellPct}% - ${inset * 2}px)`,
                        left: `calc(${p.c * cellPct}% + ${inset}px)`,
                        top: `calc(${p.r * cellPct}% + ${inset}px)`,
                    };

                    if (p.isWall) {
                        return (
                            <div key={p.id} className={`${styles.piece} ${styles.wall}`} style={pieceStyle}>
                                <div className={styles.barrierSprite}>
                                    <div className={styles.barrierStripes} />
                                    <div className={styles.barrierConcrete}>
                                        <span>X</span>
                                    </div>
                                    <div className={styles.barrierStripes} />
                                </div>
                            </div>
                        );
                    }

                    const orientClass = p.orientation === 'h' ? styles.hCar : styles.vCar;
                    return (
                        <div
                            key={p.id}
                            className={`${styles.piece} ${orientClass} ${isTarget ? styles.targetCar : ''}`}
                            style={pieceStyle}
                            onMouseDown={(e) => handlePointerDown(e, p)}
                            onTouchStart={(e) => handlePointerDown(e, p)}
                        >
                            <div className={styles.carBody} style={{ background: p.color }}>
                                {isTarget && <span className={styles.carCrown}>👑</span>}
                                <div className={styles.windowFront} />
                                <span className={styles.carLabel}>{p.char}</span>
                            </div>
                        </div>
                    );
                })}

                {/* Loading overlay */}
                {loading && (
                    <div className={styles.loader}>
                        <div className={styles.spinner} />
                    </div>
                )}
            </div>

            {/* Exit arrow */}
            <div className={styles.exitMarker} />

            {/* User overlay */}
            {showUserOverlay && (
                <div className={styles.userOverlay}>
                    <div className={styles.userOverlayCard}>
                        <h2>Tu Identidad</h2>
                        <input
                            ref={usernameInputRef}
                            type="text"
                            maxLength={12}
                            placeholder="Nickname..."
                            defaultValue={currentUsername}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveUser(); }}
                        />
                        <button onClick={handleSaveUser}>
                            Empezar la Carrera
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
