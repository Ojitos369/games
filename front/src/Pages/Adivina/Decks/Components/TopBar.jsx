import { localStates } from '../localStates';

export const TopBar = () => {
    const {
        style, navigate, isMis,
        misSearchQ, setMisSearchQ,
        pubSearchQ, setPubSearchQ,
        openCreate, openFiltersMenu,
    } = localStates();

    const searchValue = isMis ? misSearchQ : pubSearchQ;
    const setSearch = isMis ? setMisSearchQ : setPubSearchQ;

    return (
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
                        value={searchValue}
                        onChange={e => setSearch(e.target.value)}
                        className={`${style.searchInput}`}
                        aria-label="Buscar deck"
                    />
                    {searchValue && (
                        <button
                            className={`${style.btnClearSearch}`}
                            onClick={() => setSearch('')}
                            aria-label="Limpiar búsqueda"
                        >✕</button>
                    )}
                </div>
                <button
                    className={`${style.btnFilters}`}
                    onClick={openFiltersMenu}
                    aria-label="Abrir filtros"
                >
                    ⚙️ <span className={style.btnFiltersLabel}>Filtros</span>
                </button>
                {isMis && (
                    <button className={`${style.btnPrimary}`} onClick={openCreate}>+ Nuevo Deck</button>
                )}
            </div>
        </div>
    );
};
