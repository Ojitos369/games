import { localStates } from '../localStates';
import { DeckExpanded } from './DeckExpanded';

export const DeckItem = ({ deck, mode }) => {
    const {
        style, expandedDeck, toggleExpand,
        handleTogglePublico, openEdit, handleDelete,
        handleCopiar, handleDesvincular, handleImportar,
    } = localStates();

    const isOwner = !!deck.is_owner;

    if (mode === 'mis') {
        return (
            <div className={`${style.deckItem} ${deck.linked ? style.deckLinked : ''}`}>
                <div className={`${style.deckRow}`} onClick={() => toggleExpand(deck)}>
                    <div className={`${style.deckMain}`}>
                        <span className={`${style.deckArrow} ${expandedDeck === deck.id ? style.deckArrowOpen : ''}`}>▶</span>
                        <div className={style.deckInfo}>
                            <div className={`${style.deckName}`}>
                                {deck.nombre}
                                {deck.linked && (
                                    <span className={`${style.linkedBadge}`} title="Deck vinculado — se actualiza con el original">
                                        🔗 {deck.creador_username}
                                    </span>
                                )}
                            </div>
                            {deck.descripcion && <div className={`${style.deckDesc}`}>{deck.descripcion}</div>}
                        </div>
                    </div>
                    <div className={`${style.deckMeta}`}>
                        <span className={`${style.deckCount}`}>🃏 {deck.tarjetas_count}</span>
                        {isOwner ? (
                            <>
                                <button
                                    className={`${style.btnIcon32} ${deck.publico ? style.btnPublic : ''}`}
                                    onClick={e => { e.stopPropagation(); handleTogglePublico(deck); }}
                                    title={deck.publico ? 'Público — clic para privatizar' : 'Privado — clic para publicar'}
                                >
                                    {deck.publico ? '🌐' : '🔒'}
                                </button>
                                <button className={`${style.btnEdit}`} onClick={e => { e.stopPropagation(); openEdit(deck); }}>✏️</button>
                                <button className={`${style.btnDel}`} onClick={e => { e.stopPropagation(); handleDelete(deck.id); }}>🗑️</button>
                            </>
                        ) : (
                            <>
                                <button
                                    className={`${style.btnCopy}`}
                                    onClick={e => { e.stopPropagation(); handleCopiar(deck.id); }}
                                    title="Copiar como propio (sin vínculo)"
                                >📋</button>
                                <button
                                    className={`${style.btnDel}`}
                                    onClick={e => { e.stopPropagation(); handleDesvincular(deck.id); }}
                                    title="Desvincular deck"
                                >✂️</button>
                            </>
                        )}
                    </div>
                </div>
                <DeckExpanded deck={deck} />
            </div>
        );
    }

    return (
        <div className={`${style.deckItem}`}>
            <div className={`${style.deckRow}`} onClick={() => toggleExpand(deck)}>
                <div className={`${style.deckMain}`}>
                    <span className={`${style.deckArrow} ${expandedDeck === deck.id ? style.deckArrowOpen : ''}`}>▶</span>
                    <div className={style.deckInfo}>
                        <div className={`${style.deckName}`}>{deck.nombre}</div>
                        <div className={`${style.deckAuthor}`}>por {deck.creador_username}</div>
                        {deck.descripcion && <div className={`${style.deckDesc}`}>{deck.descripcion}</div>}
                    </div>
                </div>
                <div className={`${style.deckMeta}`}>
                    <span className={`${style.deckCount}`}>🃏 {deck.tarjetas_count}</span>
                    {deck.imports_count !== undefined && (
                        <span className={`${style.deckCount}`} title="Importaciones">📥 {deck.imports_count}</span>
                    )}
                    {deck.ya_importado ? (
                        <span className={`${style.importadoBadge}`}>✓ Importado</span>
                    ) : (
                        <button
                            className={`${style.btnImport}`}
                            onClick={e => { e.stopPropagation(); handleImportar(deck.id); }}
                        >+ Importar</button>
                    )}
                </div>
            </div>
            <DeckExpanded deck={deck} />
        </div>
    );
};
