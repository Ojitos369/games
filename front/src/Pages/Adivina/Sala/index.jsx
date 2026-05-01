import { useEffect, useState } from 'react';
import { localStates } from './localStates';

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
        selectMode, selectedTarjetas, setSelectedTarjetas,
        voteSelections, toggleVoteSelection,
        preguntaTexto, setPreguntaTexto, preguntaTarget, setPreguntaTarget,
        respuestaValue,
        showAdivinar, setShowAdivinar, adivinarTarget, setAdivinarTarget,
        adivinarNombre, setAdivinarNombre, guessResult,
        gameOverData,
        isHost, myPlayer, activePlayers, isMyTurn, userId,
        tarjetas, decks, tags,
        sendChat, setSeleccionModo, handleSetTarjetas,
        handleOpenVote, handleVoteCast, handleCloseVote, handleStartGame,
        handlePregunta, handleRespuesta, handleAdivinar, handleAdvanceTurn, handleKick,
        navigate, getImageUrl, applyDeck,
    } = ls;

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
                    {gameState?.visibilidad === 'privada' && (
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
                    )}
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
                {/* Players panel */}
                <div className={`${style.playersPanel}`}>
                    <h3 className={`${style.panelTitle}`}>Jugadores</h3>
                    <div className={`${style.playersList}`}>
                        {jugadoresList.map(j => (
                            <div key={j.user_id} className={`${style.playerItem} ${j.eliminado ? style.playerEliminado : ''} ${j.user_id === gameState?.turno_actual ? style.playerTurno : ''}`}>
                                <div className={`${style.playerAvatar}`}>
                                    {j.user_id === gameState?.creador_id ? '👑' : '👤'}
                                </div>
                                <div className={`${style.playerInfo}`}>
                                    <span className={`${style.playerName}`}>{j.username}</span>
                                    {j.eliminado && <span className={`${style.playerBadge}`}>Eliminado</span>}
                                    {j.user_id === gameState?.turno_actual && <span className={`${style.playerBadgeTurno}`}>Turno</span>}
                                    {voiceStates[j.user_id] && <span className={`${style.playerBadgeVoice}`}>🎙️</span>}
                                </div>
                                {isHost && gameState?.estado === 'esperando' && j.user_id !== userId && (
                                    <button className={`${style.btnKick}`} onClick={() => handleKick(j.user_id)} title="Expulsar">✕</button>
                                )}
                            </div>
                        ))}
                    </div>

                    {gameState?.estado === 'jugando' && (
                        <div className={`${style.turnoBox}`}>
                            <div className={`${style.turnoLabel}`}>Turno de</div>
                            <div className={`${style.turnoName}`}>{turnoActualName}</div>
                        </div>
                    )}
                </div>

                {/* Center panel */}
                <div className={`${style.centerPanel}`}>
                    {/* ESPERANDO */}
                    {gameState?.estado === 'esperando' && (
                        <EsperandoView
                            style={style}
                            isHost={isHost}
                            selectMode={selectMode}
                            setSeleccionModo={setSeleccionModo}
                            tarjetas={tarjetas}
                            decks={decks}
                            tags={tags}
                            selectedTarjetas={selectedTarjetas}
                            setSelectedTarjetas={setSelectedTarjetas}
                            handleSetTarjetas={handleSetTarjetas}
                            handleOpenVote={handleOpenVote}
                            handleStartGame={handleStartGame}
                            jugadoresCount={jugadoresList.length}
                            getImageUrl={getImageUrl}
                            applyDeck={applyDeck}
                        />
                    )}

                    {/* VOTANDO */}
                    {gameState?.estado === 'votando' && (
                        <VotandoView
                            style={style}
                            tarjetas={gameState?.seleccion?.tarjetas_disponibles || []}
                            voteSelections={voteSelections}
                            toggleVoteSelection={toggleVoteSelection}
                            handleVoteCast={handleVoteCast}
                            isHost={isHost}
                            handleCloseVote={handleCloseVote}
                            getImageUrl={getImageUrl}
                        />
                    )}

                    {/* JUGANDO */}
                    {gameState?.estado === 'jugando' && (
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
                            isHost={isHost}
                            getImageUrl={getImageUrl}
                        />
                    )}

                    {/* TERMINADO */}
                    {gameState?.estado === 'terminado' && (
                        <TerminadoView
                            style={style}
                            gameOverData={gameOverData}
                            gameState={gameState}
                            isHost={isHost}
                        />
                    )}
                </div>

                {/* Chat panel */}
                <div className={`${style.chatPanel}`}>
                    <h3 className={`${style.panelTitle}`}>Chat</h3>
                    <div className={`${style.chatMessages}`}>
                        {chatMessages.map((msg, i) => (
                            <div key={i} className={`${msg.system ? style.chatSystem : style.chatMsg}`}>
                                {msg.system ? (
                                    <span className={`${style.chatSystemText}`}>{msg.text}</span>
                                ) : (
                                    <>
                                        <span className={`${style.chatFrom}`}>{msg.from_name}:</span>
                                        <span className={`${style.chatText}`}>{msg.text}</span>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className={`${style.chatInputRow}`}>
                        <input
                            type="text"
                            placeholder="Escribe un mensaje..."
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendChat()}
                            className={`${style.chatInput}`}
                        />
                        <button className={`${style.btnSend}`} onClick={sendChat}>➤</button>
                    </div>
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
                                <select
                                    className={`${style.select}`}
                                    value={adivinarTarget}
                                    onChange={e => setAdivinarTarget(e.target.value)}
                                >
                                    <option value="">Selecciona...</option>
                                    {jugadoresList.filter(j => j.user_id !== userId && !j.eliminado).map(j => (
                                        <option key={j.user_id} value={j.user_id}>{j.username}</option>
                                    ))}
                                </select>
                            </div>
                            <p className={`${style.modalHint}`}>Haz clic en la tarjeta que crees que tiene {adivinarTarget ? (jugadoresList.find(j => j.user_id === adivinarTarget)?.username || '') : 'el jugador'}:</p>
                            <div className={`${style.tarjetasGridSmall}`}>
                                {(gameState?.seleccion?.tarjetas_disponibles || []).map(t => (
                                    <div
                                        key={t.id}
                                        className={`${style.tarjetaPickItem} ${adivinarNombre === t.nombre ? style.tarjetaPickActive : ''}`}
                                        onClick={() => setAdivinarNombre(t.nombre)}
                                    >
                                        {t.imagen_url ? (
                                            <img src={getImageUrl(t.imagen_url)} alt="" className={`${style.tarjetaPickImg}`} />
                                        ) : (
                                            <div className={`${style.tarjetaPickPlaceholder}`}>🎭</div>
                                        )}
                                        <span className={`${style.tarjetaPickName}`}>{t.nombre}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className={`${style.modalFooter}`}>
                            <button className={`${style.btnSecondary}`} onClick={() => setShowAdivinar(false)}>Cancelar</button>
                            <button className={`${style.btnPrimary}`} onClick={handleAdivinar} disabled={!adivinarTarget || !adivinarNombre}>Adivinar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Guess result toast */}
            {guessResult && (
                <div className={`${style.toastOverlay}`}>
                    <div className={`${style.toast} ${guessResult.correct ? style.toastSuccess : style.toastError}`}>
                        <div className={`${style.toastTitle}`}>
                            {guessResult.correct ? '✅ ¡Adivinaste!' : '❌ Fallaste'}
                        </div>
                        <div className={`${style.toastBody}`}>
                            <p>{guessResult.from_name} intentó adivinar a <strong>{guessResult.target_name}</strong></p>
                            <p>Personaje: <strong>{guessResult.personaje}</strong></p>
                            {guessResult.revealed && (
                                <p>Era: <strong>{guessResult.revealed.nombre}</strong></p>
                            )}
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
                        <div className={`${style.modalBody}`}>
                            <div className={`${style.winnerBox}`}>
                                <div className={`${style.winnerCrown}`}>👑</div>
                                <div className={`${style.winnerName}`}>{gameOverData.ganador_username}</div>
                                <div className={`${style.winnerLabel}`}>Ganador</div>
                            </div>
                            <div className={`${style.revealGrid}`}>
                                {Object.entries(gameOverData.jugadores || {}).map(([uid, p]) => (
                                    <div key={uid} className={`${style.revealCard}`}>
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
                        <div className={`${style.modalFooter}`}>
                            <button className={`${style.btnSecondary}`} onClick={() => navigate('/adivina')}>Volver al Lobby</button>
                            {isHost && (
                                <button className={`${style.btnPrimary}`} onClick={() => window.location.reload()}>Nueva Partida</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Sub-views ───────────────────────────────────────────────────────────────

function EsperandoView({ style, isHost, selectMode, setSeleccionModo, tarjetas, decks, tags, selectedTarjetas, setSelectedTarjetas, handleSetTarjetas, handleOpenVote, handleStartGame, jugadoresCount, getImageUrl, applyDeck }) {
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
                    <div className={`${style.seleccionModoRow}`}>
                        <button
                            className={`${style.btnModo} ${selectMode === 'host' ? style.btnModoActive : ''}`}
                            onClick={() => setSeleccionModo('host')}
                        >
                            Yo elijo
                        </button>
                        <button
                            className={`${style.btnModo} ${selectMode === 'votacion' ? style.btnModoActive : ''}`}
                            onClick={() => setSeleccionModo('votacion')}
                        >
                            Votación
                        </button>
                    </div>

                    {selectMode === 'host' && (
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
                    )}

                    {selectMode === 'votacion' && (
                        <>
                            <p className={`${style.phaseDesc}`}>Abre la votación para que todos elijan las tarjetas. Después ciérrala para iniciar.</p>
                            <div className={`${style.filterRow}`}>
                                <input
                                    type="text"
                                    placeholder="Buscar personaje..."
                                    value={searchFilter}
                                    onChange={e => setSearchFilter(e.target.value)}
                                    className={`${style.input}`}
                                />
                            </div>
                            <div className={`${style.tarjetasGridSmall}`}>
                                {filtered.map(t => (
                                    <div key={t.id} className={`${style.tarjetaPickItem}`}>
                                        {t.imagen_url ? (
                                            <img src={getImageUrl(t.imagen_url)} alt="" className={`${style.tarjetaPickImg}`} />
                                        ) : (
                                            <div className={`${style.tarjetaPickPlaceholder}`}>🎭</div>
                                        )}
                                        <span className={`${style.tarjetaPickName}`}>{t.nombre}</span>
                                    </div>
                                ))}
                            </div>
                            <button className={`${style.btnPrimary} ${style.btnStart}`} onClick={() => handleOpenVote(filtered.map(t => t.id))}>
                                Abrir Votación
                            </button>
                        </>
                    )}
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

function VotandoView({ style, tarjetas, voteSelections, toggleVoteSelection, handleVoteCast, isHost, handleCloseVote, getImageUrl }) {
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
                        className={`${style.tarjetaPickItem} ${voteSelections.includes(t.id) ? style.tarjetaPickActive : ''}`}
                        onClick={() => toggleVoteSelection(t.id)}
                    >
                        {t.imagen_url ? (
                            <img src={getImageUrl(t.imagen_url)} alt="" className={`${style.tarjetaPickImg}`} />
                        ) : (
                            <div className={`${style.tarjetaPickPlaceholder}`}>🎭</div>
                        )}
                        <span className={`${style.tarjetaPickName}`}>{t.nombre}</span>
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

function JugandoView({ style, gameState, myPlayer, isMyTurn, userId, jugadoresList, preguntaTexto, setPreguntaTexto, preguntaTarget, setPreguntaTarget, preguntaActiva, meTocaResponder, respuestaValue, handlePregunta, handleRespuesta, setShowAdivinar, setAdivinarTarget, handleAdvanceTurn, isHost, getImageUrl }) {
    const myTarjeta = myPlayer?.tarjeta;

    return (
        <div className={`${style.phaseBox}`}>
            {/* Mi tarjeta secreta */}
            <div className={`${style.myTarjetaBox}`}>
                <span className={`${style.myTarjetaLabel}`}>Tu personaje secreto:</span>
                {myTarjeta ? (
                    <div className={`${style.myTarjetaCard}`}>
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
            {isMyTurn && !preguntaActiva && (
                <div className={`${style.turnoActions}`}>
                    <h3 className={`${style.turnoTitle}`}>🎯 Es tu turno</h3>
                    <div className={`${style.actionRow}`}>
                        <div className={`${style.formGroup}`}>
                            <label>Preguntar a:</label>
                            <select
                                className={`${style.select}`}
                                value={preguntaTarget}
                                onChange={e => setPreguntaTarget(e.target.value)}
                            >
                                <option value="">Selecciona jugador...</option>
                                {jugadoresList.filter(j => j.user_id !== userId && !j.eliminado).map(j => (
                                    <option key={j.user_id} value={j.user_id}>{j.username}</option>
                                ))}
                            </select>
                        </div>
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
                        <button className={`${style.btnPrimary}`} onClick={handlePregunta}>Preguntar</button>
                        <button
                            className={`${style.btnSecondary}`}
                            onClick={() => { setAdivinarTarget(''); setShowAdivinar(true); }}
                        >
                            🤔 Adivinar
                        </button>
                    </div>
                </div>
            )}

            {/* Pregunta activa */}
            {preguntaActiva && (
                <div className={`${style.preguntaBox} ${meTocaResponder ? style.preguntaBoxActive : ''}`}>
                    <div className={`${style.preguntaHeader}`}>
                        <span className={`${style.preguntaDe}`}>{preguntaActiva.de_nombre}</span>
                        <span className={`${style.preguntaArrow}`}>→</span>
                        <span className={`${style.preguntaPara}`}>{preguntaActiva.para_nombre}</span>
                    </div>
                    <div className={`${style.preguntaTexto}`}>"{preguntaActiva.texto}"</div>
                    {meTocaResponder ? (
                        <div className={`${style.respuestaButtons}`}>
                            <button className={`${style.btnRespuestaSi}`} onClick={() => handleRespuesta('si')}>Sí</button>
                            <button className={`${style.btnRespuestaNo}`} onClick={() => handleRespuesta('no')}>No</button>
                            <button className={`${style.btnRespuestaQuizas}`} onClick={() => handleRespuesta('quizas')}>Quizás</button>
                        </div>
                    ) : (
                        <div className={`${style.respuestaWaiting}`}>Esperando respuesta...</div>
                    )}
                </div>
            )}

            {!isMyTurn && !preguntaActiva && (
                <div className={`${style.waitingTurn}`}>
                    Esperando turno de <strong>{gameState?.jugadores?.[gameState?.turno_actual]?.username}</strong>
                </div>
            )}

            {/* Historial */}
            {gameState?.historial?.length > 0 && (
                <div className={`${style.historialBox}`}>
                    <h4 className={`${style.historialTitle}`}>📜 Historial</h4>
                    <div className={`${style.historialList}`}>
                        {gameState.historial.slice(-10).map((h, i) => (
                            <div key={i} className={`${style.historialItem}`}>
                                {h.tipo === 'adivino' ? (
                                    <span>
                                        {h.correcto ? '✅' : '❌'} {h.de} adivinó a {h.para}: {h.personaje}
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

            {(isHost || isMyTurn) && !preguntaActiva && (
                <button className={`${style.btnSecondary} ${style.btnSkip}`} onClick={handleAdvanceTurn}>
                    Saltar turno →
                </button>
            )}
        </div>
    );
}

function TerminadoView({ style, gameOverData, gameState, isHost }) {
    return (
        <div className={`${style.phaseBox}`}>
            <h2 className={`${style.phaseTitle}`}>🏁 Partida terminada</h2>
            <div className={`${style.waitingHost}`}>
                <p>Revisa los resultados en el modal. ¡Gracias por jugar!</p>
            </div>
        </div>
    );
}


