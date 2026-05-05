import { localStates } from '../localStates';

export const CreateSalaModal = () => {
    const {
        style, showCreateModal, setShowCreateModal,
        createForm, setCreateForm, handleCreateSala,
    } = localStates();

    if (!showCreateModal) return null;

    return (
        <div className={`${style.modalOverlay}`} onClick={() => setShowCreateModal(false)}>
            <div className={`${style.modal}`} onClick={e => e.stopPropagation()}>
                <div className={`${style.modalHeader}`}>
                    <h3>Crear nueva sala</h3>
                    <button className={`${style.btnClose}`} onClick={() => setShowCreateModal(false)}>✕</button>
                </div>
                <div className={`${style.modalBody}`}>
                    <div className={`${style.formGroup}`}>
                        <label>Nombre de la sala (opcional)</label>
                        <input
                            type="text"
                            placeholder="Mi sala épica..."
                            value={createForm.nombre}
                            onChange={e => setCreateForm({ ...createForm, nombre: e.target.value })}
                            className={`${style.input}`}
                        />
                    </div>
                    <div className={`${style.formGroup}`}>
                        <label>Máximo de jugadores: <strong>{createForm.max_jugadores}</strong></label>
                        <input
                            type="range"
                            min={2}
                            max={20}
                            value={createForm.max_jugadores}
                            onChange={e => setCreateForm({ ...createForm, max_jugadores: parseInt(e.target.value) })}
                            className={`${style.slider}`}
                        />
                        <div className={`${style.sliderLabels}`}>
                            <span>2</span><span>20</span>
                        </div>
                    </div>
                    <div className={`${style.formGroup}`}>
                        <label>Visibilidad</label>
                        <div className={`${style.visibilidadRow}`}>
                            <button
                                type="button"
                                className={`${style.btnVisibilidad} ${createForm.visibilidad === 'publica' ? style.btnVisibilidadActive : ''}`}
                                onClick={() => setCreateForm({ ...createForm, visibilidad: 'publica' })}
                            >
                                🌐 Pública
                            </button>
                            <button
                                type="button"
                                className={`${style.btnVisibilidad} ${createForm.visibilidad === 'privada' ? style.btnVisibilidadActive : ''}`}
                                onClick={() => setCreateForm({ ...createForm, visibilidad: 'privada' })}
                            >
                                🔒 Privada
                            </button>
                        </div>
                        {createForm.visibilidad === 'privada' && (
                            <p className={`${style.hint}`}>Solo quienes tengan el código podrán unirse.</p>
                        )}
                    </div>
                </div>
                <div className={`${style.modalFooter}`}>
                    <button className={`${style.btnSecondary}`} onClick={() => setShowCreateModal(false)}>
                        Cancelar
                    </button>
                    <button className={`${style.btnPrimary}`} onClick={handleCreateSala}>
                        Crear Sala
                    </button>
                </div>
            </div>
        </div>
    );
};
