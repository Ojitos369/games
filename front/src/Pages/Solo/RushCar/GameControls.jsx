import { useRef } from 'react';
import { localStates } from "./localStates";

export const GameControls = () => {
    const {
        styles, moveCount, resetLevel, fetchLevel,
        openShareModal, setShowUserOverlay, currentUsername,
    } = localStates();

    const diffRef = useRef(null);
    const uuidRef = useRef(null);

    const goToDifficulty = () => {
        const diff = parseInt(diffRef.current?.value);
        if (diff >= 1 && diff <= 60) fetchLevel({ optimo: diff });
    };

    const goToUUID = () => {
        const uuid = uuidRef.current?.value?.trim();
        if (uuid) fetchLevel({ id: uuid });
    };

    return (
        <div className={styles.controlsSection}>
            {moveCount > 0 && (
                <button className={styles.resetBtn} onClick={resetLevel}>
                    ↺ Reiniciar Nivel
                </button>
            )}

            <div className={styles.mainButtons}>
                <button className={styles.btnRandom} onClick={() => fetchLevel()}>
                    🎲 Nivel al Azar
                </button>
                <button className={styles.btnShare} onClick={openShareModal}>
                    🔗 Compartir
                </button>
            </div>

            <div className={styles.searchRow}>
                <div className={styles.searchBox}>
                    <input
                        ref={diffRef}
                        type="number"
                        min="1" max="60"
                        placeholder="Dif 1-60"
                        onKeyDown={(e) => { if (e.key === 'Enter') goToDifficulty(); }}
                    />
                    <button onClick={goToDifficulty}>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                </div>
                <div className={`${styles.searchBox} ${styles.searchBoxUuid}`}>
                    <input
                        ref={uuidRef}
                        type="text"
                        placeholder="Pegar ID"
                        onKeyDown={(e) => { if (e.key === 'Enter') goToUUID(); }}
                    />
                    <button onClick={goToUUID}>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3}
                                d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className={styles.playerInfo}>
                Player: <b>{currentUsername || '...'}</b> •{' '}
                <button onClick={() => setShowUserOverlay(true)}>Cambiar</button>
            </div>
        </div>
    );
};
