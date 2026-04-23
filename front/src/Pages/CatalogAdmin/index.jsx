import { localStates, localEffects } from './localStates';
import { Navigate } from 'react-router-dom';

export const CatalogAdmin = () => {
    const state = localStates();
    localEffects();

    const {
        style, juegos, categorias, isAdmin,
        activeTab, setActiveTab,
        showModal, editingItem,
        openCreateModal, openEditModal, closeModal,
        // Game form
        formNombre, setFormNombre,
        formDescripcion, setFormDescripcion,
        formJugadoresMin, setFormJugadoresMin,
        formJugadoresMax, setFormJugadoresMax,
        formUrl, setFormUrl,
        formCalificacion, setFormCalificacion,
        formDestacado, setFormDestacado,
        formEtiqueta, setFormEtiqueta,
        formCategorias, toggleCategoria,
        catNombre, setCatNombre,
        saveJuego, saveCategoria,
        deleteJuego, deleteCategoria,
        handleImageUpload, deleteImagen, getImageUrl,
        fileInputRef
    } = state;

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className={`${style.catalogPage}`}>
            <h1 className={`${style.pageTitle}`}>
                Catálogos <span className={`${style.titleAccent}`}>Admin</span>
            </h1>

            {/* Tabs */}
            <div className={`${style.tabsContainer}`}>
                <button
                    className={`${style.tab} ${activeTab === 'juegos' ? style.active : ''}`}
                    onClick={() => setActiveTab('juegos')}
                >
                    🎮 Juegos
                </button>
                <button
                    className={`${style.tab} ${activeTab === 'categorias' ? style.active : ''}`}
                    onClick={() => setActiveTab('categorias')}
                >
                    🏷️ Categorías
                </button>
            </div>

            {/* Action Bar */}
            <div className={`${style.actionBar}`}>
                <button className={`${style.addBtn}`} onClick={openCreateModal}>
                    + {activeTab === 'juegos' ? 'Nuevo Juego' : 'Nueva Categoría'}
                </button>
            </div>

            {/* Content */}
            {activeTab === 'juegos' ? (
                <JuegosTable
                    juegos={juegos}
                    style={style}
                    onEdit={openEditModal}
                    onDelete={deleteJuego}
                    onImageUpload={handleImageUpload}
                    onDeleteImage={deleteImagen}
                    getImageUrl={getImageUrl}
                />
            ) : (
                <CategoriasTable
                    categorias={categorias}
                    style={style}
                    onEdit={openEditModal}
                    onDelete={deleteCategoria}
                />
            )}

            {/* Modal */}
            {showModal && (
                <div className={`${style.modalOverlay}`} onClick={closeModal}>
                    <div className={`${style.modalCard}`} onClick={e => e.stopPropagation()}>
                        {activeTab === 'juegos' ? (
                            <JuegoForm
                                style={style}
                                editingItem={editingItem}
                                formNombre={formNombre} setFormNombre={setFormNombre}
                                formDescripcion={formDescripcion} setFormDescripcion={setFormDescripcion}
                                formJugadoresMin={formJugadoresMin} setFormJugadoresMin={setFormJugadoresMin}
                                formJugadoresMax={formJugadoresMax} setFormJugadoresMax={setFormJugadoresMax}
                                formUrl={formUrl} setFormUrl={setFormUrl}
                                formCalificacion={formCalificacion} setFormCalificacion={setFormCalificacion}
                                formDestacado={formDestacado} setFormDestacado={setFormDestacado}
                                formEtiqueta={formEtiqueta} setFormEtiqueta={setFormEtiqueta}
                                formCategorias={formCategorias} toggleCategoria={toggleCategoria}
                                categorias={categorias}
                                onSave={saveJuego}
                                onCancel={closeModal}
                            />
                        ) : (
                            <CategoriaForm
                                style={style}
                                editingItem={editingItem}
                                catNombre={catNombre}
                                setCatNombre={setCatNombre}
                                onSave={saveCategoria}
                                onCancel={closeModal}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


const JuegosTable = ({ juegos, style, onEdit, onDelete, onImageUpload, onDeleteImage, getImageUrl }) => (
    <table className={`${style.dataTable}`}>
        <thead>
            <tr>
                <th>Nombre</th>
                <th>URL</th>
                <th>Jugadores</th>
                <th>Cal.</th>
                <th>Categorías</th>
                <th>Imgs</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>
            {juegos.map(juego => (
                <tr key={juego.id}>
                    <td>
                        <strong>{juego.nombre}</strong>
                        {juego.destacado && <span style={{ marginLeft: 6, color: '#f59e0b' }}>⭐</span>}
                        {juego.etiqueta && <span style={{
                            marginLeft: 6, fontSize: '0.65rem',
                            background: juego.etiqueta === 'HOT' ? '#ef4444' : '#22c55e',
                            color: '#fff', padding: '1px 6px', borderRadius: 4
                        }}>{juego.etiqueta}</span>}
                    </td>
                    <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {juego.url || '-'}
                    </td>
                    <td>{juego.jugadores_min}-{juego.jugadores_max}</td>
                    <td>{juego.calificacion}</td>
                    <td>
                        <div className={`${style.catBadges}`}>
                            {juego.categorias?.map(c => (
                                <span key={c.id}>{c.nombre}</span>
                            ))}
                        </div>
                    </td>
                    <td>
                        <div className={`${style.imageSection}`}>
                            <div className={`${style.imageList}`}>
                                {juego.imagenes?.map(img => (
                                    <div key={img.id} className={`${style.imageThumb}`}>
                                        <img src={getImageUrl(juego, img)} alt={img.nombre} />
                                        {img.es_portada && <span className={`${style.portadaBadge}`}>PORTADA</span>}
                                        <button className={`${style.removeImg}`} onClick={() => onDeleteImage(img.id)}>✕</button>
                                    </div>
                                ))}
                            </div>
                            <label className={`${style.uploadArea}`}>
                                📁 Subir
                                <input type="file" accept="image/*" onChange={e => onImageUpload(juego, e)} />
                            </label>
                        </div>
                    </td>
                    <td>
                        <div className={`${style.actionBtns}`}>
                            <button onClick={() => onEdit(juego)}>✏️ Editar</button>
                            <button className={`${style.deleteBtn}`} onClick={() => onDelete(juego.id)}>🗑️</button>
                        </div>
                    </td>
                </tr>
            ))}
            {juegos.length === 0 && (
                <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.3)' }}>
                        No hay juegos registrados
                    </td>
                </tr>
            )}
        </tbody>
    </table>
);


const CategoriasTable = ({ categorias, style, onEdit, onDelete }) => (
    <table className={`${style.dataTable}`}>
        <thead>
            <tr>
                <th>Nombre</th>
                <th>Juegos</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody>
            {categorias.map(cat => (
                <tr key={cat.id}>
                    <td><strong>{cat.nombre}</strong></td>
                    <td>{cat.juegos_count || 0}</td>
                    <td>
                        <div className={`${style.actionBtns}`}>
                            <button onClick={() => onEdit(cat)}>✏️ Editar</button>
                            <button className={`${style.deleteBtn}`} onClick={() => onDelete(cat.id)}>🗑️</button>
                        </div>
                    </td>
                </tr>
            ))}
            {categorias.length === 0 && (
                <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.3)' }}>
                        No hay categorías registradas
                    </td>
                </tr>
            )}
        </tbody>
    </table>
);


const JuegoForm = ({
    style, editingItem,
    formNombre, setFormNombre,
    formDescripcion, setFormDescripcion,
    formJugadoresMin, setFormJugadoresMin,
    formJugadoresMax, setFormJugadoresMax,
    formUrl, setFormUrl,
    formCalificacion, setFormCalificacion,
    formDestacado, setFormDestacado,
    formEtiqueta, setFormEtiqueta,
    formCategorias, toggleCategoria,
    categorias,
    onSave, onCancel
}) => (
    <>
        <h2 className={`${style.modalTitle}`}>
            {editingItem ? '✏️ Editar Juego' : '🎮 Nuevo Juego'}
        </h2>
        <div className={`${style.formGroup}`}>
            <label>Nombre</label>
            <input value={formNombre} onChange={e => setFormNombre(e.target.value)} placeholder="Nombre del juego" />
        </div>
        <div className={`${style.formGroup}`}>
            <label>Descripción</label>
            <textarea value={formDescripcion} onChange={e => setFormDescripcion(e.target.value)} placeholder="Descripción del juego" />
        </div>
        <div className={`${style.formRow}`}>
            <div className={`${style.formGroup}`}>
                <label>Jugadores Mín</label>
                <input type="number" min="1" value={formJugadoresMin} onChange={e => setFormJugadoresMin(e.target.value)} />
            </div>
            <div className={`${style.formGroup}`}>
                <label>Jugadores Máx</label>
                <input type="number" min="1" value={formJugadoresMax} onChange={e => setFormJugadoresMax(e.target.value)} />
            </div>
        </div>
        <div className={`${style.formGroup}`}>
            <label>URL (ruta React)</label>
            <input value={formUrl} onChange={e => setFormUrl(e.target.value)} placeholder="/solo/rushcar" />
        </div>
        <div className={`${style.formRow}`}>
            <div className={`${style.formGroup}`}>
                <label>Calificación (0-10)</label>
                <input type="number" min="0" max="10" step="0.1" value={formCalificacion} onChange={e => setFormCalificacion(e.target.value)} />
            </div>
            <div className={`${style.formGroup}`}>
                <label>Etiqueta</label>
                <select value={formEtiqueta} onChange={e => setFormEtiqueta(e.target.value)}>
                    <option value="">Ninguna</option>
                    <option value="HOT">🔥 HOT</option>
                    <option value="NUEVO">✨ NUEVO</option>
                </select>
            </div>
        </div>
        <div className={`${style.formGroup}`}>
            <label className={`${style.checkboxLabel}`}>
                <input type="checkbox" checked={formDestacado} onChange={e => setFormDestacado(e.target.checked)} />
                ⭐ Juego Destacado
            </label>
        </div>
        <div className={`${style.formGroup}`}>
            <label>Categorías</label>
            <div className={`${style.catCheckboxes}`}>
                {categorias.map(cat => (
                    <label key={cat.id}
                        className={`${style.catChip} ${formCategorias.includes(cat.id) ? style.selected : ''}`}
                        onClick={() => toggleCategoria(cat.id)}
                    >
                        <input type="checkbox" checked={formCategorias.includes(cat.id)} readOnly />
                        {cat.nombre}
                    </label>
                ))}
            </div>
        </div>
        <div className={`${style.modalActions}`}>
            <button className={`${style.cancelBtn}`} onClick={onCancel}>Cancelar</button>
            <button className={`${style.saveBtn}`} onClick={onSave}>
                {editingItem ? 'Actualizar' : 'Crear'}
            </button>
        </div>
    </>
);


const CategoriaForm = ({ style, editingItem, catNombre, setCatNombre, onSave, onCancel }) => (
    <>
        <h2 className={`${style.modalTitle}`}>
            {editingItem ? '✏️ Editar Categoría' : '🏷️ Nueva Categoría'}
        </h2>
        <div className={`${style.formGroup}`}>
            <label>Nombre</label>
            <input value={catNombre} onChange={e => setCatNombre(e.target.value)} placeholder="Nombre de la categoría" />
        </div>
        <div className={`${style.modalActions}`}>
            <button className={`${style.cancelBtn}`} onClick={onCancel}>Cancelar</button>
            <button className={`${style.saveBtn}`} onClick={onSave}>
                {editingItem ? 'Actualizar' : 'Crear'}
            </button>
        </div>
    </>
);
