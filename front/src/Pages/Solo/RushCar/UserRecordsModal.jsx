import { localStates } from "./localStates";
import { GeneralModal } from '../../../Components/Modals/GeneralModal';
import { useMemo } from 'react';

const UserRecordsContent = (props) => {
    const {
        styles, userRecordsData, userRecordsUsername,
        expandedLevels, toggleLevelExpand,
        closeUserRecordsModal, fetchLevel, formatTime,
    } = localStates();

    // Agrupar por nivel
    const groups = useMemo(() => {
        const g = {};
        (userRecordsData || []).forEach(r => {
            if (!g[r.nivel_id]) g[r.nivel_id] = [];
            g[r.nivel_id].push(r);
        });
        // Ordenar records dentro de cada grupo
        Object.keys(g).forEach(lid => {
            g[lid].sort((a, b) => {
                if (a.moves !== b.moves) return a.moves - b.moves;
                return a.time_seconds - b.time_seconds;
            });
        });
        return g;
    }, [userRecordsData]);

    const levelIds = useMemo(() => Object.keys(groups), [groups]);

    const handlePlayLevel = (levelId) => {
        closeUserRecordsModal();
        fetchLevel({ id: levelId });
    };

    return (
        <div className={styles.userRecordsContent}>
            <h3 className={styles.urTitle}>
                Historial de <span>{userRecordsUsername}</span>
            </h3>
            <p className={styles.urSubtitle}>Niveles conquistados por este jugador.</p>

            {levelIds.length === 0 ? (
                <p className={styles.emptyMessage}>No hay records para este usuario.</p>
            ) : (
                <table className={styles.urTable}>
                    <thead>
                        <tr>
                            <th>Nivel</th>
                            <th style={{ textAlign: 'center' }}>Óptimo</th>
                            <th style={{ textAlign: 'center' }}>Usuario</th>
                            <th style={{ textAlign: 'center' }}>Tiempo</th>
                            <th style={{ textAlign: 'right' }}>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        {levelIds.map(lid => {
                            const records = groups[lid];
                            const best = records[0];
                            const count = records.length;
                            const isExpanded = expandedLevels[lid];

                            return (
                                <tr key={lid} className={styles.urMainRow}>
                                    <td colSpan={5} style={{ padding: 0 }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <tbody>
                                                {/* Main row */}
                                                <tr className={styles.urMainRow}>
                                                    <td
                                                        className={styles.urLevelLink}
                                                        onClick={() => handlePlayLevel(lid)}
                                                        title="Jugar este nivel"
                                                        style={{ padding: '0.75rem 0' }}
                                                    >
                                                        #{lid.substring(0, 8)}
                                                    </td>
                                                    <td style={{ textAlign: 'center', fontWeight: 700, color: '#888', padding: '0.75rem 0' }}>
                                                        {best.optimo}
                                                    </td>
                                                    <td style={{ textAlign: 'center', fontWeight: 900, color: 'var(--my-yellow)', padding: '0.75rem 0' }}>
                                                        {best.moves}
                                                    </td>
                                                    <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums', color: '#d1d5db', padding: '0.75rem 0' }}>
                                                        {formatTime(best.time_seconds)}
                                                    </td>
                                                    <td style={{ textAlign: 'right', padding: '0.75rem 0' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                            <span style={{ fontSize: '9px', color: '#555' }}>
                                                                {best.timestamp?.split(' ')[0]}
                                                            </span>
                                                            {count > 1 && (
                                                                <button
                                                                    className={`${styles.urExpandBtn} ${isExpanded ? styles.urExpandBtnActive : ''}`}
                                                                    onClick={(e) => { e.stopPropagation(); toggleLevelExpand(lid); }}
                                                                >
                                                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                                            d="M19 9l-7 7-7-7" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Sub rows */}
                                                {isExpanded && records.slice(1).map((r, ri) => (
                                                    <tr key={ri} className={styles.urSubRow}>
                                                        <td className={styles.urSubLabel}>Intento</td>
                                                        <td style={{ textAlign: 'center', fontSize: '10px', color: '#555', padding: '0.5rem 0' }}>-</td>
                                                        <td style={{ textAlign: 'center', color: '#888', fontSize: '0.85rem', padding: '0.5rem 0' }}>{r.moves}</td>
                                                        <td style={{ textAlign: 'center', fontVariantNumeric: 'tabular-nums', color: '#555', fontSize: '0.85rem', padding: '0.5rem 0' }}>
                                                            {formatTime(r.time_seconds)}
                                                        </td>
                                                        <td style={{ textAlign: 'right', fontSize: '9px', color: '#555', paddingRight: '2.5rem', padding: '0.5rem 0' }}>
                                                            {r.timestamp}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}

            <button className={styles.urCloseBtn} onClick={closeUserRecordsModal}>
                Cerrar
            </button>
        </div>
    );
};

export const UserRecordsModal = () => {
    const { showUserRecords, closeUserRecordsModal } = localStates();

    if (!showUserRecords) return null;

    return (
        <GeneralModal
            Component={UserRecordsContent}
            lvl1="solo_rushcar"
            lvl2="userRecords"
            close={closeUserRecordsModal}
            modal_container_w="modal_container_70"
            borderColor="var(--my-primary)"
        />
    );
};
