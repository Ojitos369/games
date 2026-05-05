import { subStates } from '../localStates';

export const GameOverModal = () => {
    const {
        style, gameOverData, gameState, isHost,
        waitingForHost, setWaitingForHost,
        handleRestartGame, navigate,
        getImageUrl, openPreview,
    } = subStates();

    if (!gameOverData || gameState?.estado !== 'terminado') return null;

    return (
        <div className={`${style.modalOverlay}`}>
            <div className={`${style.modal} ${style.modalLarge}`}>
                <div className={`${style.modalHeader}`}>
                    <h3>🏆 Juego Terminado</h3>
                </div>
                {waitingForHost && !isHost ? (
                    <div className={`${style.modalBody}`} style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                        <div className={style.spinner} style={{ margin: '0 auto 1.5rem auto' }}></div>
                        <h3 style={{ opacity: 0.8, marginBottom: '0.5rem' }}>En la fila</h3>
                        <p style={{ opacity: 0.6 }}>Esperando a que el anfitrión inicie una nueva partida...</p>
                    </div>
                ) : (
                    <div className={`${style.modalBody}`}>
                        <div className={`${style.winnerBox}`}>
                            <div className={`${style.winnerCrown}`}>👑</div>
                            <div className={`${style.winnerName}`}>{gameOverData.ganador_username}</div>
                            <div className={`${style.winnerLabel}`}>Ganador</div>
                        </div>
                        <div className={`${style.revealGrid}`}>
                            {Object.entries(gameOverData.jugadores || {}).map(([uid, p]) => (
                                <div key={uid} className={`${style.revealCard}`} onClick={() => p.tarjeta && openPreview(p.tarjeta)}>
                                    <div className={`${style.revealName}`}>{p.username}</div>
                                    {p.tarjeta?.imagen_url ? (
                                        <img src={getImageUrl(p.tarjeta.imagen_url)} alt="" className={`${style.revealImg}`} />
                                    ) : (
                                        <div className={`${style.revealImgPlaceholder}`}>🎭</div>
                                    )}
                                    <div className={`${style.revealPersonaje}`}>{p.tarjeta?.nombre || '???'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className={`${style.modalFooter}`}>
                    <button className={`${style.btnSecondary}`} onClick={() => navigate('/adivina')}>Volver al Lobby</button>
                    {isHost ? (
                        <button className={`${style.btnPrimary}`} onClick={handleRestartGame}>Reiniciar Partida</button>
                    ) : !waitingForHost && (
                        <button className={`${style.btnPrimary}`} onClick={() => setWaitingForHost(true)}>Volver a jugar</button>
                    )}
                </div>
            </div>
        </div>
    );
};
