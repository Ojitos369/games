import { localStates } from '../localStates';
import { TarjetaCard } from './TarjetaCard';
import { Pagination } from './Pagination';

export const TarjetasGrid = () => {
    const {
        style, paginated, totalCount, totalPages, page,
        loadingTarjetas, viewMode, activeFiltersCount, clearFilters,
    } = localStates();

    if (loadingTarjetas && paginated.length === 0) {
        return (
            <div className={`${style.skeletonGrid}`}>
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className={`${style.skeletonCard}`} />
                ))}
            </div>
        );
    }

    if (totalCount === 0) {
        return (
            <div className={`${style.emptyState}`}>
                <div className={`${style.emptyIcon}`}>🃏</div>
                <p>{activeFiltersCount > 0 ? 'No hay resultados con esos filtros.' : 'No hay tarjetas. ¡Crea la primera!'}</p>
                {activeFiltersCount > 0 && (
                    <button className={`${style.btnSecondary}`} onClick={clearFilters}>Limpiar filtros</button>
                )}
            </div>
        );
    }

    return (
        <>
            <div className={`${style.resultInfo}`}>
                <span>
                    <strong>{totalCount}</strong> {totalCount === 1 ? 'tarjeta' : 'tarjetas'}
                    {loadingTarjetas && <span className={style.muted}> · cargando…</span>}
                </span>
                <span className={style.muted}>Página {page} / {totalPages}</span>
            </div>
            <div className={`${style.tarjetasGrid} ${style[`view_${viewMode}`]}`}>
                {paginated.map(tarjeta => (
                    <TarjetaCard key={tarjeta.id} tarjeta={tarjeta} />
                ))}
            </div>
            <Pagination />
        </>
    );
};
