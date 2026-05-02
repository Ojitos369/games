import { localStates, localEffects } from './localStates';
import { Link } from 'react-router-dom';

export const GameDetail = () => {
    const {
        style, juego, loading, rating, setRating, comentario, setComentario,
        handleRating, sendingRating, getStars, getPortada, navigate, showDate,
        toggleFavorito
    } = localStates();
    localEffects();

    if (loading) {
        return <div className={style.loading}>Cargando...</div>;
    }

    if (!juego) {
        return <div className={style.error}>No se encontró el juego</div>;
    }

    const portada = getPortada(juego);

    return (
        <div className={style.gameDetailPage}>
            <div className={style.header}>
                <button onClick={() => navigate(-1)} className={style.backBtn}>← Volver</button>
            </div>

            <div className={style.content}>
                <div className={style.mainInfo}>
                    <div className={style.imageSection}>
                        {portada ? (
                            <img src={portada} alt={juego.nombre} className={style.portada} />
                        ) : (
                            <div className={style.placeholder}>{juego.nombre[0]}</div>
                        )}
                    </div>
                    
                    <div className={style.detailsSection}>
                        <div className={style.titleRow}>
                            <h1 className={style.title}>{juego.nombre}</h1>
                            <button 
                                className={`${style.favBtn} ${juego.es_favorito ? style.isFav : ''}`}
                                onClick={toggleFavorito}
                            >
                                {juego.es_favorito ? '❤️' : '🤍'}
                            </button>
                        </div>

                        <div className={style.metaRow}>
                            <span className={style.stars}>{getStars(juego.calificacion)}</span>
                            <span className={style.ratingText}>{juego.calificacion.toFixed(1)}/10</span>
                            <span className={style.players}>{juego.jugadores_min}-{juego.jugadores_max} jugadores</span>
                        </div>

                        <div className={style.categories}>
                            {juego.categorias?.map(c => (
                                <span key={c.id} className={style.categoryBadge}>{c.nombre}</span>
                            ))}
                        </div>

                        <p className={style.description}>{juego.descripcion}</p>

                        <div className={style.actions}>
                            {juego.url && (
                                <Link to={juego.url} className={style.playBtn}>
                                    JUGAR AHORA ▶
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                <div className={style.secondarySection}>
                    <div className={style.ratingForm}>
                        <h3>Calificar este juego</h3>
                        <div className={style.starInput}>
                            {[...Array(10)].map((_, i) => (
                                <button 
                                    key={i} 
                                    className={`${style.starBtn} ${rating > i ? style.active : ''}`}
                                    onClick={() => setRating(i + 1)}
                                >
                                    ★
                                </button>
                            ))}
                            <span className={style.ratingVal}>{rating}/10</span>
                        </div>
                        <textarea 
                            placeholder="Escribe tu comentario..." 
                            value={comentario}
                            onChange={e => setComentario(e.target.value)}
                            className={style.commentInput}
                        />
                        <button 
                            onClick={handleRating} 
                            disabled={sendingRating || rating === 0}
                            className={style.submitBtn}
                        >
                            {sendingRating ? 'Enviando...' : 'Guardar calificación'}
                        </button>
                    </div>

                    <div className={style.commentsList}>
                        <h3>Comentarios ({juego.comentarios?.length || 0})</h3>
                        {juego.comentarios?.length > 0 ? (
                            juego.comentarios.map((c, i) => (
                                <div key={i} className={style.commentCard}>
                                    <div className={style.commentHeader}>
                                        <span className={style.commentUser}>{c.username}</span>
                                        <span className={style.commentStars}>{getStars(c.calificacion)}</span>
                                        <span className={style.commentDate}>{showDate(c.created_at)}</span>
                                    </div>
                                    <p className={style.commentText}>{c.comentario}</p>
                                </div>
                            ))
                        ) : (
                            <p className={style.noComments}>Aún no hay comentarios. ¡Sé el primero!</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
