import { localStates } from '../localStates';
import { SelectedTarjetas } from './SelectedTarjetas';
import { TarjetaPicker } from './TarjetaPicker';

export const DeckFormModal = () => {
    const {
        style, showModal, setShowModal, editTarget,
        form, setForm, handleSave,
    } = localStates();

    if (!showModal) return null;

    return (
        <div className={`${style.modalOverlay}`} onClick={() => setShowModal(false)}>
            <div className={`${style.modal}`} onClick={e => e.stopPropagation()}>
                <div className={`${style.modalHeader}`}>
                    <h3>{editTarget ? 'Editar Deck' : 'Nuevo Deck'}</h3>
                    <button className={`${style.btnClose}`} onClick={() => setShowModal(false)}>✕</button>
                </div>
                <div className={`${style.modalBody}`}>
                    <div className={`${style.formGroup}`}>
                        <label>Nombre del deck *</label>
                        <input
                            type="text"
                            placeholder="Ej: Personajes de anime..."
                            value={form.nombre || ''}
                            onChange={e => setForm({ ...form, nombre: e.target.value })}
                            className={`${style.input}`}
                        />
                    </div>
                    <div className={`${style.formGroup}`}>
                        <label>Descripción</label>
                        <input
                            type="text"
                            placeholder="Descripción opcional..."
                            value={form.descripcion || ''}
                            onChange={e => setForm({ ...form, descripcion: e.target.value })}
                            className={`${style.input}`}
                        />
                    </div>
                    <SelectedTarjetas />
                    <TarjetaPicker />
                </div>
                <div className={`${style.modalFooter}`}>
                    <button className={`${style.btnSecondary}`} onClick={() => setShowModal(false)}>Cancelar</button>
                    <button className={`${style.btnPrimary}`} onClick={handleSave}>
                        {editTarget ? 'Guardar cambios' : 'Crear deck'}
                    </button>
                </div>
            </div>
        </div>
    );
};
