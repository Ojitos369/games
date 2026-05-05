import { localStates } from '../localStates';

export const TopTagStrip = () => {
    const {
        style, topTags, tagsWithCounts, selectedTags, toggleTag,
        scopeCounts, openFiltersMenu,
    } = localStates();

    if (topTags.length === 0) return null;

    return (
        <div className={`${style.topTagStrip}`} role="group" aria-label="Categorías populares">
            <button
                className={`${style.topTagChip} ${selectedTags.length === 0 ? style.topTagChipActive : ''}`}
                onClick={() => selectedTags.slice().forEach(toggleTag)}
            >
                <span>Todas</span>
                <span className={style.topTagCount}>{scopeCounts.all}</span>
            </button>
            {topTags.map(tag => (
                <button
                    key={tag.id}
                    className={`${style.topTagChip} ${selectedTags.includes(tag.id) ? style.topTagChipActive : ''}`}
                    onClick={() => toggleTag(tag.id)}
                    aria-pressed={selectedTags.includes(tag.id)}
                    title={`${tag.nombre} (${tag.count})`}
                >
                    <span>🏷️ {tag.nombre}</span>
                    <span className={style.topTagCount}>{tag.count}</span>
                </button>
            ))}
            {tagsWithCounts.length > topTags.length && (
                <button className={`${style.topTagMore}`} onClick={openFiltersMenu}>
                    +{tagsWithCounts.length - topTags.length} más
                </button>
            )}
        </div>
    );
};
