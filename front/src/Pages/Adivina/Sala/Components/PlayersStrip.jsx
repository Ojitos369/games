import { subStates } from '../localStates';

export const PlayersStrip = () => {
    const { style, gameState, espectadores } = subStates();

    if (!gameState) return null;

    const jugadoresList = gameState?.jugadores ? Object.values(gameState.jugadores) : [];

    return (
        <div className={`${style.playersStrip}`}>
            {jugadoresList.map(j => (
                <div
                    key={j.user_id}
                    className={`${style.playerStripItem} ${j.user_id === gameState?.turno_actual ? style.playerStripActive : ''} ${j.eliminado ? style.playerStripElim : ''}`}
                >
                    <span>{j.user_id === gameState?.creador_id ? '👑' : '👤'}</span>
                    <span className={`${style.playerStripName}`}>{j.username}</span>
                </div>
            ))}
            {espectadores?.length > 0 && (
                <div className={`${style.playerStripItem}`} style={{ opacity: 0.6 }}>
                    <span>👁️</span>
                    <span>{espectadores.length}</span>
                </div>
            )}
        </div>
    );
};
