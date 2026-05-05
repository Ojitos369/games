import { useState } from 'react';
import { subStates } from '../localStates';

export const EsperandoView = () => {
    const {
        style, gameState, isHost, tarjetas, decks, tags,
        selectedTarjetas, setSelectedTarjetas,
        handleSetTarjetas, handleStartGame,
        getImageUrl, applyDeck, openPreview,
        tiempoTurno, handleSetTiempoTurno,
    } = subStates();

    const [deckFilter, setDeckFilter] = useState('');
    const [tagFilter, setTagFilter] = useState('');
    const [searchFilter, setSearchFilter] = useState('');

    if (!gameState) return null;

    const jugadoresCount = gameState?.jugadores ? Object.keys(gameState.jugadores).length : 0;

    const filtered = (tarjetas || []).filter(t => {
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
        const next = (selectedTarjetas || []).includes(id)
            ? selectedTarjetas.filter(x => x !== id)
            : [...(selectedTarjetas || []), id];
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
                            {(tags || []).map(tg => (
                                <option key={tg.id} value={tg.id}>{tg.nombre}</option>
                            ))}
                        </select>
                        <select className={`${style.select}`} value={deckFilter} onChange={e => { setDeckFilter(e.target.value); applyDeck(e.target.value); }}>
                            <option value="">Elegir deck...</option>
                            {(decks || []).map(d => (
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
                        <strong>{(selectedTarjetas || []).length}</strong> tarjetas seleccionadas (mínimo {Math.max(jugadoresCount, 2)})
                    </div>
                    <div className={`${style.tarjetasGridSmall}`}>
                        {filtered.map(t => (
                            <div key={t.id} className={`${style.tarjetaPickItemWrapper}`}>
                                <div
                                    className={`${style.tarjetaPickItem} ${(selectedTarjetas || []).includes(t.id) ? style.tarjetaPickActive : ''}`}
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
                        disabled={(selectedTarjetas || []).length < Math.max(jugadoresCount, 2)}
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
};
