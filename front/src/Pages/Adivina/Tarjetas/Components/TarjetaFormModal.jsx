import { useState, useEffect, useCallback } from 'react';
import { localStates } from '../localStates';

export const TarjetaFormModal = () => {
    const {
        style, showModal, setShowModal, editTarget, tags, getImageUrl, f,
    } = localStates();

    const [form, setForm] = useState({ nombre: '', descripcion: '', tags: [] });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [newTagName, setNewTagName] = useState('');

    useEffect(() => {
        if (!showModal) return;
        if (editTarget) {
            setForm({
                nombre: editTarget.nombre || '',
                descripcion: editTarget.descripcion || '',
                tags: editTarget.tags?.map(t => t.id) || [],
            });
            setImageFile(null);
            setImagePreview(getImageUrl(editTarget));
        } else {
            setForm({ nombre: '', descripcion: '', tags: [] });
            setImageFile(null);
            setImagePreview(null);
        }
        setNewTagName('');
    }, [showModal, editTarget]);

    const toggleFormTag = useCallback((tagId) => {
        setForm(prev => ({
            ...prev,
            tags: prev.tags.includes(tagId) ? prev.tags.filter(t => t !== tagId) : [...prev.tags, tagId],
        }));
    }, []);

    const handleImageChange = useCallback((e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    }, []);

    const handleSave = useCallback(() => {
        if (!form.nombre.trim()) return;
        if (editTarget) {
            f.adivina.tarjetas.actualizar({ tarjeta_id: editTarget.id, ...form }, () => {
                if (imageFile) f.adivina.tarjetas.subirImagen(editTarget.id, imageFile);
                setShowModal(false);
            });
        } else {
            f.adivina.tarjetas.crear(form, (res) => {
                if (imageFile) f.adivina.tarjetas.subirImagen(res.id, imageFile);
                setShowModal(false);
            });
        }
    }, [form, editTarget, imageFile, f.adivina]);

    const handleCreateTag = useCallback(() => {
        if (!newTagName.trim()) return;
        f.adivina.tags.crear(newTagName.trim(), (res) => {
            setForm(prev => ({ ...prev, tags: [...prev.tags, res.id] }));
            setNewTagName('');
        }, true);
    }, [newTagName, f.adivina]);

    if (!showModal) return null;

    return (
        <div className={`${style.modalOverlay}`} onClick={() => setShowModal(false)}>
            <div className={`${style.modal}`} onClick={e => e.stopPropagation()}>
                <div className={`${style.modalHeader}`}>
                    <h3>{editTarget ? 'Editar Tarjeta' : 'Nueva Tarjeta'}</h3>
                    <button className={`${style.btnClose}`} onClick={() => setShowModal(false)}>✕</button>
                </div>
                <div className={`${style.modalBody}`}>
                    <div className={`${style.imageUploadArea}`}>
                        <label className={`${style.imageLabel}`} htmlFor="tarjeta-img">
                            {imagePreview ? (
                                <img src={imagePreview} alt="preview" className={`${style.imagePreview}`} />
                            ) : (
                                <div className={`${style.imagePlaceholder}`}>
                                    <span>📷</span>
                                    <span>Subir imagen</span>
                                </div>
                            )}
                        </label>
                        <input id="tarjeta-img" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                    </div>
                    <div className={`${style.formGroup}`}>
                        <label>Nombre del personaje *</label>
                        <input
                            type="text"
                            placeholder="Ej: Mario, Hermione, Darth Vader..."
                            value={form.nombre}
                            onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                            className={`${style.input}`}
                        />
                    </div>
                    <div className={`${style.formGroup}`}>
                        <label>Descripción</label>
                        <textarea
                            placeholder="Pistas o descripción del personaje..."
                            value={form.descripcion}
                            onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                            className={`${style.textarea}`}
                            rows={3}
                        />
                    </div>
                    <div className={`${style.formGroup}`}>
                        <label>Tags</label>
                        <div className={`${style.tagSelector}`}>
                            {tags.map(tag => (
                                <button
                                    key={tag.id}
                                    type="button"
                                    className={`${style.tagChip} ${form.tags.includes(tag.id) ? style.tagChipActive : ''}`}
                                    onClick={() => toggleFormTag(tag.id)}
                                >
                                    <span className={style.tagChipName}>{tag.nombre}</span>
                                </button>
                            ))}
                        </div>
                        <div className={`${style.newTagRow}`}>
                            <input
                                type="text"
                                placeholder="Nuevo tag..."
                                value={newTagName}
                                onChange={e => setNewTagName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreateTag()}
                                className={`${style.input}`}
                            />
                            <button className={`${style.btnSecondary}`} onClick={handleCreateTag}>+ Tag</button>
                        </div>
                    </div>
                </div>
                <div className={`${style.modalFooter}`}>
                    <button className={`${style.btnSecondary}`} onClick={() => setShowModal(false)}>Cancelar</button>
                    <button className={`${style.btnPrimary}`} onClick={handleSave}>
                        {editTarget ? 'Guardar' : 'Crear'}
                    </button>
                </div>
            </div>
        </div>
    );
};
