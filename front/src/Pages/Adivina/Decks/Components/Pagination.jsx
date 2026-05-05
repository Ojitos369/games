import { localStates } from '../localStates';

export const Pagination = () => {
    const { style, currentPage: page, totalPages, setCurrentPage: setPage } = localStates();

    if (totalPages <= 1) return null;

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
