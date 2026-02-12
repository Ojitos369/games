import { localStates } from "./localStates";

export const MenuBar1 = () => {
    const {
        styles, level, moveCount, timerDisplay,
        resetLevel, fetchLevel, openShareModal,
        currentUsername, setShowUserOverlay,
    } = localStates();

    return (
        <div className={styles.menuBarContent}>
            <h4>🏎️ Rush Car</h4>

            <div>
                <div className={styles.menuStatRow}>
                    <span className={styles.menuStatLabel}>Nivel</span>
                    <span className={styles.menuStatValue}>
                        #{level?.id ? level.id.substring(0, 8) : '...'}
                    </span>
                </div>
                <div className={styles.menuStatRow}>
                    <span className={styles.menuStatLabel}>Óptimo</span>
                    <span className={`${styles.menuStatValue} ${styles.textBlue}`}>
                        {level?.optimo ?? '--'}
                    </span>
                </div>
                <div className={styles.menuStatRow}>
                    <span className={styles.menuStatLabel}>Movimientos</span>
                    <span className={`${styles.menuStatValue} ${styles.textYellow}`}>
                        {moveCount}
                    </span>
                </div>
                <div className={styles.menuStatRow}>
                    <span className={styles.menuStatLabel}>Tiempo</span>
                    <span className={`${styles.menuStatValue} ${styles.textGreen}`}>
                        {timerDisplay}
                    </span>
                </div>
                <div className={styles.menuStatRow}>
                    <span className={styles.menuStatLabel}>Jugador</span>
                    <span className={`${styles.menuStatValue}`} style={{ color: 'var(--my-primary)' }}>
                        {currentUsername || '...'}
                    </span>
                </div>
            </div>

            <h4>⚡ Acciones</h4>

            <div className={styles.menuActions}>
                <button onClick={resetLevel}>↺ Reiniciar Nivel</button>
                <button onClick={() => fetchLevel()}>🎲 Nivel al Azar</button>
                <button onClick={openShareModal}>🔗 Compartir</button>
                <button onClick={() => setShowUserOverlay(true)}>👤 Cambiar Nombre</button>
            </div>
        </div>
    );
};