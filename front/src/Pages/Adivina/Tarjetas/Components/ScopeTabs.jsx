import { localStates } from '../localStates';

export const ScopeTabs = () => {
    const { style, scope, setScope, scopeCounts } = localStates();

    const SCOPE_TABS = [
        { id: 'all', label: 'Todas', icon: '🃏', count: scopeCounts.all },
        { id: 'mine', label: 'Mías', icon: '👤', count: scopeCounts.mine },
        { id: 'no_image', label: 'Sin imagen', icon: '🖼️', count: scopeCounts.no_image },
        { id: 'no_tags', label: 'Sin tags', icon: '🏷️', count: scopeCounts.no_tags },
    ];

    return (
        <div className={`${style.tabsRow}`} role="tablist">
            {SCOPE_TABS.map(tab => (
                <button
                    key={tab.id}
                    role="tab"
                    aria-selected={scope === tab.id}
                    className={`${style.tabBtn} ${scope === tab.id ? style.tabActive : ''}`}
                    onClick={() => setScope(tab.id)}
                >
                    <span className={style.tabIcon}>{tab.icon}</span>
                    <span className={style.tabLabel}>{tab.label}</span>
                    <span className={style.tabCount}>{tab.count}</span>
                </button>
            ))}
        </div>
    );
};
