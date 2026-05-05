import { localStates } from './localStates';

export const MenuBarAdivinaTarjetas = () => {
    const {
        style, sortBy, setSortBy, sortOptions,
        tagMode, setTagMode,
        selectedTags, toggleTag,
        tagSearch, setTagSearch,
        filteredSidebarTags,
        viewMode, setViewMode, viewModes,
        pageSize, setPageSize, pageSizeOptions,
        activeFiltersCount, clearFilters,
    } = localStates();

    return (
        <div className={`${style.sideFilters}`} style={{ position: 'static', width: '100%', height: '100%', overflowY: 'auto', borderRadius: 0, transform: 'none', maxHeight: '100%', boxShadow: 'none' }} aria-label="Filtros">
            <div className={`${style.sideFiltersHeader}`}>
                <h3>Filtros</h3>
                {activeFiltersCount > 0 && (
                    <button className={`${style.btnLink}`} onClick={clearFilters}>Limpiar</button>
                )}
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
                <input
                    type="search"
                    placeholder="Buscar tag..."
                    value={tagSearch}
                    onChange={e => setTagSearch(e.target.value)}
                    className={`${style.tagSearchInput}`}
                    aria-label="Buscar tag"
                />
                <div className={`${style.tagList}`}>
                    {filteredSidebarTags.length === 0 && (
                        <div className={style.muted}>Sin coincidencias</div>
                    )}
                    {filteredSidebarTags.map(tag => (
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
                    {viewModes.map(v => (
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
        </div>
    );
};
