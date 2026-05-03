import React from 'react';
import { useStates } from '../../../Hooks/useStates';
import style from './styles/index.module.scss';

export const SideBarAdivinaSala = () => {
    const { s } = useStates();
    const props = s.adivina?.salaProps;
    const actions = window.adivinaActions;

    if (!props || !actions) return null;

    const { jugadoresList, gameState, talkingStates, voiceStates, isHost, userId, espectadores } = props;
    const { handleKick } = actions;

    const turnoActualName = jugadoresList?.find(j => j.user_id === gameState?.turno_actual)?.username || 'Nadie';

    return (
        <div className={`${style.playersPanel}`} style={{ border: 'none', height: '100%' }}>
            <h3 className={`${style.panelTitle}`}>Jugadores</h3>
            <div className={`${style.playersList}`}>
                {jugadoresList.map(j => (
                    <div key={j.user_id} className={`${style.playerItem} ${j.eliminado ? style.playerEliminado : ''} ${j.user_id === gameState?.turno_actual ? style.playerTurno : ''} ${talkingStates[j.user_id] ? style.playerTalking : ''} ${j.desconectado ? style.playerDesconectado : ''}`}>
                        <div className={`${style.playerAvatar}`}>
                            {j.user_id === gameState?.creador_id ? '👑' : '👤'}
                        </div>
                        <div className={`${style.playerInfo}`}>
                            <span className={`${style.playerName}`}>{j.username}</span>
                            {j.victorias > 0 && <span className={`${style.playerWins}`}>🏆 {j.victorias}</span>}
                            {j.eliminado && <span className={`${style.playerBadge}`}>Eliminado</span>}
                            {j.desconectado && !j.eliminado && <span className={`${style.playerBadgeDisconnect}`}>⚠️ Desconectado</span>}
                            {j.user_id === gameState?.turno_actual && <span className={`${style.playerBadgeTurno}`}>Turno</span>}
                            {voiceStates[j.user_id] && <span className={`${style.playerBadgeVoice} ${talkingStates[j.user_id] ? style.voiceTalking : ''}`}>🎙️</span>}
                        </div>
                        {isHost && gameState?.estado === 'esperando' && j.user_id !== userId && (
                            <button className={`${style.btnKick}`} onClick={() => handleKick(j.user_id)} title="Expulsar">✕</button>
                        )}
                    </div>
                ))}
            </div>

            {/* Spectators */}
            {espectadores.length > 0 && (
                <div className={`${style.spectatorSection}`}>
                    <h4 className={`${style.panelTitle}`}>👁️ Espectadores</h4>
                    <div className={`${style.playersList}`}>
                        {espectadores.map(e => (
                            <div key={e.user_id} className={`${style.playerItem} ${style.espectadorItem}`}>
                                <div className={`${style.playerAvatar}`}>👁️</div>
                                <div className={`${style.playerInfo}`}>
                                    <span className={`${style.playerName}`}>{e.username}</span>
                                    {e.victorias > 0 && <span className={`${style.playerWins}`}>🏆 {e.victorias}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {gameState?.estado === 'jugando' && (
                <div className={`${style.turnoBox}`}>
                    <div className={`${style.turnoLabel}`}>Turno de</div>
                    <div className={`${style.turnoName}`}>{turnoActualName}</div>
                </div>
            )}
        </div>
    );
};
