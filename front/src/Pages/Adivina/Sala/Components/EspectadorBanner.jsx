import { subStates } from '../localStates';

export const EspectadorBanner = () => {
    const { style, gameState } = subStates();

    if (!gameState) return null;

    return (
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
    );
};
