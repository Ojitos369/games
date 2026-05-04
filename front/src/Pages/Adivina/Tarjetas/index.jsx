import { localStates, localEffects } from './localStates';
import { ImageModal } from '../Components/ImageModal';

export const Tarjetas = () => {
    const {
        style, tarjetas, tags, loadingTarjetas,
        isAdmin,
        searchQ, setSearchQ,
        selectedTags, toggleTag,
        showModal, setShowModal,
        showImageModal, setShowImageModal,
        editTarget, previewTarget,
        form, setForm,
        imagePreview,
        newTagName, setNewTagName,
        getImageUrl, canEdit,
        toggleFormTag,
        openCreate, openEdit, handleImageChange, openPreview,
        handleSave, handleDelete, handleCreateTag, handleSearch,
        navigate,
    } = localStates();
    localEffects();

    return (
        <div className={`${style.tarjetasPage}`}>
            <div className={`${style.pageHeader}`}>
                <div className={style.headerTitle}>
                    <button className={style.btnBack} onClick={() => navigate('/adivina')}>← Volver</button>
                    <h1 className={`${style.pageTitle}`}>Catálogo de <span className={style.accent}>Tarjetas</span></h1>
                </div>
                <button className={`${style.btnPrimary}`} onClick={openCreate}>
                    + Nueva Tarjeta
                </button>
            </div>

            <div className={`${style.filterBar}`}>
                <div className={`${style.searchBox}`}>
                    <input
                        type="text"
                        placeholder="Buscar personaje..."
                        value={searchQ}
                        onChange={e => setSearchQ(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        className={`${style.searchInput}`}
                    />
                    <button className={`${style.btnSearch}`} onClick={handleSearch}>🔍</button>
                </div>
                <div className={`${style.tagFilters}`}>
                    {tags.map(tag => (
                        <button
                            key={tag.id}
                            className={`${style.tagChip} ${selectedTags.includes(tag.id) ? style.tagChipActive : ''}`}
                            onClick={() => toggleTag(tag.id)}
                        >
                            {tag.nombre}
                            <span className={`${style.tagCount}`}>{tag.tarjetas_count}</span>
                        </button>
                    ))}
                </div>
            </div>

            {loadingTarjetas ? (
                <div className={`${style.loadingState}`}>Cargando tarjetas...</div>
            ) : tarjetas.length === 0 ? (
                <div className={`${style.emptyState}`}>
                    <div className={`${style.emptyIcon}`}>🃏</div>
                    <p>No hay tarjetas. ¡Crea la primera!</p>
                </div>
            ) : (
                <div className={`${style.tarjetasGrid}`}>
                    {tarjetas.map(tarjeta => (
                        <TarjetaCard
                            key={tarjeta.id}
                            tarjeta={tarjeta}
                            style={style}
                            canEdit={canEdit(tarjeta)}
                            getImageUrl={getImageUrl}
                            onEdit={() => openEdit(tarjeta)}
                            onDelete={() => handleDelete(tarjeta.id)}
                            onPreview={() => openPreview(tarjeta)}
                        />
                    ))}
                </div>
            )}

            {showModal && (
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
                                            {tag.nombre}
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
                                    <button className={`${style.btnSecondary}`} onClick={handleCreateTag}>
                                        + Tag
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className={`${style.modalFooter}`}>
                            <button className={`${style.btnSecondary}`} onClick={() => setShowModal(false)}>Cancelar</button>
                            <button className={`${style.btnPrimary}`} onClick={handleSave}>
                                {editTarget ? 'Guardar cambios' : 'Crear tarjeta'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ImageModal
                show={showImageModal}
                onClose={() => setShowImageModal(false)}
                image={previewTarget ? getImageUrl(previewTarget) : null}
                title={previewTarget?.nombre}
                description={previewTarget?.descripcion}
                tags={previewTarget?.tags}
            />
        </div>
    );
};

const TarjetaCard = ({ tarjeta, style, canEdit, getImageUrl, onEdit, onDelete, onPreview }) => {
    const img = getImageUrl(tarjeta);
    return (
        <div className={`${style.tarjetaCard}`}>
            <div className={`${style.tarjetaImage}`} onClick={onPreview} style={{ cursor: 'pointer' }}>
                {img ? (
                    <img src={img} alt={tarjeta.nombre} />
                ) : (
                    <div className={`${style.tarjetaImagePlaceholder}`}>
                        {tarjeta.nombre?.[0]?.toUpperCase() ?? '?'}
                    </div>
                )}
                <div className={style.zoomOverlay}>🔍</div>
            </div>
            <div className={`${style.tarjetaInfo}`}>
                <h3 className={`${style.tarjetaNombre}`}>{tarjeta.nombre}</h3>
                {tarjeta.descripcion && (
                    <p className={`${style.tarjetaDesc}`}>{tarjeta.descripcion}</p>
                )}
                {tarjeta.tags?.length > 0 && (
                    <div className={`${style.tarjetaTags}`}>
                        {tarjeta.tags.map(t => (
                            <span key={t.id} className={`${style.tagBadge}`}>{t.nombre}</span>
                        ))}
                    </div>
                )}
                {tarjeta.creador && (
                    <span className={`${style.tarjetaCreador}`}>👤 {tarjeta.creador.username}</span>
                )}
            </div>
            <div className={`${style.tarjetaActions}`}>
                <button className={`${style.btnPreview}`} onClick={onPreview} title="Ver detalles">👁️</button>
                {canEdit && (
                    <>
                        <button className={`${style.btnEdit}`} onClick={onEdit} title="Editar">✏️</button>
                        <button className={`${style.btnDel}`} onClick={onDelete} title="Eliminar">🗑️</button>
                    </>
                )}
            </div>
        </div>
    );
};
