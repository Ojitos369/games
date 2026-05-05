import { localStates, localEffects } from './localStates';
import { ImageModal } from '../Components/ImageModal';

const host = window.location.hostname;
const protocol = window.location.protocol;
const port = window.location.port === '5173' ? ':8372' : (window.location.port ? `:${window.location.port}` : '');
const API_BASE = `${protocol}//${host}${port}`;

const getImageUrl = (t) => {
    if (!t) return null;
    if (t.imagen_url) {
        if (t.imagen_url.startsWith('http')) return t.imagen_url;
        return `${API_BASE}${t.imagen_url}`;
    }
    if (t.imagen) return `${API_BASE}/media/images/adivina/${t.id}/${t.imagen}`;
    return null;
};

export const Decks = () => {
    const ls = localStates();
    localEffects();
    const {
        style, navigate,
        decks, decksMeta, decksPublicos, decksPublicosMeta,
        loadingDecks, loadingPublicos,
        tags,
        activeTab, switchTab,
        misSearchQ, setMisSearchQ,
        misScope, setMisScope,
        misSort, setMisSort, sortOptionsMis,
        misPage, setMisPage,
        pubSearchQ, setPubSearchQ,
        pubSort, setPubSort, sortOptionsPublic,
        pubOnlyNew, setPubOnlyNew,
        pubPage, setPubPage,
        pageSize, setPageSize, pageSizeOptions,
        filtersOpen, setFiltersOpen,
        expandedDeck, deckTarjetas, toggleExpand,
        showModal, setShowModal, editTarget,
        showImageModal, setShowImageModal,
        previewTarget, openPreview,
        form, setForm,
        pickerSearch, setPickerSearch,
        pickerTagFilter, setPickerTagFilter,
        pickerPage, setPickerPage,
        pickerData, pickerLoading,
        orderedSelectedTarjetas,
        toggleDeckTarjeta, moveTarjetaUp, moveTarjetaDown, sortTarjetas,
        openCreate, openEdit,
        handleSave, handleDelete,
        handleTogglePublico, handleDesvincular, handleCopiar, handleImportar,
    } = ls;

    const isMis = activeTab === 'mis';
    const meta = isMis ? decksMeta : decksPublicosMeta;
    const totalPages = Math.max(1, meta.pages || 1);
    const currentPage = isMis ? misPage : pubPage;
    const setPage = isMis ? setMisPage : setPubPage;
    const totalCount = meta.total || 0;
    const loading = isMis ? loadingDecks : loadingPublicos;
    const items = isMis ? decks : decksPublicos;

    const SCOPE_TABS = [
        { id: 'all', label: 'Todos', icon: '🗂️', count: decksMeta.scope_counts?.all ?? 0 },
        { id: 'owned', label: 'Creados', icon: '✍️', count: decksMeta.scope_counts?.owned ?? 0 },
        { id: 'imported', label: 'Importados', icon: '📥', count: decksMeta.scope_counts?.imported ?? 0 },
    ];

    const renderDeckExpanded = (deck) => (
        expandedDeck === deck.id && (
            <div className={`${style.deckExpanded}`}>
                {deckTarjetas[deck.id] ? (
                    deckTarjetas[deck.id].length === 0 ? (
                        <p className={`${style.emptyExpanded}`}>Este deck está vacío.</p>
                    ) : (
                        <div className={`${style.deckTarjetasGrid}`}>
                            {deckTarjetas[deck.id].map(t => {
                                const img = getImageUrl(t);
                                return (
                                    <div
                                        key={t.id}
                                        className={`${style.miniTarjeta}`}
                                        title={t.nombre}
                                        onClick={() => openPreview(t)}
                                    >
                                        {img ? (
                                            <img src={img} alt={t.nombre} loading="lazy" />
                                        ) : (
                                            <span>{t.nombre?.[0]?.toUpperCase() ?? '?'}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : (
                    <p className={`${style.emptyExpanded}`}>Cargando...</p>
                )}
            </div>
        )
    );

    return (
        <div className={`${style.decksPage}`}>
            <div className={`${style.pageHeader}`}>
                <div className={style.headerTitle}>
                    <button className={style.btnBack} onClick={() => navigate('/adivina')}>← Volver</button>
                    <h1 className={`${style.pageTitle}`}>
                        {isMis ? 'Mis ' : 'Explorar '}
                        <span className={style.accent}>Decks</span>
                    </h1>
                </div>
                <div className={`${style.headerActions}`}>
                    <div className={`${style.searchBox}`}>
                        <span className={style.searchIcon}>🔍</span>
                        <input
                            type="search"
                            placeholder={isMis ? "Buscar en mis decks..." : "Buscar decks públicos..."}
                            value={isMis ? misSearchQ : pubSearchQ}
                            onChange={e => (isMis ? setMisSearchQ(e.target.value) : setPubSearchQ(e.target.value))}
                            className={`${style.searchInput}`}
                            aria-label="Buscar deck"
                        />
                        {(isMis ? misSearchQ : pubSearchQ) && (
                            <button
                                className={`${style.btnClearSearch}`}
                                onClick={() => (isMis ? setMisSearchQ('') : setPubSearchQ(''))}
                                aria-label="Limpiar búsqueda"
                            >✕</button>
                        )}
                    </div>
                    <button
                        className={`${style.btnFilters}`}
                        onClick={() => setFiltersOpen(true)}
                        aria-label="Abrir filtros"
                    >
                        ⚙️ <span className={style.btnFiltersLabel}>Filtros</span>
                    </button>
                    {isMis && (
                        <button className={`${style.btnPrimary}`} onClick={openCreate}>+ Nuevo Deck</button>
                    )}
                </div>
            </div>

            <div className={`${style.tabs}`} role="tablist">
                <button
                    role="tab"
                    aria-selected={isMis}
                    className={`${style.tab} ${isMis ? style.tabActive : ''}`}
                    onClick={() => switchTab('mis')}
                >
                    🗂️ Mis Decks <span className={style.tabCount}>{decksMeta.scope_counts?.all ?? 0}</span>
                </button>
                <button
                    role="tab"
                    aria-selected={!isMis}
                    className={`${style.tab} ${!isMis ? style.tabActive : ''}`}
                    onClick={() => switchTab('explorar')}
                >
                    🌐 Explorar
                </button>
            </div>

            {isMis && (
                <div className={`${style.scopeStrip}`} role="tablist" aria-label="Filtrar por origen">
                    {SCOPE_TABS.map(t => (
                        <button
                            key={t.id}
                            role="tab"
                            aria-selected={misScope === t.id}
                            className={`${style.scopeBtn} ${misScope === t.id ? style.scopeBtnActive : ''}`}
                            onClick={() => setMisScope(t.id)}
                        >
                            <span>{t.icon}</span>
                            <span>{t.label}</span>
                            <span className={style.scopeCount}>{t.count}</span>
                        </button>
                    ))}
                </div>
            )}

            <div className={`${style.bodyLayout}`}>
                <aside className={`${style.sideFilters} ${filtersOpen ? style.sideFiltersOpen : ''}`} aria-label="Filtros">
                    <div className={`${style.sideFiltersHeader}`}>
                        <h3>Filtros</h3>
                        <button
                            className={`${style.btnCloseSide}`}
                            onClick={() => setFiltersOpen(false)}
                            aria-label="Cerrar filtros"
                        >✕</button>
                    </div>

                    <div className={`${style.sideSection}`}>
                        <h4 className={style.sideSectionTitle}>Ordenar</h4>
                        <select
                            className={`${style.select}`}
                            value={isMis ? misSort : pubSort}
                            onChange={e => (isMis ? setMisSort(e.target.value) : setPubSort(e.target.value))}
                        >
                            {(isMis ? sortOptionsMis : sortOptionsPublic).map(o => (
                                <option key={o.id} value={o.id}>{o.label}</option>
                            ))}
                        </select>
                    </div>

                    {!isMis && (
                        <div className={`${style.sideSection}`}>
                            <label className={`${style.checkboxRow}`}>
                                <input
                                    type="checkbox"
                                    checked={pubOnlyNew}
                                    onChange={e => setPubOnlyNew(e.target.checked)}
                                />
                                <span>Sólo no importados</span>
                            </label>
                        </div>
                    )}

                    <div className={`${style.sideSection}`}>
                        <h4 className={style.sideSectionTitle}>Por página</h4>
                        <select className={`${style.select}`} value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
                            {pageSizeOptions.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                </aside>

                {filtersOpen && <div className={`${style.backdrop}`} onClick={() => setFiltersOpen(false)} />}

                <main className={`${style.contentArea}`}>
                    <div className={`${style.resultInfo}`}>
                        <span>
                            <strong>{totalCount}</strong> {totalCount === 1 ? 'deck' : 'decks'}
                            {loading && <span className={style.muted}> · cargando…</span>}
                        </span>
                        <span className={style.muted}>Página {currentPage} / {totalPages}</span>
                    </div>

                    {loading && items.length === 0 ? (
                        <div className={`${style.skeletonList}`}>
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className={`${style.skeletonItem}`} />
                            ))}
                        </div>
                    ) : items.length === 0 ? (
                        <div className={`${style.emptyState}`}>
                            <div className={`${style.emptyIcon}`}>{isMis ? '🗂️' : '🌐'}</div>
                            <p>
                                {isMis
                                    ? (misSearchQ ? 'Sin coincidencias.' : 'No tienes decks. Crea uno o explora públicos.')
                                    : (pubSearchQ ? 'Sin coincidencias.' : 'No hay decks públicos disponibles.')}
                            </p>
                        </div>
                    ) : (
                        <div className={`${style.decksGrid}`}>
                            {isMis
                                ? items.map(deck => (
                                    <div key={deck.is_owner ? deck.id : (deck.import_id || deck.id)} className={`${style.deckItem} ${deck.linked ? style.deckLinked : ''}`}>
                                        <div className={`${style.deckRow}`} onClick={() => toggleExpand(deck)}>
                                            <div className={`${style.deckMain}`}>
                                                <span className={`${style.deckArrow} ${expandedDeck === deck.id ? style.deckArrowOpen : ''}`}>▶</span>
                                                <div className={style.deckInfo}>
                                                    <div className={`${style.deckName}`}>
                                                        {deck.nombre}
                                                        {deck.linked && (
                                                            <span className={`${style.linkedBadge}`} title="Deck vinculado — se actualiza con el original">
                                                                🔗 {deck.creador_username}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {deck.descripcion && <div className={`${style.deckDesc}`}>{deck.descripcion}</div>}
                                                </div>
                                            </div>
                                            <div className={`${style.deckMeta}`}>
                                                <span className={`${style.deckCount}`}>🃏 {deck.tarjetas_count}</span>
                                                {deck.is_owner ? (
                                                    <>
                                                        <button
                                                            className={`${style.btnIcon32} ${deck.publico ? style.btnPublic : ''}`}
                                                            onClick={e => { e.stopPropagation(); handleTogglePublico(deck); }}
                                                            title={deck.publico ? 'Público — clic para privatizar' : 'Privado — clic para publicar'}
                                                        >
                                                            {deck.publico ? '🌐' : '🔒'}
                                                        </button>
                                                        <button className={`${style.btnEdit}`} onClick={e => { e.stopPropagation(); openEdit(deck); }}>✏️</button>
                                                        <button className={`${style.btnDel}`} onClick={e => { e.stopPropagation(); handleDelete(deck.id); }}>🗑️</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            className={`${style.btnCopy}`}
                                                            onClick={e => { e.stopPropagation(); handleCopiar(deck.id); }}
                                                            title="Copiar como propio (sin vínculo)"
                                                        >📋</button>
                                                        <button
                                                            className={`${style.btnDel}`}
                                                            onClick={e => { e.stopPropagation(); handleDesvincular(deck.id); }}
                                                            title="Desvincular deck"
                                                        >✂️</button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {renderDeckExpanded(deck)}
                                    </div>
                                ))
                                : items.map(deck => (
                                    <div key={deck.id} className={`${style.deckItem}`}>
                                        <div className={`${style.deckRow}`} onClick={() => toggleExpand(deck)}>
                                            <div className={`${style.deckMain}`}>
                                                <span className={`${style.deckArrow} ${expandedDeck === deck.id ? style.deckArrowOpen : ''}`}>▶</span>
                                                <div className={style.deckInfo}>
                                                    <div className={`${style.deckName}`}>{deck.nombre}</div>
                                                    <div className={`${style.deckAuthor}`}>por {deck.creador_username}</div>
                                                    {deck.descripcion && <div className={`${style.deckDesc}`}>{deck.descripcion}</div>}
                                                </div>
                                            </div>
                                            <div className={`${style.deckMeta}`}>
                                                <span className={`${style.deckCount}`}>🃏 {deck.tarjetas_count}</span>
                                                {deck.imports_count !== undefined && (
                                                    <span className={`${style.deckCount}`} title="Importaciones">📥 {deck.imports_count}</span>
                                                )}
                                                {deck.ya_importado ? (
                                                    <span className={`${style.importadoBadge}`}>✓ Importado</span>
                                                ) : (
                                                    <button
                                                        className={`${style.btnImport}`}
                                                        onClick={e => { e.stopPropagation(); handleImportar(deck.id); }}
                                                    >+ Importar</button>
                                                )}
                                            </div>
                                        </div>
                                        {renderDeckExpanded(deck)}
                                    </div>
                                ))
                            }
                        </div>
                    )}

                    {totalPages > 1 && (
                        <Pagination
                            style={style}
                            page={currentPage}
                            totalPages={totalPages}
                            setPage={setPage}
                        />
                    )}
                </main>
            </div>

            {showModal && (
                <DeckModal
                    style={style}
                    editTarget={editTarget}
                    setShowModal={setShowModal}
                    form={form} setForm={setForm}
                    pickerSearch={pickerSearch} setPickerSearch={setPickerSearch}
                    pickerTagFilter={pickerTagFilter} setPickerTagFilter={setPickerTagFilter}
                    pickerPage={pickerPage} setPickerPage={setPickerPage}
                    pickerData={pickerData} pickerLoading={pickerLoading}
                    orderedSelectedTarjetas={orderedSelectedTarjetas}
                    tags={tags}
                    toggleDeckTarjeta={toggleDeckTarjeta}
                    moveTarjetaUp={moveTarjetaUp} moveTarjetaDown={moveTarjetaDown} sortTarjetas={sortTarjetas}
                    openPreview={openPreview}
                    handleSave={handleSave}
                />
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

const Pagination = ({ style, page, totalPages, setPage }) => {
    const visiblePages = [];
    const win = 2;
    const start = Math.max(1, page - win);
    const end = Math.min(totalPages, page + win);
    if (start > 1) visiblePages.push(1);
    if (start > 2) visiblePages.push('…');
    for (let i = start; i <= end; i++) visiblePages.push(i);
    if (end < totalPages - 1) visiblePages.push('…');
    if (end < totalPages) visiblePages.push(totalPages);

    return (
        <nav className={`${style.pagination}`} aria-label="Paginación">
            <button className={`${style.pageBtn}`} onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>‹</button>
            {visiblePages.map((p, i) => (
                p === '…' ? (
                    <span key={`dot-${i}`} className={`${style.pageDots}`}>…</span>
                ) : (
                    <button
                        key={p}
                        className={`${style.pageBtn} ${p === page ? style.pageBtnActive : ''}`}
                        onClick={() => setPage(p)}
                        aria-current={p === page ? 'page' : undefined}
                    >{p}</button>
                )
            ))}
            <button className={`${style.pageBtn}`} onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>›</button>
        </nav>
    );
};

const DeckModal = ({
    style, editTarget, setShowModal, form, setForm,
    pickerSearch, setPickerSearch, pickerTagFilter, setPickerTagFilter,
    pickerPage, setPickerPage, pickerData, pickerLoading,
    orderedSelectedTarjetas, tags,
    toggleDeckTarjeta, moveTarjetaUp, moveTarjetaDown, sortTarjetas,
    openPreview, handleSave,
}) => {
    const totalPickerPages = Math.max(1, pickerData.pages || 1);
    const selectedSet = new Set(form.tarjeta_ids);

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
                        <label>Tarjetas en orden: <strong>{orderedSelectedTarjetas.length}</strong></label>
                        {orderedSelectedTarjetas.length > 0 && (
                            <div className={`${style.orderingControls}`}>
                                <button className={`${style.btnSecondary}`} onClick={() => sortTarjetas('name_asc')}>Por Nombre</button>
                                <button className={`${style.btnSecondary}`} onClick={() => sortTarjetas('tag')}>Por Categoría</button>
                                <button className={`${style.btnSecondary}`} onClick={() => sortTarjetas('random')}>Aleatorio</button>
                            </div>
                        )}
                        <div className={`${style.selectedTarjetasGrid}`}>
                            {orderedSelectedTarjetas.map((t, index) => (
                                <div key={t.id} className={`${style.selectedTarjetaItem}`}>
                                    <div className={`${style.orderButtons}`}>
                                        <button className={`${style.btnIcon}`} onClick={() => moveTarjetaUp(index)} disabled={index === 0}>▲</button>
                                        <span className={`${style.orderIndex}`}>{index + 1}</span>
                                        <button className={`${style.btnIcon}`} onClick={() => moveTarjetaDown(index)} disabled={index === orderedSelectedTarjetas.length - 1}>▼</button>
                                    </div>
                                    <div className={`${style.selectedTarjetaImgBox}`}>
                                        {t.imagen || t.imagen_url ? (
                                            <img src={getImageUrl(t)} alt="" className={`${style.miniTarjetaImg}`} loading="lazy" />
                                        ) : (
                                            <div className={`${style.miniTarjetaPlaceholder}`}>🎭</div>
                                        )}
                                    </div>
                                    <div className={`${style.tarjetaPickerInfo}`}>
                                        <div className={`${style.tarjetaPickerName}`}>{t.nombre}</div>
                                        <button className={`${style.btnDelSelected}`} onClick={() => toggleDeckTarjeta(t)}>Quitar</button>
                                    </div>
                                </div>
                            ))}
                            {orderedSelectedTarjetas.length === 0 && (
                                <p style={{ padding: '0.5rem', opacity: 0.6, fontSize: '0.85rem' }}>Aún no hay tarjetas en el deck.</p>
                            )}
                        </div>
                    </div>

                    <div className={`${style.formGroup}`}>
                        <label>Buscar y agregar tarjetas <span className={style.muted}>({pickerData.total} disponibles)</span></label>
                        <div className={`${style.tarjetaPickerFilters}`}>
                            <input
                                type="search"
                                placeholder="Buscar tarjeta..."
                                value={pickerSearch}
                                onChange={e => setPickerSearch(e.target.value)}
                                className={`${style.input}`}
                            />
                            <select
                                value={pickerTagFilter}
                                onChange={e => setPickerTagFilter(e.target.value)}
                                className={`${style.select}`}
                            >
                                <option value="">Todos los tags</option>
                                {tags.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                            </select>
                        </div>
                        <div className={`${style.tarjetaPicker}`}>
                            {pickerLoading && pickerData.tarjetas.length === 0 ? (
                                <p style={{ padding: '1rem', textAlign: 'center', opacity: 0.5 }}>Cargando…</p>
                            ) : pickerData.tarjetas.length === 0 ? (
                                <p style={{ padding: '1rem', textAlign: 'center', opacity: 0.5 }}>Sin resultados</p>
                            ) : (
                                pickerData.tarjetas.map(t => {
                                    const isSelected = selectedSet.has(t.id);
                                    return (
                                        <div key={t.id} className={`${style.tarjetaPickerItemWrapper}`}>
                                            <label className={`${style.tarjetaPickerItem} ${isSelected ? style.tarjetaPickerSelected : ''}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleDeckTarjeta(t)}
                                                    style={{ display: 'none' }}
                                                />
                                                <div className={`${style.tarjetaPickerImgBox}`}>
                                                    {t.imagen || t.imagen_url ? (
                                                        <img src={getImageUrl(t)} alt="" className={`${style.miniTarjetaImg}`} loading="lazy" />
                                                    ) : (
                                                        <div className={`${style.miniTarjetaPlaceholder}`}>🎭</div>
                                                    )}
                                                </div>
                                                <div className={`${style.tarjetaPickerInfo}`}>
                                                    <div className={`${style.tarjetaPickerName}`}>
                                                        <span className={`${style.checkmark}`}>{isSelected ? '✓ ' : ''}</span>
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
                                    );
                                })
                            )}
                        </div>
                        {totalPickerPages > 1 && (
                            <div className={style.pickerPagination}>
                                <button
                                    className={`${style.pageBtn}`}
                                    onClick={() => setPickerPage(Math.max(1, pickerPage - 1))}
                                    disabled={pickerPage <= 1 || pickerLoading}
                                >‹ Ant</button>
                                <span className={style.muted}>{pickerPage} / {totalPickerPages}</span>
                                <button
                                    className={`${style.pageBtn}`}
                                    onClick={() => setPickerPage(Math.min(totalPickerPages, pickerPage + 1))}
                                    disabled={pickerPage >= totalPickerPages || pickerLoading}
                                >Sig ›</button>
                            </div>
                        )}
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
    );
};
