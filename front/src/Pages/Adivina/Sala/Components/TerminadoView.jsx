import { subStates } from '../localStates';

export const TerminadoView = () => {
    const {
        style, gameOverData, gameState, isHost,
        waitingForHost, setWaitingForHost,
        handleRestartGame, navigate,
    } = subStates();

    const winnerName = gameState?.jugadores?.[gameState?.ganador]?.username || gameOverData?.ganador_username || 'Alguien';

    if (waitingForHost && !isHost) {
        return (
            <div className={`${style.phaseBox} ${style.phaseTerminado}`}>
                <h2 className={`${style.phaseTitle}`}>🏆 ¡Tenemos un ganador!</h2>
                <div className={`${style.winnerBigBox}`} style={{ opacity: 0.8 }}>
                    <div className={`${style.winnerCrown}`}>👑</div>
                    <div className={`${style.winnerName}`}>{winnerName}</div>
                </div>
                <div style={{ marginTop: '2rem', textAlign: 'center', opacity: 0.8 }}>
                    <div className={style.spinner} style={{ margin: '0 auto 1rem auto' }}></div>
                    <p>Esperando a que el anfitrión inicie una nueva partida...</p>
                </div>
                <div className={`${style.terminadoActions}`} style={{ marginTop: '1.5rem' }}>
                    <button className={`${style.btnSecondary}`} onClick={() => navigate('/adivina')}>
                        🏠 Volver al Lobby
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`${style.phaseBox} ${style.phaseTerminado}`}>
            <h2 className={`${style.phaseTitle}`}>🏆 ¡Tenemos un ganador!</h2>
            <div className={`${style.winnerBigBox}`}>
                <div className={`${style.winnerCrown}`}>👑</div>
                <div className={`${style.winnerName}`}>{winnerName}</div>
                <div className={`${style.winnerLabel}`}>¡Ha ganado la partida!</div>
            </div>

            <div className={`${style.terminadoActions}`}>
                <button className={`${style.btnSecondary}`} onClick={() => navigate('/adivina')}>
                    🏠 Volver al Lobby
                </button>
                {isHost ? (
                    <>
                        <button className={`${style.btnPrimary}`} onClick={handleRestartGame}>
                            🔄 Volver a jugar
                        </button>
                        <button className={`${style.btnSecondary}`} onClick={handleRestartGame}>
                            🗂️ Cambiar baraja
                        </button>
                    </>
                ) : (
                    <button className={`${style.btnPrimary}`} onClick={() => setWaitingForHost(true)}>
                        🔄 Volver a jugar
                    </button>
                )}
            </div>
        </div>
    );
};
