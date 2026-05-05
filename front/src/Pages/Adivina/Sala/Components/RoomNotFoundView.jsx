import { subStates } from '../localStates';

export const RoomNotFoundView = () => {
    const { style, codigo, handleReaperturar, navigate } = subStates();

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
