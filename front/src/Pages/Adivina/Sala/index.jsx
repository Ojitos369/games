import { useEffect, useState } from 'react';
import { localStates } from './localStates';
import { ImageModal } from '../Components/ImageModal';

export const AdivinaSala = () => {
    const ls = localStates();

    useEffect(() => {
        ls.loadTarjetas();
    }, []);

    useEffect(() => {
        const cleanup = () => {
            // cleanup handled in localStates unmount
        };
        return cleanup;
    }, []);

    const {
        style, codigo, connected, gameState, chatMessages, chatInput, setChatInput,
        voiceEnabled, voiceStates, toggleVoice,
        hearingEnabled, setHearingEnabled, talkingStates,
        selectMode, selectedTarjetas, setSelectedTarjetas,
        voteSelections, toggleVoteSelection,
        preguntaTexto, setPreguntaTexto, preguntaTarget, setPreguntaTarget,
        respuestaValue,
        showAdivinar, setShowAdivinar, adivinarTarget, setAdivinarTarget,
        adivinarNombre, setAdivinarNombre, guessResult, setGuessResult,
        gameOverData, setGameOverData,
        waitingForHost, setWaitingForHost,
        showImageModal, setShowImageModal,
        previewTarget, openPreview,
        isHost, myPlayer, activePlayers, isMyTurn, isEspectador, espectadores, userId,
        tarjetas, decks, tags,
        sendChat, setSeleccionModo, handleSetTarjetas,
        handleOpenVote, handleVoteCast, handleCloseVote, handleStartGame, handleRestartGame,
        handlePregunta, handleRespuesta, handleAdivinar, handleAdvanceTurn, handleKick,
        handleToggleDiscard, handleReaperturar, roomNotFound,
        navigate, getImageUrl, applyDeck,
        tiempoTurno, handleSetTiempoTurno, countdown,
    } = ls;

    if (roomNotFound) {
        return <RoomNotFoundView style={style} codigo={codigo} handleReaperturar={handleReaperturar} navigate={navigate} />;
    }

    const estadoLabel = (estado) => {
        const map = { esperando: 'Esperando', votando: 'Votando', jugando: 'En juego', terminado: 'Terminado' };
        return map[estado] || estado;
    };

    const estadoClass = (estado) => {
        const map = { esperando: style.estadoEsperando, votando: style.estadoVotando, jugando: style.estadoJugando, terminado: style.estadoTerminado };
        return map[estado] || '';
    };

    const jugadoresList = gameState?.jugadores ? Object.values(gameState.jugadores) : [];
    const turnoActualName = gameState?.turno_actual ? (gameState.jugadores?.[gameState.turno_actual]?.username || '?') : '';

    // Pregunta activa
    const preguntaActiva = gameState?.pregunta_actual;
    const meTocaResponder = preguntaActiva?.para === userId;

    return (
        <div className={`${style.salaPage}`}>
            {/* Audio elements for voice */}
            {jugadoresList.map(j => (
                j.user_id !== userId && <audio key={j.user_id} id={`audio-${j.user_id}`} autoPlay />
            ))}

            {/* Header */}
            <div className={`${style.salaHeader}`}>
                <div className={`${style.salaHeaderLeft}`}>
                    <button className={`${style.btnBack}`} onClick={() => navigate('/adivina')}>← Salir</button>
                    <div>
                        <h1 className={`${style.salaTitle}`}>Sala {codigo}</h1>
                        <div className={`${style.salaMeta}`}>
                            <span className={`${style.salaEstado} ${estadoClass(gameState?.estado)}`}>
                                {estadoLabel(gameState?.estado)}
                            </span>
                            <span className={`${style.salaPlayers}`}>
                                👥 {jugadoresList.length} jugadores
                                {espectadores.length > 0 && (
                                    <> · 👁️ {espectadores.length} espectador{espectadores.length !== 1 ? 'es' : ''}</>)}
                            </span>
                            {gameState?.visibilidad === 'privada' ? (
                                <span className={`${style.salaVisibilidad} ${style.visPrivada}`}>🔒 Privada</span>
                            ) : (
                                <span className={`${style.salaVisibilidad} ${style.visPublica}`}>🌐 Pública</span>
                            )}
                            {connected ? (
                                <span className={`${style.salaConn} ${style.connOk}`}>● Conectado</span>
                            ) : (
                                <span className={`${style.salaConn} ${style.connBad}`}>● Reconectando...</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className={`${style.salaHeaderRight}`}>
                    <button
                        className={`${style.btnInvite}`}
                        onClick={() => {
                            const url = `${window.location.origin}/#/adivina/sala/${codigo}`;
                            navigator.clipboard.writeText(url).then(() => {
                                alert('Link de invitación copiado al portapapeles');
                            });
                        }}
                        title="Copiar link de invitación"
                    >
                        🔗 Compartir
                    </button>
                    <button
                        className={`${style.btnHearing} ${!hearingEnabled ? style.btnHearingOff : ''}`}
                        onClick={() => setHearingEnabled(!hearingEnabled)}
                        title={hearingEnabled ? 'Desactivar audio entrante' : 'Activar audio entrante'}
                    >
                        {hearingEnabled ? '🔊' : '🔇'}
                    </button>
                    <button
                        className={`${style.btnVoice} ${voiceEnabled ? style.btnVoiceOn : ''}`}
                        onClick={toggleVoice}
                        title={voiceEnabled ? 'Desactivar voz' : 'Activar voz'}
                    >
                        {voiceEnabled ? '🎙️' : '🎙️'}
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className={`${style.salaBody}`}>
                {/* Players strip - visible only on mobile (sidebar hidden by default) */}
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
                    {espectadores.length > 0 && (
                        <div className={`${style.playerStripItem}`} style={{ opacity: 0.6 }}>
                            <span>👁️</span>
                            <span>{espectadores.length}</span>
                        </div>
                    )}
                </div>

                {/* Center panel */}
                <div className={`${style.centerPanel}`}>
                    {/* ESPERANDO */}
                    {gameState?.estado === 'esperando' && !isEspectador && (
                        <EsperandoView
                            style={style}
                            isHost={isHost}
                            tarjetas={tarjetas}
                            decks={decks}
                            tags={tags}
                            selectedTarjetas={selectedTarjetas}
                            setSelectedTarjetas={setSelectedTarjetas}
                            handleSetTarjetas={handleSetTarjetas}
                            handleStartGame={handleStartGame}
                            jugadoresCount={jugadoresList.length}
                            getImageUrl={getImageUrl}
                            applyDeck={applyDeck}
                            openPreview={openPreview}
                            tiempoTurno={tiempoTurno}
                            handleSetTiempoTurno={handleSetTiempoTurno}
                        />
                    )}

                    {/* JUGANDO */}
                    {gameState?.estado === 'jugando' && !isEspectador && (
                        <JugandoView
                            style={style}
                            gameState={gameState}
                            myPlayer={myPlayer}
                            isMyTurn={isMyTurn}
                            userId={userId}
                            jugadoresList={jugadoresList}
                            preguntaTexto={preguntaTexto}
                            setPreguntaTexto={setPreguntaTexto}
                            preguntaTarget={preguntaTarget}
                            setPreguntaTarget={setPreguntaTarget}
                            preguntaActiva={preguntaActiva}
                            meTocaResponder={meTocaResponder}
                            respuestaValue={respuestaValue}
                            handlePregunta={handlePregunta}
                            handleRespuesta={handleRespuesta}
                            setShowAdivinar={setShowAdivinar}
                            setAdivinarTarget={setAdivinarTarget}
                            handleAdvanceTurn={handleAdvanceTurn}
                            handleToggleDiscard={handleToggleDiscard}
                            isHost={isHost}
                            getImageUrl={getImageUrl}
                            openPreview={openPreview}
                            countdown={countdown}
                            tiempoTurno={tiempoTurno}
                        />
                    )}

                    {/* TERMINADO */}
                    {gameState?.estado === 'terminado' && (
                        <TerminadoView
                            style={style}
                            gameOverData={gameOverData}
                            gameState={gameState}
                            isHost={isHost}
                            waitingForHost={waitingForHost}
                            setWaitingForHost={setWaitingForHost}
                            handleRestartGame={handleRestartGame}
                            navigate={navigate}
                        />
                    )}

                    {/* SPECTATOR BANNER */}
                    {isEspectador && gameState?.estado !== 'terminado' && (
                        <div className={`${style.phaseBox} ${style.espectadorBanner}`}>
                            <h2 className={`${style.phaseTitle}`}>👁️ Modo Espectador</h2>
                            <p className={`${style.phaseDesc}`}>
                                Estás como espectador. Podrás jugar en la siguiente partida.
                            </p>
                            {gameState?.estado === 'jugando' && gameState?.pregunta_actual && (
                                <div className={`${style.preguntaBox}`}>
                                    <div className={`${style.preguntaHeader}`}>
                                        <span className={`${style.preguntaDe}`}>{gameState.pregunta_actual.de_nombre}</span>
                                        <span className={`${style.preguntaArrow}`}>→</span>
                                        <span className={`${style.preguntaPara}`}>{gameState.pregunta_actual.para_nombre}</span>
                                    </div>
                                    <div className={`${style.preguntaTexto}`}>"{gameState.pregunta_actual.texto}"</div>
                                    {gameState.pregunta_actual.respuesta && gameState.pregunta_actual.respuesta !== 'pendiente' && (
                                        <div className={`${style.preguntaRespuesta}`}>
                                            Respuesta: <strong>{gameState.pregunta_actual.respuesta.toUpperCase()}</strong>
                                        </div>
                                    )}
                                </div>
                            )}
                            {gameState?.historial?.length > 0 && (
                                <div className={`${style.historialBox}`}>
                                    <h4 className={`${style.historialTitle}`}>📜 Historial</h4>
                                    <div className={`${style.historialList}`}>
                                        {gameState.historial.slice(-10).map((h, i) => (
                                            <div key={i} className={`${style.historialItem} ${h.tipo === 'adivino' ? (h.correcto ? style.historialSuccess : style.historialDanger) : ''}`}>
                                                {h.tipo === 'adivino' ? (
                                                    <span>
                                                        {h.correcto ? '✅' : '❌'} {h.de_nombre || h.de} intentó adivinar a {h.para_nombre || h.para}: <strong>{h.personaje}</strong>
                                                    </span>
                                                ) : (
                                                    <span>
                                                        <strong>{h.de_nombre}</strong> → <strong>{h.para_nombre}</strong>: "{h.texto}" → <strong>{h.respuesta?.toUpperCase()}</strong>
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Adivinar */}
            {showAdivinar && (
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
                                        <div
                                            key={t.id}
                                            className={`${style.tarjetaPickItemWrapper}`}
                                        >
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
            )}



            {/* Game over modal */}
            {gameOverData && gameState?.estado === 'terminado' && (
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
            )}

            <ImageModal
                show={showImageModal}
                onClose={() => setShowImageModal(false)}
                image={getImageUrl(previewTarget)}
                title={previewTarget?.nombre}
                description={previewTarget?.descripcion}
                tags={previewTarget?.tags}
            />
        </div>
    );
};

// ─── Sub-views ───────────────────────────────────────────────────────────────

function EsperandoView({ style, isHost, tarjetas, decks, tags, selectedTarjetas, setSelectedTarjetas, handleSetTarjetas, handleStartGame, jugadoresCount, getImageUrl, applyDeck, openPreview, tiempoTurno, handleSetTiempoTurno }) {
    const [deckFilter, setDeckFilter] = useState('');
    const [tagFilter, setTagFilter] = useState('');
    const [searchFilter, setSearchFilter] = useState('');

    const filtered = tarjetas.filter(t => {
        const matchSearch = !searchFilter || t.nombre?.toLowerCase().includes(searchFilter.toLowerCase());
        const matchTag = !tagFilter || t.tags?.some(tg => tg.id === tagFilter);
        return matchSearch && matchTag;
    });

    const selectAll = () => {
        const ids = filtered.map(t => t.id);
        setSelectedTarjetas(ids);
        if (isHost) handleSetTarjetas(ids);
    };

    const deselectAll = () => {
        setSelectedTarjetas([]);
        if (isHost) handleSetTarjetas([]);
    };

    const toggleTarjeta = (id) => {
        const next = selectedTarjetas.includes(id)
            ? selectedTarjetas.filter(x => x !== id)
            : [...selectedTarjetas, id];
        setSelectedTarjetas(next);
        if (isHost) handleSetTarjetas(next);
    };

    return (
        <div className={`${style.phaseBox}`}>
            <h2 className={`${style.phaseTitle}`}>🎭 Esperando jugadores</h2>
            <p className={`${style.phaseDesc}`}>El anfitrión debe elegir las tarjetas para jugar y luego iniciar la partida.</p>

            {isHost ? (
                <>
                    <div className={`${style.filterRow}`}>
                        <input
                            type="text"
                            placeholder="Buscar personaje..."
                            value={searchFilter}
                            onChange={e => setSearchFilter(e.target.value)}
                            className={`${style.input}`}
                        />
                        <select className={`${style.select}`} value={tagFilter} onChange={e => setTagFilter(e.target.value)}>
                            <option value="">Todos los tags</option>
                            {tags.map(tg => (
                                <option key={tg.id} value={tg.id}>{tg.nombre}</option>
                            ))}
                        </select>
                        <select className={`${style.select}`} value={deckFilter} onChange={e => { setDeckFilter(e.target.value); applyDeck(e.target.value); }}>
                            <option value="">Elegir deck...</option>
                            {decks.map(d => (
                                <option key={d.id} value={d.id}>{d.nombre} ({d.tarjetas_count})</option>
                            ))}
                        </select>
                        <select className={`${style.select}`} value={tiempoTurno} onChange={e => handleSetTiempoTurno(Number(e.target.value))}>
                            <option value="30">⏳ 30s</option>
                            <option value="45">⏳ 45s</option>
                            <option value="60">⏳ 1 min</option>
                            <option value="90">⏳ 1.5 min</option>
                            <option value="120">⏳ 2 min</option>
                            <option value="0">⏳ Sin límite</option>
                        </select>
                    </div>
                    <div className={`${style.filterRow}`}>
                        <button className={`${style.btnSecondary}`} onClick={selectAll}>Seleccionar visibles</button>
                        <button className={`${style.btnSecondary}`} onClick={deselectAll}>Deseleccionar</button>
                    </div>
                    <div className={`${style.seleccionInfo}`}>
                        <strong>{selectedTarjetas.length}</strong> tarjetas seleccionadas (mínimo {Math.max(jugadoresCount, 2)})
                    </div>
                    <div className={`${style.tarjetasGridSmall}`}>
                        {filtered.map(t => (
                            <div
                                key={t.id}
                                className={`${style.tarjetaPickItemWrapper}`}
                            >
                                <div
                                    className={`${style.tarjetaPickItem} ${selectedTarjetas.includes(t.id) ? style.tarjetaPickActive : ''}`}
                                    onClick={() => toggleTarjeta(t.id)}
                                >
                                    {t.imagen_url ? (
                                        <img src={getImageUrl(t.imagen_url)} alt="" className={`${style.tarjetaPickImg}`} />
                                    ) : (
                                        <div className={`${style.tarjetaPickPlaceholder}`}>🎭</div>
                                    )}
                                    <span className={`${style.tarjetaPickName}`}>{t.nombre}</span>
                                </div>
                                <button className={style.btnFloatPreview} onClick={() => openPreview(t)} title="Ver detalles">👁️</button>
                            </div>
                        ))}
                    </div>
                    <button
                        className={`${style.btnPrimary} ${style.btnStart}`}
                        onClick={handleStartGame}
                        disabled={selectedTarjetas.length < Math.max(jugadoresCount, 2)}
                    >
                        Iniciar Partida
                    </button>
                </>
            ) : (
                <div className={`${style.waitingHost}`}>
                    <div className={`${style.spinner}`}>⏳</div>
                    <p>Esperando a que el anfitrión configure la partida...</p>
                </div>
            )}
        </div>
    );
}

function VotandoView({ style, tarjetas, voteSelections, toggleVoteSelection, handleVoteCast, isHost, handleCloseVote, getImageUrl, gameState, openPreview }) {
    const votosCount = gameState?.seleccion?.votos_count || {};

    return (
        <div className={`${style.phaseBox}`}>
            <h2 className={`${style.phaseTitle}`}>🗳️ Votación en curso</h2>
            <p className={`${style.phaseDesc}`}>Selecciona las tarjetas que quieres que se jueguen. El anfitrión cerrará la votación cuando todos hayan votado.</p>
            <div className={`${style.seleccionInfo}`}>
                <strong>{voteSelections.length}</strong> seleccionadas
            </div>
            <div className={`${style.tarjetasGridSmall}`}>
                {tarjetas.map(t => (
                    <div
                        key={t.id}
                        className={`${style.tarjetaPickItemWrapper}`}
                    >
                        <div
                            className={`${style.tarjetaPickItem} ${voteSelections.includes(t.id) ? style.tarjetaPickActive : ''}`}
                            onClick={() => toggleVoteSelection(t.id)}
                        >
                            {t.imagen_url ? (
                                <img src={getImageUrl(t.imagen_url)} alt="" className={`${style.tarjetaPickImg}`} />
                            ) : (
                                <div className={`${style.tarjetaPickPlaceholder}`}>🎭</div>
                            )}
                            <span className={`${style.tarjetaPickName}`}>{t.nombre}</span>
                            {votosCount[t.id] > 0 && (
                                <div className={`${style.voteBadge}`}>{votosCount[t.id]}</div>
                            )}
                        </div>
                        <button className={style.btnFloatPreview} onClick={() => openPreview(t)} title="Ver detalles">👁️</button>
                    </div>
                ))}
            </div>
            <div className={`${style.voteActions}`}>
                <button className={`${style.btnPrimary}`} onClick={handleVoteCast}>Votar</button>
                {isHost && (
                    <button className={`${style.btnSecondary}`} onClick={handleCloseVote}>Cerrar votación</button>
                )}
            </div>
        </div>
    );
}

function JugandoView({ style, gameState, myPlayer, isMyTurn, userId, jugadoresList, preguntaTexto, setPreguntaTexto, preguntaTarget, setPreguntaTarget, preguntaActiva, meTocaResponder, respuestaValue, handlePregunta, handleRespuesta, setShowAdivinar, setAdivinarTarget, handleAdvanceTurn, handleToggleDiscard, isHost, getImageUrl, openPreview, countdown, tiempoTurno }) {
    const myTarjeta = myPlayer?.tarjeta;
    const myDiscards = myPlayer?.discards || [];
    const tarjetasDisponibles = gameState?.seleccion?.tarjetas_disponibles || [];

    const targetId = gameState?.jugador_objetivo;
    const targetName = gameState?.jugadores?.[targetId]?.username || '???';
    const guesserId = gameState?.turno_actual;
    const guesserName = gameState?.jugadores?.[guesserId]?.username || '???';

    const meTocaPreguntar = isMyTurn;

    // Tabs for discards
    const [viewTargetId, setViewTargetId] = useState(targetId);

    useEffect(() => {
        if (targetId) setViewTargetId(targetId);
    }, [targetId]);

    const targetPlayers = jugadoresList.filter(p => p.user_id !== userId && !p.eliminado);
    const currentViewName = gameState?.jugadores?.[viewTargetId]?.username || '???';
    const currentViewDiscards = (myPlayer?.discards && myPlayer.discards[viewTargetId]) || [];

    // Set automatic target for UI consistency
    useEffect(() => {
        if (targetId) setPreguntaTarget(targetId);
    }, [targetId, setPreguntaTarget]);

    return (
        <div className={`${style.phaseBox}`}>
            {/* Turn Pairing Header */}
            <div className={`${style.turnPairing}`}>
                <div className={`${style.turnRole}`}>
                    <span className={`${style.roleLabel}`}>Pregunta:</span>
                    <span className={`${style.roleName} ${guesserId === userId ? style.roleMe : ''}`}>{guesserName}</span>
                </div>
                <div className={`${style.turnArrow}`}>➔</div>
                <div className={`${style.turnRole}`}>
                    <span className={`${style.roleLabel}`}>Adivina a:</span>
                    <span className={`${style.roleName} ${targetId === userId ? style.roleMe : ''}`}>{targetName}</span>
                </div>
            </div>

            {/* Turn Timer */}
            {tiempoTurno > 0 && (
                <div className={`${style.timerContainer} ${countdown <= 10 ? style.timerDanger : ''}`}>
                    <div className={`${style.timerBar}`} style={{ width: `${(countdown / tiempoTurno) * 100}%` }}></div>
                    <span className={`${style.timerText}`}>{countdown}s</span>
                </div>
            )}

            {/* Mi tarjeta secreta */}
            <div className={`${style.myTarjetaBox}`}>
                <span className={`${style.myTarjetaLabel}`}>Tu personaje secreto:</span>
                {myTarjeta ? (
                    <div className={`${style.myTarjetaCard}`} onClick={() => openPreview(myTarjeta)} style={{ cursor: 'pointer' }}>
                        {myTarjeta.imagen_url ? (
                            <img src={getImageUrl(myTarjeta.imagen_url)} alt="" className={`${style.myTarjetaImg}`} />
                        ) : (
                            <div className={`${style.myTarjetaPlaceholder}`}>🎭</div>
                        )}
                        <span className={`${style.myTarjetaName}`}>{myTarjeta.nombre}</span>
                    </div>
                ) : (
                    <span className={`${style.myTarjetaUnknown}`}>???</span>
                )}
            </div>

            {/* Turno / Acciones */}
            {meTocaPreguntar && (
                <div className={`${style.turnoActions}`}>
                    <h3 className={`${style.turnoTitle}`}>🎯 Es tu turno de preguntar a {targetName}</h3>
                    <div className={`${style.actionRow}`}>
                        {!preguntaActiva ? (
                            <>
                                <div className={`${style.formGroup} ${style.flexGrow}`}>
                                    <label>Tu pregunta (Sí/No/Quizás):</label>
                                    <input
                                        type="text"
                                        className={`${style.input}`}
                                        value={preguntaTexto}
                                        onChange={e => setPreguntaTexto(e.target.value)}
                                        placeholder="Ej: ¿Tu personaje es hombre?"
                                        onKeyDown={e => e.key === 'Enter' && handlePregunta()}
                                    />
                                </div>
                                <button className={`${style.btnPrimary}`} onClick={handlePregunta} disabled={!preguntaTexto.trim()}>Preguntar</button>
                                <button
                                    className={`${style.btnSecondary}`}
                                    onClick={() => { setAdivinarTarget(targetId); setShowAdivinar(true); }}
                                >
                                    🤔 Adivinar
                                </button>
                            </>
                        ) : (
                            <div className={`${style.formGroup} ${style.flexGrow}`}>
                                <p className={`${style.turnFinishingHint}`}>
                                    {preguntaActiva.respuesta && preguntaActiva.respuesta !== 'pendiente' 
                                        ? '¡Respuesta recibida! Puedes descartar tarjetas y luego finalizar tu turno.'
                                        : `Espera a que ${targetName} responda por chat o voz, luego finaliza tu turno.`}
                                </p>
                                <button className={`${style.btnPrimary} ${style.btnFinishTurn}`} onClick={handleAdvanceTurn}>
                                    Finalizar Turno ✓
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Pregunta activa */}
            {preguntaActiva && (
                <div className={`${style.preguntaBox}`}>
                    <div className={`${style.preguntaHeader}`}>
                        <span className={`${style.preguntaDe}`}>{preguntaActiva.de_nombre}</span>
                        <span className={`${style.preguntaArrow}`}>→</span>
                        <span className={`${style.preguntaPara}`}>{preguntaActiva.para_nombre}</span>
                    </div>
                    <div className={`${style.preguntaTexto}`}>"{preguntaActiva.texto}"</div>

                    {meTocaResponder && (preguntaActiva.respuesta === 'pendiente' || !preguntaActiva.respuesta) && (
                        <div className={`${style.respuestaButtons}`}>
                            <button className={`${style.btnRespuestaSi}`} onClick={() => handleRespuesta('si')}>SÍ</button>
                            <button className={`${style.btnRespuestaNo}`} onClick={() => handleRespuesta('no')}>NO</button>
                            <button className={`${style.btnRespuestaQuizas}`} onClick={() => handleRespuesta('quizas')}>QUIZÁS</button>
                        </div>
                    )}

                    {preguntaActiva.respuesta && preguntaActiva.respuesta !== 'pendiente' ? (
                        <div className={`${style.preguntaRespuesta}`}>
                            Respuesta: <strong>{preguntaActiva.respuesta.toUpperCase()}</strong>
                        </div>
                    ) : (
                        <div className={`${style.respuestaWaiting}`}>
                            {meTocaResponder ? 'Selecciona una respuesta arriba' : `Esperando respuesta de ${preguntaActiva.para_nombre}...`}
                        </div>
                    )}
                </div>
            )}

            {!meTocaPreguntar && !preguntaActiva && (
                <div className={`${style.waitingTurn}`}>
                    Esperando que <strong>{guesserName}</strong> le pregunte a <strong>{targetName}</strong>
                </div>
            )}

            {/* Historial */}
            {gameState?.historial?.length > 0 && (
                <div className={`${style.historialBox}`}>
                    <h4 className={`${style.historialTitle}`}>📜 Historial</h4>
                    <div className={`${style.historialList}`}>
                        {gameState.historial.slice(-5).map((h, i) => (
                            <div key={i} className={`${style.historialItem} ${h.tipo === 'adivino' ? (h.correcto ? style.historialSuccess : style.historialDanger) : ''}`}>
                                {h.tipo === 'adivino' ? (
                                    <span>
                                        {h.correcto ? '✅' : '❌'} {h.de_nombre || h.de} intentó adivinar a {h.para_nombre || h.para}: <strong>{h.personaje}</strong>
                                    </span>
                                ) : (
                                    <span>
                                        <strong>{h.de_nombre}</strong> → <strong>{h.para_nombre}</strong>: "{h.texto}" → <strong>{h.respuesta?.toUpperCase()}</strong>
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Personajes en juego (Catálogo para descartar) */}
            {targetId !== userId && (
                <div className={`${style.catalogBox}`}>
                    <div className={`${style.tabsContainer}`}>
                        {targetPlayers.map(p => (
                            <button
                                key={p.user_id}
                                className={`${style.tabItem} ${p.user_id === viewTargetId ? style.tabActive : ''} ${p.user_id === targetId ? style.tabCurrentTurn : ''}`}
                                onClick={() => setViewTargetId(p.user_id)}
                                title={p.user_id === targetId ? 'Turno de responder' : ''}
                            >
                                {p.username}
                            </button>
                        ))}
                    </div>
                    <h4 className={`${style.catalogTitle}`}>🎭 Personajes de {currentViewName} (clic para descartar)</h4>
                    <div className={`${style.tarjetasGridSmall}`}>
                        {tarjetasDisponibles.map(t => (
                            <div
                                key={t.id}
                                className={`${style.tarjetaPickItemWrapper}`}
                            >
                                <div
                                    className={`${style.tarjetaPickItem} ${currentViewDiscards.includes(t.id) ? style.tarjetaDiscarded : ''}`}
                                    onClick={() => handleToggleDiscard(t.id, viewTargetId)}
                                    title={currentViewDiscards.includes(t.id) ? 'Desmarcar' : 'Descartar'}
                                >
                                    {t.imagen_url ? (
                                        <img src={getImageUrl(t.imagen_url)} alt="" className={`${style.tarjetaPickImg}`} />
                                    ) : (
                                        <div className={`${style.tarjetaPickPlaceholder}`}>🎭</div>
                                    )}
                                    <span className={`${style.tarjetaPickName}`}>{t.nombre}</span>
                                    {currentViewDiscards.includes(t.id) && <div className={`${style.discardOverlay}`}>❌</div>}
                                </div>
                                <button className={style.btnFloatPreview} onClick={() => openPreview(t)} title="Ver detalles">👁️</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isMyTurn && !preguntaActiva && (
                <button className={`${style.btnSecondary} ${style.btnSkip}`} onClick={handleAdvanceTurn}>
                    Saltar turno →
                </button>
            )}
        </div>
    );
}

function TerminadoView({ style, gameOverData, gameState, isHost, waitingForHost, setWaitingForHost, handleRestartGame, navigate }) {
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
}

const RoomNotFoundView = ({ style, codigo, handleReaperturar, navigate }) => {
    return (
        <div className={style.salaPage}>
            <div className={style.centerPanel} style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '2rem' }}>
                <div className={style.espectadorBanner} style={{ maxWidth: '500px', borderStyle: 'solid' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏚️</div>
                    <h2 className={style.phaseTitle} style={{ color: 'var(--my-danger)' }}>Sala no disponible</h2>
                    <p className={style.phaseDesc} style={{ marginBottom: '2rem' }}>
                        La sala con código <strong>{codigo}</strong> ya no existe o ha caducado.
                    </p>
                    <div className={style.voteActions} style={{ flexDirection: 'column' }}>
                        <button className={`${style.btnPrimary} ${style.btnStart}`} onClick={handleReaperturar}>
                            ✨ Reaperturar Sala
                        </button>
                        <button className={`${style.btnSecondary}`} onClick={() => navigate('/adivina')} style={{ marginTop: '0.5rem' }}>
                            🚪 Regresar al Lobby
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


