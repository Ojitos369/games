import { localStates } from "./localStates";

export const TopPanels = () => {
    const {
        styles, level, worldRecords, topPlayers,
        popularLevels, recentLevels,
        openUserRecordsModal, fetchLevel, formatTime,
    } = localStates();

    return (
        <div className={styles.topPanelsSection}>
            {/* Top 10 del nivel actual */}
            <div className={styles.topPanel}>
                <h3 className={styles.panelTitleYellow}>
                    🏆 Top 10 de <span style={{ opacity: 0.6, color: '#fff' }}>
                        #{level?.id ? level.id.substring(0, 8) : '...'}
                    </span>
                </h3>
                <div className={styles.panelContent}>
                    {worldRecords.length === 0 ? (
                        <p className={styles.emptyMessage}>Sin récords aún.</p>
                    ) : (
                        worldRecords.map((r, i) => (
                            <div key={i} className={styles.recordRow}>
                                <span
                                    className={`${styles.recordName} ${i === 0 ? styles.recordFirst : ''}`}
                                    onClick={() => openUserRecordsModal(r.username)}
                                >
                                    {i + 1}. {r.username}
                                </span>
                                <div className={styles.recordStats}>
                                    <span className={styles.recordMoves}>
                                        {r.moves} <span>M</span>
                                    </span>
                                    <span className={styles.recordTime}>
                                        {formatTime(r.time_seconds)}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Leyendas Globales */}
            <div className={styles.topPanel}>
                <h3 className={styles.panelTitleGreen}>🔥 Leyendas Globales</h3>
                <div className={styles.panelContent}>
                    {topPlayers.length === 0 ? (
                        <p className={styles.emptyMessage}>Sin leyendas aún.</p>
                    ) : (
                        topPlayers.map((p, i) => (
                            <div key={i} className={styles.legendRow}>
                                <span
                                    className={`${styles.recordName} ${i === 0 ? styles.legendFirst : ''}`}
                                    onClick={() => openUserRecordsModal(p.username)}
                                >
                                    {i + 1}. {p.username}
                                </span>
                                <span className={styles.legendTotal}>
                                    {p.total} <span>RECS</span>
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Más Populares */}
            <div className={styles.topPanel}>
                <h3 className={styles.panelTitleBlue}>🔥 Más Populares</h3>
                <div className={styles.panelContent}>
                    {popularLevels.map((l, i) => (
                        <div
                            key={i}
                            className={`${styles.trendingItem} ${styles.trendingPopular}`}
                            onClick={() => fetchLevel({ id: l.id })}
                        >
                            <div className={styles.trendingInfo}>
                                <span className={styles.trendingId}>
                                    Reto #{l.id?.substring(0, 8)}
                                </span>
                                <span className={styles.trendingOptimo}>
                                    Dificultad Opt: {l.optimo}
                                </span>
                            </div>
                            <span className={styles.trendingPlays}>
                                {l.plays_count} Jugadas
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Últimos Jugados */}
            <div className={styles.topPanel}>
                <h3 className={styles.panelTitlePurple}>🕒 Últimos Jugados</h3>
                <div className={styles.panelContent}>
                    {recentLevels.map((l, i) => (
                        <div
                            key={i}
                            className={`${styles.trendingItem} ${styles.trendingRecent}`}
                            onClick={() => fetchLevel({ id: l.id })}
                        >
                            <div className={styles.trendingInfo}>
                                <span className={styles.trendingId}>
                                    Reto #{l.id?.substring(0, 8)}
                                </span>
                                <span className={styles.trendingOptimo}>
                                    Dificultad Opt: {l.optimo}
                                </span>
                            </div>
                            <span className={styles.trendingPlays}>
                                {l.plays_count} Jugadas
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
