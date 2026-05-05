import { localStates } from '../localStates';

export const ScopeStrip = () => {
    const { style, isMis, misScope, setMisScope, decksMeta } = localStates();

    if (!isMis) return null;

    const SCOPE_TABS = [
        { id: 'all', label: 'Todos', icon: '🗂️', count: decksMeta.scope_counts?.all ?? 0 },
        { id: 'owned', label: 'Creados', icon: '✍️', count: decksMeta.scope_counts?.owned ?? 0 },
        { id: 'imported', label: 'Importados', icon: '📥', count: decksMeta.scope_counts?.imported ?? 0 },
    ];

    return (
        <div className={`${style.scopeStrip}`} role="tablist" aria-label="Filtrar por origen">
            {SCOPE_TABS.map(t => (
                <button
                    key={t.id}
                    role="tab"
                    aria-selected={misScope === t.id}
                    className={`${style.scopeBtn} ${misScope === t.id ? style.scopeBtnActive : ''}`}
                    onClick={() => setMisScope(t.id)}
                >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                    <span className={style.scopeCount}>{t.count}</span>
                </button>
            ))}
        </div>
    );
};
