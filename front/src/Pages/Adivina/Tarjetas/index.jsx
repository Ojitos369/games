import { localStates, localEffects } from './localStates';
import { ImageModal } from '../Components/ImageModal';

export const Tarjetas = () => {
    const ls = localStates();
    localEffects();
    const {
        style, navigate,
        tagsWithCounts, scopeCounts,
        loadingTarjetas, tarjetasAll,
        paginated, totalCount, totalPages, page, setPage,
        searchQ, setSearchQ,
        selectedTags, toggleTag,
        tagMode, setTagMode,
        scope, setScope,
        sortBy, setSortBy, sortOptions,
        viewMode, setViewMode,
        pageSize, setPageSize, pageSizeOptions,
        clearFilters, activeFiltersCount,
        filtersOpen, setFiltersOpen,
        showModal, setShowModal,
        showImageModal, setShowImageModal,
        editTarget, previewTarget,
        form, setForm,
        imagePreview,
        newTagName, setNewTagName,
        getImageUrl, canEdit,
        toggleFormTag,
        openCreate, openEdit, handleImageChange, openPreview,
        handleSave, handleDelete, handleCreateTag,
        tags,
    } = ls;

    const SCOPE_TABS = [
        { id: 'all', label: 'Todas', icon: '🃏', count: scopeCounts.all },
        { id: 'mine', label: 'Mías', icon: '👤', count: scopeCounts.mine },
        { id: 'no_image', label: 'Sin imagen', icon: '🖼️', count: scopeCounts.no_image },
        { id: 'no_tags', label: 'Sin tags', icon: '🏷️', count: scopeCounts.no_tags },
    ];

    const VIEW_MODES = [
        { id: 'grid', icon: '▦', title: 'Grid' },
        { id: 'compact', icon: '▤', title: 'Compacto' },
        { id: 'list', icon: '☰', title: 'Lista' },
    ];

    return (
        <div className={`${style.tarjetasPage}`}>
            <div className={`${style.topBar}`}>
                <div className={`${style.headerTitle}`}>
                    <button className={`${style.btnBack}`} onClick={() => navigate('/adivina')}>← Volver</button>
                    <h1 className={`${style.pageTitle}`}>Catálogo de <span className={style.accent}>Tarjetas</span></h1>
                </div>
                <div className={`${style.headerActions}`}>
                    <div className={`${style.searchBox}`}>
                        <span className={style.searchIcon}>🔍</span>
                        <input
                            type="search"
                            placeholder="Buscar nombre, descripción..."
                            value={searchQ}
                            onChange={e => setSearchQ(e.target.value)}
                            className={`${style.searchInput}`}
                            aria-label="Buscar tarjeta"
                        />
                        {searchQ && (
                            <button className={`${style.btnClearSearch}`} onClick={() => setSearchQ('')} aria-label="Limpiar búsqueda">✕</button>
                        )}
                    </div>
                    <button
                        className={`${style.btnFilters} ${activeFiltersCount > 0 ? style.btnFiltersActive : ''}`}
                        onClick={() => setFiltersOpen(true)}
                        aria-label="Abrir filtros"
                    >
                        ⚙️ <span className={style.btnFiltersLabel}>Filtros</span>
                        {activeFiltersCount > 0 && <span className={style.filterBadge}>{activeFiltersCount}</span>}
                    </button>
                    <button className={`${style.btnPrimary}`} onClick={openCreate}>+ Nueva</button>
                </div>
            </div>

            <div className={`${style.tabsRow}`} role="tablist">
                {SCOPE_TABS.map(tab => (
                    <button
                        key={tab.id}
                        role="tab"
                        aria-selected={scope === tab.id}
                        className={`${style.tabBtn} ${scope === tab.id ? style.tabActive : ''}`}
                        onClick={() => setScope(tab.id)}
                    >
                        <span className={style.tabIcon}>{tab.icon}</span>
                        <span className={style.tabLabel}>{tab.label}</span>
                        <span className={style.tabCount}>{tab.count}</span>
                    </button>
                ))}
            </div>

            <div className={`${style.bodyLayout}`}>
                <aside className={`${style.sideFilters} ${filtersOpen ? style.sideFiltersOpen : ''}`} aria-label="Filtros">
                    <div className={`${style.sideFiltersHeader}`}>
                        <h3>Filtros</h3>
                        <div className={`${style.sideFiltersHeaderActions}`}>
                            {activeFiltersCount > 0 && (
                                <button className={`${style.btnLink}`} onClick={clearFilters}>Limpiar</button>
                            )}
                            <button
                                className={`${style.btnCloseSide}`}
                                onClick={() => setFiltersOpen(false)}
                                aria-label="Cerrar filtros"
                            >✕</button>
                        </div>
                    </div>

                    <div className={`${style.sideSection}`}>
                        <h4 className={style.sideSectionTitle}>Ordenar</h4>
                        <select className={`${style.select}`} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                            {sortOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                        </select>
                    </div>

                    <div className={`${style.sideSection}`}>
                        <div className={`${style.sideSectionHead}`}>
                            <h4 className={style.sideSectionTitle}>Tags</h4>
                            <div className={`${style.tagModeToggle}`} role="group" aria-label="Modo de filtro">
                                <button
                                    className={`${style.tagModeBtn} ${tagMode === 'any' ? style.tagModeBtnActive : ''}`}
                                    onClick={() => setTagMode('any')}
                                    title="Coincide cualquiera"
                                >Any</button>
                                <button
                                    className={`${style.tagModeBtn} ${tagMode === 'all' ? style.tagModeBtnActive : ''}`}
                                    onClick={() => setTagMode('all')}
                                    title="Coincide todos"
                                >All</button>
                            </div>
                        </div>
                        {selectedTags.length > 0 && (
                            <button className={`${style.btnLinkSmall}`} onClick={() => selectedTags.slice().forEach(toggleTag)}>
                                Limpiar tags
                            </button>
                        )}
                        <div className={`${style.tagList}`}>
                            {tagsWithCounts.length === 0 && (
                                <div className={style.muted}>Sin tags</div>
                            )}
                            {tagsWithCounts.map(tag => (
                                <button
                                    key={tag.id}
                                    className={`${style.tagChip} ${selectedTags.includes(tag.id) ? style.tagChipActive : ''}`}
                                    onClick={() => toggleTag(tag.id)}
                                    aria-pressed={selectedTags.includes(tag.id)}
                                >
                                    <span className={style.tagChipName}>{tag.nombre}</span>
                                    <span className={style.tagChipCount}>{tag.count}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={`${style.sideSection}`}>
                        <h4 className={style.sideSectionTitle}>Vista</h4>
                        <div className={`${style.viewToggle}`} role="group" aria-label="Modo de vista">
                            {VIEW_MODES.map(v => (
                                <button
                                    key={v.id}
                                    className={`${style.viewBtn} ${viewMode === v.id ? style.viewBtnActive : ''}`}
                                    onClick={() => setViewMode(v.id)}
                                    title={v.title}
                                    aria-label={v.title}
                                >{v.icon}</button>
                            ))}
                        </div>
                    </div>

                    <div className={`${style.sideSection}`}>
                        <h4 className={style.sideSectionTitle}>Por página</h4>
                        <select className={`${style.select}`} value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
                            {pageSizeOptions.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                </aside>

                {filtersOpen && <div className={`${style.backdrop}`} onClick={() => setFiltersOpen(false)} />}

                <main className={`${style.contentArea}`}>
                    {(selectedTags.length > 0 || searchQ || scope !== 'all') && (
                        <div className={`${style.activeChips}`}>
                            {searchQ && (
                                <span className={`${style.activeChip}`}>
                                    🔍 "{searchQ}"
                                    <button onClick={() => setSearchQ('')} aria-label="Quitar búsqueda">✕</button>
                                </span>
                            )}
                            {scope !== 'all' && (
                                <span className={`${style.activeChip}`}>
                                    {SCOPE_TABS.find(t => t.id === scope)?.label}
                                    <button onClick={() => setScope('all')} aria-label="Quitar scope">✕</button>
                                </span>
                            )}
                            {selectedTags.map(tid => {
                                const tag = tagsWithCounts.find(t => t.id === tid);
                                if (!tag) return null;
                                return (
                                    <span key={tid} className={`${style.activeChip}`}>
                                        🏷️ {tag.nombre}
                                        <button onClick={() => toggleTag(tid)} aria-label={`Quitar ${tag.nombre}`}>✕</button>
                                    </span>
                                );
                            })}
                            <button className={`${style.btnLink}`} onClick={clearFilters}>Limpiar todo</button>
                        </div>
                    )}

                    <div className={`${style.resultInfo}`}>
                        <span>
                            <strong>{totalCount}</strong> {totalCount === 1 ? 'tarjeta' : 'tarjetas'}
                            {totalCount !== tarjetasAll.length && (
                                <span className={style.muted}> de {tarjetasAll.length}</span>
                            )}
                        </span>
                        <span className={style.muted}>Página {page} / {totalPages}</span>
                    </div>

                    {loadingTarjetas && tarjetasAll.length === 0 ? (
                        <div className={`${style.skeletonGrid}`}>
                            {Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className={`${style.skeletonCard}`} />
                            ))}
                        </div>
                    ) : totalCount === 0 ? (
                        <div className={`${style.emptyState}`}>
                            <div className={`${style.emptyIcon}`}>🃏</div>
                            <p>{tarjetasAll.length === 0 ? 'No hay tarjetas. ¡Crea la primera!' : 'No hay resultados con esos filtros.'}</p>
                            {activeFiltersCount > 0 && (
                                <button className={`${style.btnSecondary}`} onClick={clearFilters}>Limpiar filtros</button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className={`${style.tarjetasGrid} ${style[`view_${viewMode}`]}`}>
                                {paginated.map(tarjeta => (
                                    <TarjetaCard
                                        key={tarjeta.id}
                                        tarjeta={tarjeta}
                                        style={style}
                                        viewMode={viewMode}
                                        canEdit={canEdit(tarjeta)}
                                        getImageUrl={getImageUrl}
                                        onEdit={() => openEdit(tarjeta)}
                                        onDelete={() => handleDelete(tarjeta.id)}
                                        onPreview={() => openPreview(tarjeta)}
                                    />
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <Pagination
                                    style={style}
                                    page={page}
                                    totalPages={totalPages}
                                    setPage={setPage}
                                />
                            )}
                        </>
                    )}
                </main>
            </div>

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

const TarjetaCard = ({ tarjeta, style, viewMode, canEdit, getImageUrl, onEdit, onDelete, onPreview }) => {
    const img = getImageUrl(tarjeta);
    const cardClass = `${style.tarjetaCard} ${viewMode === 'compact' ? style.cardCompact : ''} ${viewMode === 'list' ? style.cardList : ''}`;
    return (
        <div className={cardClass}>
            <div className={`${style.tarjetaImage}`} onClick={onPreview} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onPreview()}>
                {img ? (
                    <img src={img} alt={tarjeta.nombre} loading="lazy" />
                ) : (
                    <div className={`${style.tarjetaImagePlaceholder}`}>
                        {tarjeta.nombre?.[0]?.toUpperCase() ?? '?'}
                    </div>
                )}
                <div className={style.zoomOverlay}>🔍</div>
            </div>
            <div className={`${style.tarjetaInfo}`}>
                <h3 className={`${style.tarjetaNombre}`}>{tarjeta.nombre}</h3>
                {viewMode !== 'compact' && tarjeta.descripcion && (
                    <p className={`${style.tarjetaDesc}`}>{tarjeta.descripcion}</p>
                )}
                {viewMode !== 'compact' && tarjeta.tags?.length > 0 && (
                    <div className={`${style.tarjetaTags}`}>
                        {tarjeta.tags.map(t => (
                            <span key={t.id} className={`${style.tagBadge}`}>{t.nombre}</span>
                        ))}
                    </div>
                )}
                {viewMode === 'list' && tarjeta.creador?.username && (
                    <span className={`${style.tarjetaCreador}`}>👤 {tarjeta.creador.username}</span>
                )}
            </div>
            <div className={`${style.tarjetaActions}`}>
                <button className={`${style.btnPreview}`} onClick={onPreview} title="Ver detalles" aria-label="Ver detalles">👁️</button>
                {canEdit && (
                    <>
                        <button className={`${style.btnEdit}`} onClick={onEdit} title="Editar" aria-label="Editar">✏️</button>
                        <button className={`${style.btnDel}`} onClick={onDelete} title="Eliminar" aria-label="Eliminar">🗑️</button>
                    </>
                )}
            </div>
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
            <button
                className={`${style.pageBtn}`}
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                aria-label="Página anterior"
            >‹</button>
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
            <button
                className={`${style.pageBtn}`}
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                aria-label="Página siguiente"
            >›</button>
        </nav>
    );
};
