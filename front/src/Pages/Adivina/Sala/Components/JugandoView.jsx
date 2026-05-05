import { useState, useEffect } from 'react';
import { subStates } from '../localStates';

export const JugandoView = () => {
    const {
        style, gameState, myPlayer, isMyTurn, userId,
        preguntaTexto, setPreguntaTexto, setPreguntaTarget,
        handlePregunta, handleRespuesta, handleAdvanceTurn,
        handleToggleDiscard, setShowAdivinar, setAdivinarTarget,
        getImageUrl, openPreview, countdown, tiempoTurno,
    } = subStates();

    if (!gameState) return null;

    const myTarjeta = myPlayer?.tarjeta;
    const tarjetasDisponibles = gameState?.seleccion?.tarjetas_disponibles || [];

    const targetId = gameState?.jugador_objetivo;
    const targetName = gameState?.jugadores?.[targetId]?.username || '???';
    const guesserId = gameState?.turno_actual;
    const guesserName = gameState?.jugadores?.[guesserId]?.username || '???';

    const meTocaPreguntar = isMyTurn;
    const preguntaActiva = gameState?.pregunta_actual;
    const meTocaResponder = preguntaActiva?.para === userId;

    const jugadoresList = gameState?.jugadores ? Object.values(gameState.jugadores) : [];
    const targetPlayers = jugadoresList.filter(p => p.user_id !== userId && !p.eliminado);

    const [viewTargetId, setViewTargetId] = useState(targetId);

    useEffect(() => {
        if (targetId) setViewTargetId(targetId);
    }, [targetId]);

    useEffect(() => {
        if (targetId) setPreguntaTarget(targetId);
    }, [targetId]);

    const currentViewName = gameState?.jugadores?.[viewTargetId]?.username || '???';
    const currentViewDiscards = (myPlayer?.discards && myPlayer.discards[viewTargetId]) || [];

    return (
        <div className={`${style.phaseBox}`}>
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

            {tiempoTurno > 0 && (
                <div className={`${style.timerContainer} ${countdown <= 10 ? style.timerDanger : ''}`}>
                    <div className={`${style.timerBar}`} style={{ width: `${(countdown / tiempoTurno) * 100}%` }}></div>
                    <span className={`${style.timerText}`}>{countdown}s</span>
                </div>
            )}

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
                                        value={preguntaTexto || ''}
                                        onChange={e => setPreguntaTexto(e.target.value)}
                                        placeholder="Ej: ¿Tu personaje es hombre?"
                                        onKeyDown={e => e.key === 'Enter' && handlePregunta()}
                                    />
                                </div>
                                <button className={`${style.btnPrimary}`} onClick={handlePregunta} disabled={!(preguntaTexto || '').trim()}>Preguntar</button>
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
                            <div key={t.id} className={`${style.tarjetaPickItemWrapper}`}>
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
};
