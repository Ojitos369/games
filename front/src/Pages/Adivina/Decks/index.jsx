import { localStates, localEffects } from './localStates';
import { ImageModal } from '../Components/ImageModal';

export const Decks = () => {
    const {
        style, decks, loadingDecks,
        tags, filteredTarjetas,
        expandedDeck, deckTarjetas, toggleExpand,
        showModal, setShowModal, editTarget,
        showImageModal, setShowImageModal,
        previewTarget, openPreview,
        form, setForm,
        tarjetaSearch, setTarjetaSearch,
        tarjetaTagFilter, setTarjetaTagFilter,
        toggleDeckTarjeta, openCreate, openEdit,
        handleSave, handleDelete,
        navigate,
    } = localStates();
    localEffects();

    const host = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port === '5173' ? ':8372' : (window.location.port ? `:${window.location.port}` : '');
    const API_BASE = `${protocol}//${host}${port}`;

    const getImageUrl = (t) => {
        if (t?.imagen_url) {
            if (t.imagen_url.startsWith('http')) return t.imagen_url;
            return `${API_BASE}${t.imagen_url}`;
        }
        if (!t?.imagen) return null;
        return `${API_BASE}/media/images/adivina/${t.id}/${t.imagen}`;
    };

    return (
        <div className={`${style.decksPage}`}>
            <div className={`${style.pageHeader}`}>
                <div className={style.headerTitle}>
                    <button className={style.btnBack} onClick={() => navigate('/adivina')}>← Volver</button>
                    <h1 className={`${style.pageTitle}`}>Mis Decks</h1>
                </div>
                <button className={`${style.btnPrimary}`} onClick={openCreate}>+ Nuevo Deck</button>
            </div>

            {loadingDecks ? (
                <div className={`${style.loadingState}`}>Cargando decks...</div>
            ) : decks.length === 0 ? (
                <div className={`${style.emptyState}`}>
                    <div className={`${style.emptyIcon}`}>🗂️</div>
                    <p>No tienes decks. ¡Crea uno para organizar tus tarjetas favoritas!</p>
                </div>
            ) : (
                <div className={`${style.decksList}`}>
                    {decks.map(deck => (
                        <div key={deck.id} className={`${style.deckItem}`}>
                            <div className={`${style.deckRow}`} onClick={() => toggleExpand(deck)}>
                                <div className={`${style.deckMain}`}>
                                    <span className={`${style.deckArrow} ${expandedDeck === deck.id ? style.deckArrowOpen : ''}`}>▶</span>
                                    <div>
                                        <div className={`${style.deckName}`}>{deck.nombre}</div>
                                        {deck.descripcion && <div className={`${style.deckDesc}`}>{deck.descripcion}</div>}
                                    </div>
                                </div>
                                <div className={`${style.deckMeta}`}>
                                    <span className={`${style.deckCount}`}>🃏 {deck.tarjetas_count} tarjetas</span>
                                    <button className={`${style.btnEdit}`} onClick={e => { e.stopPropagation(); openEdit(deck); }}>✏️</button>
                                    <button className={`${style.btnDel}`} onClick={e => { e.stopPropagation(); handleDelete(deck.id); }}>🗑️</button>
                                </div>
                            </div>

                            {expandedDeck === deck.id && (
                                <div className={`${style.deckExpanded}`}>
                                    {deckTarjetas[deck.id] ? (
                                        deckTarjetas[deck.id].length === 0 ? (
                                            <p className={`${style.emptyExpanded}`}>Este deck está vacío.</p>
                                        ) : (
                                            <div className={`${style.deckTarjetasGrid}`}>
                                                {deckTarjetas[deck.id].map(t => (
                                                    <div key={t.id} className={`${style.miniTarjeta}`}>
                                                        <div className={style.miniTarjetaContent}>
                                                            <span>{t.nombre}</span>
                                                            <div className={style.miniTarjetaTags}>
                                                                {t.tags?.map(tg => (
                                                                    <span key={tg.id} className={`${style.miniTag}`}>{tg.nombre}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <button className={style.btnMiniPreview} onClick={() => openPreview(t)}>👁️</button>
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    ) : (
                                        <p className={`${style.emptyExpanded}`}>Cargando...</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
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
                                    value={form.nombre}
                                    onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                                    className={`${style.input}`}
                                />
                            </div>
                            <div className={`${style.formGroup}`}>
                                <label>Descripción</label>
                                <input
                                    type="text"
                                    placeholder="Descripción opcional..."
                                    value={form.descripcion}
                                    onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                                    className={`${style.input}`}
                                />
                            </div>
                            <div className={`${style.formGroup}`}>
                                <label>Tarjetas seleccionadas: <strong>{form.tarjeta_ids.length}</strong></label>
                                <div className={`${style.tarjetaPickerFilters}`}>
                                    <input
                                        type="text"
                                        placeholder="Buscar tarjeta..."
                                        value={tarjetaSearch}
                                        onChange={e => setTarjetaSearch(e.target.value)}
                                        className={`${style.input}`}
                                    />
                                    <select
                                        value={tarjetaTagFilter}
                                        onChange={e => setTarjetaTagFilter(e.target.value)}
                                        className={`${style.select}`}
                                    >
                                        <option value="">Todos los tags</option>
                                        {tags.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                                    </select>
                                </div>
                                <div className={`${style.tarjetaPicker}`}>
                                    {filteredTarjetas.map(t => (
                                        <div key={t.id} className={`${style.tarjetaPickerItemWrapper}`}>
                                            <label className={`${style.tarjetaPickerItem} ${form.tarjeta_ids.includes(t.id) ? style.tarjetaPickerSelected : ''}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={form.tarjeta_ids.includes(t.id)}
                                                    onChange={() => toggleDeckTarjeta(t.id)}
                                                    style={{ display: 'none' }}
                                                />
                                                <div className={`${style.tarjetaPickerImgBox}`}>
                                                    {t.imagen ? (
                                                        <img src={getImageUrl(t)} alt="" className={`${style.miniTarjetaImg}`} />
                                                    ) : (
                                                        <div className={`${style.miniTarjetaPlaceholder}`}>🎭</div>
                                                    )}
                                                </div>
                                                <div className={`${style.tarjetaPickerInfo}`}>
                                                    <div className={`${style.tarjetaPickerName}`}>
                                                        <span className={`${style.checkmark}`}>{form.tarjeta_ids.includes(t.id) ? '✓ ' : ''}</span>
                                                        {t.nombre}
                                                    </div>
                                                    <div className={`${style.tarjetaPickerTags}`}>
                                                        {t.tags?.slice(0, 2).map(tg => (
                                                            <span key={tg.id} className={`${style.miniTag}`}>{tg.nombre}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </label>
                                            <button className={style.btnFloatPreview} onClick={() => openPreview(t)} title="Ver imagen">👁️</button>
                                        </div>
                                    ))}
                                    {filteredTarjetas.length === 0 && (
                                        <p style={{ padding: '1rem', textAlign: 'center', opacity: 0.5 }}>Sin resultados</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className={`${style.modalFooter}`}>
                            <button className={`${style.btnSecondary}`} onClick={() => setShowModal(false)}>Cancelar</button>
                            <button className={`${style.btnPrimary}`} onClick={handleSave}>
                                {editTarget ? 'Guardar cambios' : 'Crear deck'}
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

