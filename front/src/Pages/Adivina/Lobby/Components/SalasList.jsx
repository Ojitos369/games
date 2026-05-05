import { localStates } from '../localStates';

const estadoLabel = (estado) => {
    const map = { esperando: 'Esperando', votando: 'Votando', jugando: 'En juego', terminado: 'Terminado' };
    return map[estado] || estado;
};

export const SalasList = () => {
    const { style, salas, loadingSalas, handleJoinSala, refreshSalas } = localStates();

    const estadoClass = (estado) => {
        const map = {
            esperando: style.estadoEsperando,
            votando: style.estadoVotando,
            jugando: style.estadoJugando,
            terminado: style.estadoTerminado,
        };
        return map[estado] || '';
    };

    return (
        <div className={`${style.salasSection}`}>
            <div className={`${style.salasHeader}`}>
                <h2>Salas Disponibles</h2>
                <button className={`${style.btnIcon}`} onClick={refreshSalas} title="Refrescar">
                    ↺
                </button>
            </div>

            {loadingSalas ? (
                <div className={`${style.loadingState}`}>Cargando salas...</div>
            ) : salas.length === 0 ? (
                <div className={`${style.emptyState}`}>
                    <div className={`${style.emptyIcon}`}>🎭</div>
                    <p>No hay salas activas. ¡Crea una!</p>
                </div>
            ) : (
                <div className={`${style.salasGrid}`}>
                    {salas.map(sala => (
                        <div key={sala.id} className={`${style.salaCard}`}>
                            <div className={`${style.salaCardIcon}`}>🃏</div>
                            <div className={`${style.salaCardInfo}`}>
                                <div className={`${style.salaCardMain}`}>
                                    <span className={`${style.salaName}`}>
                                        {sala.nombre || `Sala de ${sala.creador?.username || sala.codigo}`}
                                    </span>
                                    <span className={`${style.salaEstado} ${estadoClass(sala.estado)}`}>
                                        <span className={`${style.estadoDot}`} />
                                        {estadoLabel(sala.estado)}
                                    </span>
                                </div>
                                <div className={`${style.salaCardMeta}`}>
                                    <span className={`${style.salaCodigo}`}>🔑 {sala.codigo}</span>
                                    <span className={`${style.metaSep}`}>·</span>
                                    <span>👥 {sala.jugadores_count}/{sala.max_jugadores}</span>
                                    {sala.creador && (
                                        <><span className={`${style.metaSep}`}>·</span><span>{sala.creador.username}</span></>
                                    )}
                                </div>
                            </div>
                            {sala.estado === 'esperando' && sala.jugadores_count < sala.max_jugadores ? (
                                <button
                                    className={`${style.btnJoin}`}
                                    onClick={() => handleJoinSala(sala.codigo)}
                                >
                                    Unirse
                                </button>
                            ) : sala.estado === 'jugando' ? (
                                <button className={`${style.btnJoinDisabled}`} disabled>En juego</button>
                            ) : null}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
