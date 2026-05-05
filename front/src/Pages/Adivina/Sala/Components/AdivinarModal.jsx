import { subStates } from '../localStates';

export const AdivinarModal = () => {
    const {
        style, showAdivinar, setShowAdivinar,
        gameState, myPlayer, adivinarNombre, setAdivinarNombre,
        handleAdivinar, getImageUrl, openPreview,
    } = subStates();

    if (!showAdivinar || !gameState) return null;

    return (
        <div className={`${style.modalOverlay}`} onClick={() => setShowAdivinar(false)}>
            <div className={`${style.modal} ${style.modalLarge}`} onClick={e => e.stopPropagation()}>
                <div className={`${style.modalHeader}`}>
                    <h3>🤔 ¿Adivinar personaje?</h3>
                    <button className={`${style.btnClose}`} onClick={() => setShowAdivinar(false)}>✕</button>
                </div>
                <div className={`${style.modalBody}`}>
                    <div className={`${style.formGroup}`}>
                        <label>Jugador objetivo</label>
                        <div className={`${style.targetDisplay}`}>
                            {gameState?.jugador_objetivo ? (
                                <strong>{gameState.jugadores?.[gameState.jugador_objetivo]?.username}</strong>
                            ) : (
                                'Nadie'
                            )}
                        </div>
                    </div>
                    <p className={`${style.modalHint}`}>Haz clic en la tarjeta que crees que tiene el jugador objetivo:</p>
                    <div className={`${style.tarjetasGridSmall}`}>
                        {(gameState?.seleccion?.tarjetas_disponibles || []).map(t => {
                            const isDiscarded = (myPlayer?.discards?.[gameState?.jugador_objetivo] || []).includes(t.id);
                            return (
                                <div key={t.id} className={`${style.tarjetaPickItemWrapper}`}>
                                    <div
                                        className={`${style.tarjetaPickItem} ${adivinarNombre === t.nombre ? style.tarjetaPickActive : ''} ${isDiscarded ? style.tarjetaDiscarded : ''}`}
                                        onClick={() => !isDiscarded && setAdivinarNombre(t.nombre)}
                                    >
                                        {t.imagen_url ? (
                                            <img src={getImageUrl(t.imagen_url)} alt="" className={`${style.tarjetaPickImg}`} />
                                        ) : (
                                            <div className={`${style.tarjetaPickPlaceholder}`}>🎭</div>
                                        )}
                                        <span className={`${style.tarjetaPickName}`}>{t.nombre}</span>
                                        {isDiscarded && <div className={`${style.discardOverlay}`}>❌</div>}
                                    </div>
                                    <button className={style.btnFloatPreview} onClick={() => openPreview(t)} title="Ver detalles">👁️</button>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className={`${style.modalFooter}`}>
                    <button className={`${style.btnSecondary}`} onClick={() => setShowAdivinar(false)}>Cancelar</button>
                    <button className={`${style.btnPrimary}`} onClick={handleAdivinar} disabled={!adivinarNombre}>Adivinar</button>
                </div>
            </div>
        </div>
    );
};
