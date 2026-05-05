import { localStates, getImageUrl } from '../localStates';

export const TarjetaPicker = () => {
    const {
        style, tags, form,
        pickerSearch, setPickerSearch,
        pickerTagFilter, setPickerTagFilter,
        pickerPage, setPickerPage,
        pickerData, pickerLoading,
        toggleDeckTarjeta, openPreview,
    } = localStates();

    const totalPickerPages = Math.max(1, pickerData.pages || 1);
    const selectedSet = new Set(form.tarjeta_ids || []);

    return (
        <div className={`${style.formGroup}`}>
            <label>Buscar y agregar tarjetas <span className={style.muted}>({pickerData.total} disponibles)</span></label>
            <div className={`${style.tarjetaPickerFilters}`}>
                <input
                    type="search"
                    placeholder="Buscar tarjeta..."
                    value={pickerSearch}
                    onChange={e => setPickerSearch(e.target.value)}
                    className={`${style.input}`}
                />
                <select
                    value={pickerTagFilter}
                    onChange={e => setPickerTagFilter(e.target.value)}
                    className={`${style.select}`}
                >
                    <option value="">Todos los tags</option>
                    {tags.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
            </div>
            <div className={`${style.tarjetaPicker}`}>
                {pickerLoading && pickerData.tarjetas.length === 0 ? (
                    <p style={{ padding: '1rem', textAlign: 'center', opacity: 0.5 }}>Cargando…</p>
                ) : pickerData.tarjetas.length === 0 ? (
                    <p style={{ padding: '1rem', textAlign: 'center', opacity: 0.5 }}>Sin resultados</p>
                ) : (
                    pickerData.tarjetas.map(t => {
                        const isSelected = selectedSet.has(t.id);
                        return (
                            <div key={t.id} className={`${style.tarjetaPickerItemWrapper}`}>
                                <label className={`${style.tarjetaPickerItem} ${isSelected ? style.tarjetaPickerSelected : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleDeckTarjeta(t)}
                                        style={{ display: 'none' }}
                                    />
                                    <div className={`${style.tarjetaPickerImgBox}`}>
                                        {t.imagen || t.imagen_url ? (
                                            <img src={getImageUrl(t)} alt="" className={`${style.miniTarjetaImg}`} loading="lazy" />
                                        ) : (
                                            <div className={`${style.miniTarjetaPlaceholder}`}>🎭</div>
                                        )}
                                    </div>
                                    <div className={`${style.tarjetaPickerInfo}`}>
                                        <div className={`${style.tarjetaPickerName}`}>
                                            <span className={`${style.checkmark}`}>{isSelected ? '✓ ' : ''}</span>
                                            {t.nombre}
                                        </div>
                                        <div className={`${style.tarjetaPickerTags}`}>
                                            {t.tags?.slice(0, 2).map(tg => (
                                                <span key={tg.id} className={`${style.miniTag}`}>{tg.nombre}</span>
                                            ))}
                                        </div>
                                    </div>
                                </label>
                                <button className={style.btnFloatPreview} onClick={() => openPreview(t)} title="Ver imagen">👁️</button>
                            </div>
                        );
                    })
                )}
            </div>
            {totalPickerPages > 1 && (
                <div className={style.pickerPagination}>
                    <button
                        className={`${style.pageBtn}`}
                        onClick={() => setPickerPage(Math.max(1, pickerPage - 1))}
                        disabled={pickerPage <= 1 || pickerLoading}
                    >‹ Ant</button>
                    <span className={style.muted}>{pickerPage} / {totalPickerPages}</span>
                    <button
                        className={`${style.pageBtn}`}
                        onClick={() => setPickerPage(Math.min(totalPickerPages, pickerPage + 1))}
                        disabled={pickerPage >= totalPickerPages || pickerLoading}
                    >Sig ›</button>
                </div>
            )}
        </div>
    );
};
