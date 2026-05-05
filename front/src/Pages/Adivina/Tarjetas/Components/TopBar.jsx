import { localStates } from '../localStates';

export const TopBar = () => {
    const {
        style, navigate, searchQ, setSearchQ,
        activeFiltersCount, openCreate, openFiltersMenu,
    } = localStates();

    return (
        <div className={`${style.topBar}`}>
            <div className={`${style.headerTitle}`}>
                <button className={`${style.btnBack}`} onClick={() => navigate('/adivina')}>← Volver</button>
                <h1 className={`${style.pageTitle}`}>
                    Catálogo de <span className={style.accent}>Tarjetas</span>
                </h1>
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
                    onClick={openFiltersMenu}
                    aria-label="Abrir filtros"
                >
                    ⚙️ <span className={style.btnFiltersLabel}>Filtros</span>
                    {activeFiltersCount > 0 && <span className={style.filterBadge}>{activeFiltersCount}</span>}
                </button>
                <button className={`${style.btnPrimary}`} onClick={openCreate}>+ Nueva</button>
            </div>
        </div>
    );
};
