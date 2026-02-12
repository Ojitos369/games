import { localStates } from "./localStates";
import { GeneralModal } from '../../../Components/Modals/GeneralModal';

const WinContent = (props) => {
    const {
        styles, moveCount, timerDisplay, level,
        fetchLevel, resetLevel, closeWinModal,
    } = localStates();

    const optimo = level?.optimo ?? 0;
    const diff = moveCount - optimo;
    let msg = '';
    if (diff === 0) msg = '¡Increíble! Has alcanzado el puntaje óptimo. 🏆';
    else if (diff <= 3) msg = '¡Casi perfecto! Muy cerca del óptimo. ✨';
    else msg = '¡Bien hecho! Sigue practicando para mejorar tu marca. 💪';

    const handleNext = () => {
        closeWinModal();
        fetchLevel();
    };

    const handleReplay = () => {
        closeWinModal();
        resetLevel();
    };

    return (
        <div className={styles.winContent}>
            <h3 className={styles.winTitle}>¡Nivel Conquistado!</h3>
            <p className={styles.winSubtitle}>Has superado el desafío con éxito.</p>

            <div className={styles.winStats}>
                <div className={styles.winStatItem}>
                    <p className={styles.winStatLabel}>Movimientos</p>
                    <p className={`${styles.winStatValue} ${styles.textYellow}`}>{moveCount}</p>
                </div>
                <div className={styles.winStatItem}>
                    <p className={styles.winStatLabel}>Tiempo</p>
                    <p className={`${styles.winStatValue} ${styles.textGreen}`}>{timerDisplay}</p>
                </div>
                <div className={styles.winStatItem}>
                    <p className={styles.winStatLabel}>Óptimo</p>
                    <p className={`${styles.winStatValue} ${styles.textBlue}`}>{optimo}</p>
                </div>
            </div>

            <p className={styles.winMessage}>{msg}</p>

            <div className={styles.winActions}>
                <button className={styles.btnWinPrimary} onClick={handleNext}>
                    Siguiente 🎲
                </button>
                <button className={styles.btnWinSecondary} onClick={handleReplay}>
                    Volver a jugar
                </button>
                <button className={styles.btnWinClose} onClick={closeWinModal}>
                    Cerrar
                </button>
            </div>
        </div>
    );
};

export const WinOverlay = () => {
    const { showWin, closeWinModal } = localStates();

    if (!showWin) return null;

    return (
        <GeneralModal
            Component={WinContent}
            lvl1="solo_rushcar"
            lvl2="win"
            close={closeWinModal}
            modal_container_w="modal_container_60"
            borderColor="var(--my-success)"
        />
    );
};
