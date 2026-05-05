import { localStates } from '../localStates';
import { DeckItem } from './DeckItem';
import { Pagination } from './Pagination';

export const DecksList = () => {
    const {
        style, isMis, items, loading, totalCount, currentPage, totalPages,
        misSearchQ, pubSearchQ,
    } = localStates();

    if (loading && items.length === 0) {
        return (
            <div className={`${style.skeletonList}`}>
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={`${style.skeletonItem}`} />
                ))}
            </div>
        );
    }
    if (items.length === 0) {
        return (
            <div className={`${style.emptyState}`}>
                <div className={`${style.emptyIcon}`}>{isMis ? '🗂️' : '🌐'}</div>
                <p>
                    {isMis
                        ? (misSearchQ ? 'Sin coincidencias.' : 'No tienes decks. Crea uno o explora públicos.')
                        : (pubSearchQ ? 'Sin coincidencias.' : 'No hay decks públicos disponibles.')}
                </p>
            </div>
        );
    }

    return (
        <>
            <div className={`${style.resultInfo}`}>
                <span>
                    <strong>{totalCount}</strong> {totalCount === 1 ? 'deck' : 'decks'}
                    {loading && <span className={style.muted}> · cargando…</span>}
                </span>
                <span className={style.muted}>Página {currentPage} / {totalPages}</span>
            </div>
            <div className={`${style.decksGrid}`}>
                {items.map(deck => (
                    <DeckItem
                        key={isMis ? (deck.is_owner ? deck.id : (deck.import_id || deck.id)) : deck.id}
                        deck={deck}
                        mode={isMis ? 'mis' : 'explorar'}
                    />
                ))}
            </div>
            <Pagination />
        </>
    );
};
