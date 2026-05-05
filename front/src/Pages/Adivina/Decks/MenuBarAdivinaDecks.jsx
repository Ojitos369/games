import { localStates } from './localStates';

export const MenuBarAdivinaDecks = () => {
    const {
        style, isMis,
        misSort, setMisSort, sortOptionsMis,
        pubSort, setPubSort, sortOptionsPublic,
        pubOnlyNew, setPubOnlyNew,
        pageSize, setPageSize, pageSizeOptions,
    } = localStates();

    const sortValue = isMis ? misSort : pubSort;
    const setSort = isMis ? setMisSort : setPubSort;
    const sortOpts = isMis ? sortOptionsMis : sortOptionsPublic;

    return (
        <div className={`${style.sideFilters}`} style={{ position: 'static', width: '100%', height: '100%', overflowY: 'auto', borderRadius: 0, transform: 'none', maxHeight: '100%', boxShadow: 'none' }} aria-label="Filtros">
            <div className={`${style.sideFiltersHeader}`}>
                <h3>Filtros</h3>
            </div>

            <div className={`${style.sideSection}`}>
                <h4 className={style.sideSectionTitle}>Ordenar</h4>
                <select
                    className={`${style.select}`}
                    value={sortValue}
                    onChange={e => setSort(e.target.value)}
                >
                    {sortOpts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
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
                <select
                    className={`${style.select}`}
                    value={pageSize}
                    onChange={e => setPageSize(Number(e.target.value))}
                >
                    {pageSizeOptions.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
            </div>
        </div>
    );
};
