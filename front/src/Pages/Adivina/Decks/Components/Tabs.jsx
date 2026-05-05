import { localStates } from '../localStates';

export const Tabs = () => {
    const { style, isMis, switchTab, decksMeta } = localStates();

    return (
        <div className={`${style.tabs}`} role="tablist">
            <button
                role="tab"
                aria-selected={isMis}
                className={`${style.tab} ${isMis ? style.tabActive : ''}`}
                onClick={() => switchTab('mis')}
            >
                🗂️ Mis Decks <span className={style.tabCount}>{decksMeta.scope_counts?.all ?? 0}</span>
            </button>
            <button
                role="tab"
                aria-selected={!isMis}
                className={`${style.tab} ${!isMis ? style.tabActive : ''}`}
                onClick={() => switchTab('explorar')}
            >
                🌐 Explorar
            </button>
        </div>
    );
};
