import { localStates, localEffects } from './localStates';

export const Lobby = () => {
    const {
        style, salas, loadingSalas,
        showCreateModal, setShowCreateModal,
        joinCode, setJoinCode,
        createForm, setCreateForm,
        handleJoin, handleJoinSala, handleCreateSala, refreshSalas,
    } = localStates();
    localEffects();

    const estadoLabel = (estado) => {
        const map = { esperando: 'Esperando', votando: 'Votando', jugando: 'En juego', terminado: 'Terminado' };
        return map[estado] || estado;
    };

    const estadoClass = (estado) => {
        const map = { esperando: style.estadoEsperando, votando: style.estadoVotando, jugando: style.estadoJugando, terminado: style.estadoTerminado };
        return map[estado] || '';
    };

    return (
        <div className={`${style.lobbyPage}`}>
            <div className={`${style.lobbyHeader}`}>
                <div>
                    <h1 className={`${style.lobbyTitle}`}>Adivina la Tarjeta</h1>
                    <p className={`${style.lobbySubtitle}`}>Juega con amigos en tiempo real — adivina quién es antes de que te adivinen a ti</p>
                    <div className={`${style.lobbyOptions}`}>
                        <button className={`${style.btnOption}`} onClick={() => window.location.hash = '#/adivina/tarjetas'}>
                            🗂️ Gestionar Tarjetas
                        </button>
                        <button className={`${style.btnOption}`} onClick={() => window.location.hash = '#/adivina/decks'}>
                            🃏 Gestionar Decks
                        </button>
                    </div>
                </div>
                <button className={`${style.btnPrimary}`} onClick={() => setShowCreateModal(true)}>
                    + Crear Sala
                </button>
            </div>

            <div className={`${style.joinSection}`}>
                <div className={`${style.joinBox}`}>
                    <span className={`${style.joinIcon}`}>🔑</span>
                    <input
                        type="text"
                        placeholder="Código de sala (ej: ABC123)"
                        value={joinCode}
                        onChange={e => setJoinCode(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === 'Enter' && handleJoin()}
                        className={`${style.joinInput}`}
                        maxLength={8}
                    />
                    <button className={`${style.btnSecondary}`} onClick={handleJoin}>
                        Unirse
                    </button>
                </div>
            </div>

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
                                <div className={`${style.salaCardHeader}`}>
                                    <span className={`${style.salaName}`}>{sala.nombre || `Sala ${sala.codigo}`}</span>
                                    <span className={`${style.salaEstado} ${estadoClass(sala.estado)}`}>
                                        {estadoLabel(sala.estado)}
                                    </span>
                                </div>
                                <div className={`${style.salaCardBody}`}>
                                    <div className={`${style.salaInfo}`}>
                                        <span className={`${style.salaCodigo}`}>🔑 {sala.codigo}</span>
                                        <span className={`${style.salaJugadores}`}>
                                            👥 {sala.jugadores_count}/{sala.max_jugadores}
                                        </span>
                                        {sala.creador && (
                                            <span className={`${style.salaCreador}`}>👤 {sala.creador.username}</span>
                                        )}
                                    </div>
                                    {sala.estado === 'esperando' && sala.jugadores_count < sala.max_jugadores && (
                                        <button
                                            className={`${style.btnJoin}`}
                                            onClick={() => handleJoinSala(sala.codigo)}
                                        >
                                            Unirse
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showCreateModal && (
                <div className={`${style.modalOverlay}`} onClick={() => setShowCreateModal(false)}>
                    <div className={`${style.modal}`} onClick={e => e.stopPropagation()}>
                        <div className={`${style.modalHeader}`}>
                            <h3>Crear nueva sala</h3>
                            <button className={`${style.btnClose}`} onClick={() => setShowCreateModal(false)}>✕</button>
                        </div>
                        <div className={`${style.modalBody}`}>
                            <div className={`${style.formGroup}`}>
                                <label>Nombre de la sala (opcional)</label>
                                <input
                                    type="text"
                                    placeholder="Mi sala épica..."
                                    value={createForm.nombre}
                                    onChange={e => setCreateForm(p => ({ ...p, nombre: e.target.value }))}
                                    className={`${style.input}`}
                                />
                            </div>
                            <div className={`${style.formGroup}`}>
                                <label>Máximo de jugadores: <strong>{createForm.max_jugadores}</strong></label>
                                <input
                                    type="range"
                                    min={2}
                                    max={20}
                                    value={createForm.max_jugadores}
                                    onChange={e => setCreateForm(p => ({ ...p, max_jugadores: parseInt(e.target.value) }))}
                                    className={`${style.slider}`}
                                />
                                <div className={`${style.sliderLabels}`}>
                                    <span>2</span><span>20</span>
                                </div>
                            </div>
                            <div className={`${style.formGroup}`}>
                                <label>Visibilidad</label>
                                <div className={`${style.visibilidadRow}`}>
                                    <button
                                        type="button"
                                        className={`${style.btnVisibilidad} ${createForm.visibilidad === 'publica' ? style.btnVisibilidadActive : ''}`}
                                        onClick={() => setCreateForm(p => ({ ...p, visibilidad: 'publica' }))}
                                    >
                                        🌐 Pública
                                    </button>
                                    <button
                                        type="button"
                                        className={`${style.btnVisibilidad} ${createForm.visibilidad === 'privada' ? style.btnVisibilidadActive : ''}`}
                                        onClick={() => setCreateForm(p => ({ ...p, visibilidad: 'privada' }))}
                                    >
                                        🔒 Privada
                                    </button>
                                </div>
                                {createForm.visibilidad === 'privada' && (
                                    <p className={`${style.hint}`}>Solo quienes tengan el código podrán unirse.</p>
                                )}
                            </div>
                        </div>
                        <div className={`${style.modalFooter}`}>
                            <button className={`${style.btnSecondary}`} onClick={() => setShowCreateModal(false)}>
                                Cancelar
                            </button>
                            <button className={`${style.btnPrimary}`} onClick={handleCreateSala}>
                                Crear Sala
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
