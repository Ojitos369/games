import { localStates, getImageUrl } from '../localStates';

export const DeckExpanded = ({ deck }) => {
    const { style, expandedDeck, deckTarjetas, openPreview } = localStates();

    if (expandedDeck !== deck.id) return null;
    const list = deckTarjetas[deck.id];

    if (!list) {
        return (
            <div className={`${style.deckExpanded}`}>
                <p className={`${style.emptyExpanded}`}>Cargando...</p>
            </div>
        );
    }
    if (list.length === 0) {
        return (
            <div className={`${style.deckExpanded}`}>
                <p className={`${style.emptyExpanded}`}>Este deck está vacío.</p>
            </div>
        );
    }

    return (
        <div className={`${style.deckExpanded}`}>
            <div className={`${style.deckTarjetasGrid}`}>
                {list.map(t => {
                    const img = getImageUrl(t);
                    return (
                        <div
                            key={t.id}
                            className={`${style.miniTarjeta}`}
                            title={t.nombre}
                            onClick={() => openPreview(t)}
                        >
                            {img ? (
                                <img src={img} alt={t.nombre} loading="lazy" />
                            ) : (
                                <span>{t.nombre?.[0]?.toUpperCase() ?? '?'}</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
