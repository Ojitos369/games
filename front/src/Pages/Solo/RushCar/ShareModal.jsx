import { localStates } from "./localStates";
import { GeneralModal } from '../../../Components/Modals/GeneralModal';

const ShareContent = (props) => {
    const { styles, level, copyToClip, copyStatusVisible, closeShareModal } = localStates();

    return (
        <div className={styles.shareContent}>
            <h3 className={styles.shareTitle}>Compartir Reto</h3>
            <p className={styles.shareSubtitle}>Desafía a tus amigos a superar este nivel.</p>

            <label>ID del Nivel</label>
            <input type="text" readOnly value={level?.id || ''} />

            <p className={`${styles.copyStatus} ${copyStatusVisible ? styles.visible : ''}`}>
                ¡Copiado con éxito!
            </p>

            <div className={styles.shareActions}>
                <button
                    className={`${styles.btnShareCopy} ${styles.btnShareId}`}
                    onClick={() => copyToClip('id')}
                >
                    Copiar ID
                </button>
                <button
                    className={`${styles.btnShareCopy} ${styles.btnShareLink}`}
                    onClick={() => copyToClip('link')}
                >
                    Copiar Link
                </button>
                <button className={styles.btnShareClose} onClick={closeShareModal}>
                    Cerrar
                </button>
            </div>
        </div>
    );
};

export const ShareModal = () => {
    const { showShare, closeShareModal } = localStates();

    if (!showShare) return null;

    return (
        <GeneralModal
            Component={ShareContent}
            lvl1="solo_rushcar"
            lvl2="share"
            close={closeShareModal}
            modal_container_w="modal_container_50"
            borderColor="var(--my-yellow)"
        />
    );
};
