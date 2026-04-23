import { localStates, localEffects } from './localStates';
import { Link } from 'react-router-dom';

export const Library = () => {
    const {
        style, juegos, categorias, search, setSearch,
        activeCategory,
        destacado, filteredJuegos,
        getPortada, getStars, getRatingClass, getPlaceholderColor, getInitials,
        toggleFavorito
    } = localStates();
    localEffects();

    return (
        <div className={`${style.libraryPage}`}>
            {/* Hero / Featured Game */}
            {destacado && (
                <div className={`${style.heroSection}`}>
                    <div className={`${style.heroInfo}`}>
                        <span className={`${style.heroBadge}`}>DESTACADO</span>
                        <h1 className={`${style.heroTitle}`}>{destacado.nombre}</h1>
                        <div className={`${style.heroMeta}`}>
                            <span className={`${style.heroStars}`}>{getStars(destacado.calificacion)}</span>
                            <span className={`${style.heroRating}`}>
                                {destacado.calificacion}/10
                            </span>
                            <span>
                                {destacado.categorias?.map(c => c.nombre).join(' · ')}
                            </span>
                        </div>
                        <div className={`${style.heroCategories}`}>
                            {destacado.categorias?.map(c => (
                                <span key={c.id}>{c.nombre}</span>
                            ))}
                        </div>
                        {destacado.url && (
                            <Link to={destacado.url} className={`${style.heroBtn}`}>
                                ▶ Ver más
                            </Link>
                        )}
                    </div>
                    <div className={`${style.heroImage}`}>
                        {getPortada(destacado) ? (
                            <img src={getPortada(destacado)} alt={destacado.nombre} />
                        ) : (
                            <div className={`${style.heroImagePlaceholder}`}>
                                {getInitials(destacado.nombre)}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className={`${style.searchSection}`}>
                <div className={`${style.searchBar}`}>
                    <span className={`${style.searchIcon}`}>⚙</span>
                    <input
                        id="library-search"
                        type="text"
                        placeholder="Buscar juegos..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid Header */}
            <div className={`${style.gridHeader}`}>
                <h2>{activeCategory
                    ? categorias.find(c => c.id === activeCategory)?.nombre || 'Filtrado'
                    : 'Todo'
                }</h2>
                <span className={`${style.gameCount}`}>
                    {filteredJuegos.length} juego{filteredJuegos.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Games Grid */}
            {filteredJuegos.length > 0 ? (
                <div className={`${style.gamesGrid}`}>
                    {filteredJuegos.map((juego, index) => (
                        <GameCard
                            key={juego.id}
                            juego={juego}
                            index={index}
                            style={style}
                            getPortada={getPortada}
                            getStars={getStars}
                            getRatingClass={getRatingClass}
                            getPlaceholderColor={getPlaceholderColor}
                            getInitials={getInitials}
                            toggleFavorito={toggleFavorito}
                        />
                    ))}
                </div>
            ) : (
                <div className={`${style.emptyState}`}>
                    <div className={`${style.emptyIcon}`}>🎮</div>
                    <h3>No se encontraron juegos</h3>
                    <p>Intenta con otra búsqueda o categoría</p>
                </div>
            )}
        </div>
    );
};


const GameCard = ({ juego, index, style, getPortada, getStars, getRatingClass, getPlaceholderColor, getInitials, toggleFavorito }) => {
    const portada = getPortada(juego);
    const players = juego.jugadores_min === juego.jugadores_max
        ? `${juego.jugadores_min}p`
        : `${juego.jugadores_min}-${juego.jugadores_max}p`;

    const handleFavClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorito(juego.id);
    };

    return (
        <Link to={juego.url || '#'} className={`${style.gameCard}`} style={{ textDecoration: 'none' }}>
            {/* Badges */}
            <div className={`${style.cardBadges}`}>
                <div className={`${style.badgeLeft}`}>
                    {juego.etiqueta === 'HOT' && (
                        <span className={`${style.badge} ${style.hot}`}>🔥 HOT</span>
                    )}
                    {juego.etiqueta === 'NUEVO' && (
                        <span className={`${style.badge} ${style.nuevo}`}>NUEVO</span>
                    )}
                </div>
                <div className={`${style.badgeRight}`}>
                    <button 
                        className={`${style.favBtn} ${juego.es_favorito ? style.isFav : ''}`} 
                        onClick={handleFavClick}
                    >
                        {juego.es_favorito ? '❤️' : '🤍'}
                    </button>
                    {juego.calificacion > 0 && (
                        <span className={`${style.ratingBadge} ${style[getRatingClass(juego.calificacion)]}`}>
                            {juego.calificacion}
                        </span>
                    )}
                </div>
            </div>

            {/* Image */}
            <div className={`${style.cardImage}`}>
                {portada ? (
                    <img src={portada} alt={juego.nombre} loading="lazy" />
                ) : (
                    <div className={`${style.cardImagePlaceholder} ${style[getPlaceholderColor(index)]}`}>
                        <span className={`${style.placeholderText}`}>{getInitials(juego.nombre)}</span>
                        <span className={`${style.placeholderOverlay}`}>portada del juego</span>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className={`${style.cardInfo}`}>
                <h3 className={`${style.cardTitle}`}>{juego.nombre}</h3>
                <div className={`${style.cardStars}`}>{getStars(juego.calificacion)}</div>
                <div className={`${style.cardMeta}`}>
                    <span>{players}</span>
                </div>
            </div>
        </Link>
    );
};
