import { localStates } from '../localStates';

export const TarjetaCard = ({ tarjeta }) => {
    const {
        style, viewMode, getImageUrl, canEdit,
        openEdit, handleDelete, openPreview,
    } = localStates();

    const img = getImageUrl(tarjeta);
    const editable = canEdit(tarjeta);
    const cardClass = `${style.tarjetaCard} ${viewMode === 'compact' ? style.cardCompact : ''} ${viewMode === 'list' ? style.cardList : ''}`;

    return (
        <div className={cardClass}>
            <div
                className={`${style.tarjetaImage}`}
                onClick={() => openPreview(tarjeta)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && openPreview(tarjeta)}
            >
                {img ? (
                    <img src={img} alt={tarjeta.nombre} loading="lazy" />
                ) : (
                    <div className={`${style.tarjetaImagePlaceholder}`}>
                        {tarjeta.nombre?.[0]?.toUpperCase() ?? '?'}
                    </div>
                )}
                <div className={style.zoomOverlay}>🔍</div>
            </div>
            <div className={`${style.tarjetaInfo}`}>
                <h3 className={`${style.tarjetaNombre}`}>{tarjeta.nombre}</h3>
                {viewMode !== 'compact' && tarjeta.descripcion && (
                    <p className={`${style.tarjetaDesc}`}>{tarjeta.descripcion}</p>
                )}
                {viewMode !== 'compact' && tarjeta.tags?.length > 0 && (
                    <div className={`${style.tarjetaTags}`}>
                        {tarjeta.tags.map(t => (
                            <span key={t.id} className={`${style.tagBadge}`}>{t.nombre}</span>
                        ))}
                    </div>
                )}
                {viewMode === 'list' && tarjeta.creador?.username && (
                    <span className={`${style.tarjetaCreador}`}>👤 {tarjeta.creador.username}</span>
                )}
            </div>
            <div className={`${style.tarjetaActions}`}>
                <button className={`${style.btnPreview}`} onClick={() => openPreview(tarjeta)} title="Ver detalles" aria-label="Ver detalles">👁️</button>
                {editable && (
                    <>
                        <button className={`${style.btnEdit}`} onClick={() => openEdit(tarjeta)} title="Editar" aria-label="Editar">✏️</button>
                        <button className={`${style.btnDel}`} onClick={() => handleDelete(tarjeta.id)} title="Eliminar" aria-label="Eliminar">🗑️</button>
                    </>
                )}
            </div>
        </div>
    );
};
