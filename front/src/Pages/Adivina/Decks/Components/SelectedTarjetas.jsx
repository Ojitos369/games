import { localStates, getImageUrl } from '../localStates';

export const SelectedTarjetas = () => {
    const {
        style, orderedSelectedTarjetas,
        moveTarjetaUp, moveTarjetaDown, sortTarjetas, toggleDeckTarjeta,
    } = localStates();

    return (
        <div className={`${style.formGroup}`}>
            <label>Tarjetas en orden: <strong>{orderedSelectedTarjetas.length}</strong></label>
            {orderedSelectedTarjetas.length > 0 && (
                <div className={`${style.orderingControls}`}>
                    <button className={`${style.btnSecondary}`} onClick={() => sortTarjetas('name_asc')}>Por Nombre</button>
                    <button className={`${style.btnSecondary}`} onClick={() => sortTarjetas('tag')}>Por Categoría</button>
                    <button className={`${style.btnSecondary}`} onClick={() => sortTarjetas('random')}>Aleatorio</button>
                </div>
            )}
            <div className={`${style.selectedTarjetasGrid}`}>
                {orderedSelectedTarjetas.map((t, index) => (
                    <div key={t.id} className={`${style.selectedTarjetaItem}`}>
                        <div className={`${style.orderButtons}`}>
                            <button className={`${style.btnIcon}`} onClick={() => moveTarjetaUp(index)} disabled={index === 0}>▲</button>
                            <span className={`${style.orderIndex}`}>{index + 1}</span>
                            <button className={`${style.btnIcon}`} onClick={() => moveTarjetaDown(index)} disabled={index === orderedSelectedTarjetas.length - 1}>▼</button>
                        </div>
                        <div className={`${style.selectedTarjetaImgBox}`}>
                            {t.imagen || t.imagen_url ? (
                                <img src={getImageUrl(t)} alt="" className={`${style.miniTarjetaImg}`} loading="lazy" />
                            ) : (
                                <div className={`${style.miniTarjetaPlaceholder}`}>🎭</div>
                            )}
                        </div>
                        <div className={`${style.tarjetaPickerInfo}`}>
                            <div className={`${style.tarjetaPickerName}`}>{t.nombre}</div>
                            <button className={`${style.btnDelSelected}`} onClick={() => toggleDeckTarjeta(t)}>Quitar</button>
                        </div>
                    </div>
                ))}
                {orderedSelectedTarjetas.length === 0 && (
                    <p style={{ padding: '0.5rem', opacity: 0.6, fontSize: '0.85rem' }}>Aún no hay tarjetas en el deck.</p>
                )}
            </div>
        </div>
    );
};
