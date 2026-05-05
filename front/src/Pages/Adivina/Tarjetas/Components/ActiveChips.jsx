import { localStates } from '../localStates';

const SCOPE_LABELS = {
    all: 'Todas', mine: 'Mías', no_image: 'Sin imagen', no_tags: 'Sin tags',
};

export const ActiveChips = () => {
    const {
        style, searchQ, setSearchQ, scope, setScope,
        selectedTags, toggleTag, tagsWithCounts, clearFilters,
    } = localStates();

    if (selectedTags.length === 0 && !searchQ && scope === 'all') return null;

    return (
        <div className={`${style.activeChips}`}>
            {searchQ && (
                <span className={`${style.activeChip}`}>
                    🔍 "{searchQ}"
                    <button onClick={() => setSearchQ('')} aria-label="Quitar búsqueda">✕</button>
                </span>
            )}
            {scope !== 'all' && (
                <span className={`${style.activeChip}`}>
                    {SCOPE_LABELS[scope] || scope}
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
    );
};
