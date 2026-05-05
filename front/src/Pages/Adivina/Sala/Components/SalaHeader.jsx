import { subStates } from '../localStates';

const estadoLabel = (estado) => {
    const map = { esperando: 'Esperando', votando: 'Votando', jugando: 'En juego', terminado: 'Terminado' };
    return map[estado] || estado;
};

export const SalaHeader = () => {
    const {
        style, codigo, gameState, espectadores, connected,
        voiceEnabled, hearingEnabled, toggleVoice, setHearingEnabled,
        navigate,
    } = subStates();

    if (!gameState) return null;

    const jugadoresList = gameState?.jugadores ? Object.values(gameState.jugadores) : [];

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
                            {espectadores?.length > 0 && (
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
                    🎙️
                </button>
            </div>
        </div>
    );
};
