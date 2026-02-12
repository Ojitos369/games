import { localStates } from "./localStates";

export const GameStats = () => {
    const { styles, moveCount, timerDisplay, level, resetLevel } = localStates();
    const optimo = level?.optimo ?? '--';

    return (
        <div className={styles.statsBar}>
            <div className={styles.statCard} onClick={resetLevel}>
                <p className={styles.statLabel}>Movs</p>
                <p className={`${styles.statValue} ${styles.textYellow}`}>{moveCount}</p>
                <div className={`${styles.statOverlay} ${styles.movesOverlay}`}>
                    <span>Reset</span>
                </div>
            </div>
            <div className={styles.statCard} style={{cursor: 'default'}}>
                <p className={styles.statLabel}>Óptimo</p>
                <p className={`${styles.statValue} ${styles.textBlue}`}>{optimo}</p>
            </div>
            <div className={styles.statCard} onClick={resetLevel}>
                <p className={styles.statLabel}>Tiempo</p>
                <p className={`${styles.statValue} ${styles.textGreen}`}>{timerDisplay}</p>
                <div className={`${styles.statOverlay} ${styles.timerOverlay}`}>
                    <span>Reset</span>
                </div>
            </div>
        </div>
    );
};
