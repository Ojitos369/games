## Obsidian
- Este proyecto está documentado en Obsidian. El vault es `OjosApps`. El aplicativo se llama `games`. Toma la información de obsidian para seguir la información y ruta de acuerdo a la solicitud.
- Los cambios que realices y la información que obtengas se debe de registrar en obsidian para actualizar el proyecto.
- En caso de no tener acceso a la skill de Obsidian utiliza la ruta `/home/ojitos369/Documents/Obsidian/OjosApps`
- Estructura de documentación en Obsidian: `Projects/games/` (ficha principal), `Projects/games/Modulos/` (Auth, Base, Catalog, RushCar, Sockets, Adivina).

## Actualización de documentación
- **Cada cambio realizado en el código debe reflejarse en Obsidian.** Se debe actualizar el módulo correspondiente en `Projects/games/Modulos/` según el dominio afectado.
- Si el cambio afecta la arquitectura general, tecnologías, estructura de directorios o patrones globales, se debe actualizar también la ficha principal `Projects/games.md`.
- Si el cambio introduce, modifica o elimina instrucciones relevantes para futuros agentes (convenciones, paths, tecnologías, módulos, tablas, reglas de estilo, etc.), se debe actualizar este archivo `AGENTS.md` para mantenerlo sincronizado.

## Backend
- Framework: FastAPI (Python 3.13) + Uvicorn
- Base de datos: PostgreSQL (puerto 5433, db/user/password: `games`) vía `ojitos369_postgres_db`
- Librería interna: `ojitos369` (utils, errores, conexión DB)
- Clases base en `back/core/bases/apis.py`: `BaseApi`, `ConexionApi` (auto-crea conexión), `SessionApi` (requiere token), `WebSocketApi`
- Sesiones: Token UUID almacenado en cookie `gamestka` o header `Authorization`
- Seguridad de contraseñas: argon2-cffi (`back/core/utils/security.py`)
- Rol admin: username `test` (verificado en tiempo de ejecución, no por tabla de roles)
- Modos de ejecución: `RUN_PROD_MODE` (default True) y `RUN_DEV_MODE` (default False)
- Puerto local: 8372 | Docker: 8368

## Frontend
- Framework: React 19 (canary) + Vite 6
- Estado: Redux Toolkit (`@reduxjs/toolkit`)
- Estilos: Tailwind CSS, Sass (módulos `*.module.scss`)
- Ubicación: `front/`
- Los componentes deben ir modularizados en pequeños componentes
- Patrón por componente/página: `index.jsx` + `localStates.jsx` + `styles/index.module.scss`
- Cada componente debe jalar las variables que ocupa del `localStates` correspondiente
- Para colores y medidas utilizar variables en `front/src/static/css/vars.css`
- En caso de utilizar media queries utilizar `front/src/static/css/response.scss`
- Utilizar container query en lugar de media query de ser posible
- Usar grid con `minmax` para layouts responsivos de ser posible
- Hacer los estilos responsivos
- Las clases de los componentes deben tener la siguiente forma: `className={\`${style.nombreClase} clasesExtra\`}` para poder utilizar clases del componente y clases generales
- Router: `HashRouter` (no BrowserRouter)
- El menú lateral se llama GAMES (anteriormente VAULT)

## Migraciones de front
- El front se compila: `cd front && pnpm run build`
- Una vez compilado se ejecuta `migrate_view.py` para migrar el build de React (`front/dist`) a `back/media/dist`, ajustando paths de `/assets/`
- El script también elimina referencias a `localhost` de los archivos JS del build

## Módulos existentes

### Backend (`back/apis/`)
- **Auth** (`apis/auth/`): Login (argon2), validación de sesión, cierre de sesión
  - Endpoints: `POST /api/auth/login`, `GET /api/auth/validate_login`, `GET /api/auth/close_session`
- **Base** (`apis/base/`): Health check (`/api/base/hh`), modos prod/dev (`/api/base/get_modes`)
- **Catalog** (`apis/catalog/`): CRUD juegos, categorías, imágenes; favoritos y calificaciones
  - Endpoints juegos: `GET/POST/PUT/DELETE /api/catalog/juegos`, `GET /api/catalog/juego`
  - Endpoints categorías: `GET/POST/PUT/DELETE /api/catalog/categorias`
  - Endpoints imágenes: `POST/DELETE /api/catalog/imagenes`, `POST /api/catalog/upload_image/{juego_id}`
  - Endpoint favoritos: `POST /api/catalog/favoritos`
  - Endpoint calificaciones: `POST /api/catalog/calificacion`
  - Operaciones de escritura requieren admin (username `test`) excepto calificaciones y favoritos
- **Games/RushCar** (`apis/games/rush_car/`): Puzzle deslizante con niveles precargados
  - Endpoints: `GET /api/games/rush_car/get_level`, `POST /api/games/rush_car/save_record`
  - Rankings: `GET /api/games/rush_car/get_records`, `get_user_records`, `get_top_players`, `get_trending`
- **Games/Adivina** (`apis/games/adivina/`): Juego multijugador "Adivina el Personaje" vía WebSocket
  - Endpoints REST: tags, tarjetas, decks, salas (`/api/games/adivina/*`)
  - WebSocket: `/api/games/adivina/ws/{codigo}` — salas privadas, chat, voz (WebRTC), turnos, votación
  - Estados: esperando → votando → jugando → terminado
- **Sockets** (`apis/sockets/`): WebSocket chat con LLM local (Ollama, modelo `ds8`)
- **GetMedia** (`apis/get_media/`): Sirve `back/media/` (imágenes de juegos, dist de React)

### Frontend (`front/src/Pages/`)
- **Library**: Catálogo de juegos con hero featured, búsqueda, filtro por categoría, grid de GameCards, favoritos. Redirige a GameDetail.
- **GameDetail**: Resumen del juego, descripción, sistema de calificación (1-10 estrellas), comentarios y botón JUGAR.
- **Solo/RushCar**: Tablero deslizante (Board), estadísticas (GameStats), controles (GameControls), paneles Top, modales (WinOverlay, ShareModal, UserRecordsModal)
- **CatalogAdmin**: Panel admin para CRUD del catálogo (solo usuario `test`)
- **Chat**: Chat con LLM vía WebSocket en streaming
- **Adivina**: Lobby, catálogo de tarjetas, decks y sala de juego multijugador en tiempo real

## Base de datos
- Los cambios a la BD se deben registrar en `back/tables/`
- Los cambios deben ir al final del archivo despues de un comentario `-- ------ cambios de <funcion> -----`
- Tablas principales: `usuarios`, `sessiones`, `juegos`, `juegos_calificaciones`, `categorias`, `juegos_categorias`, `juegos_imagenes`, `usuarios_favoritos`, `rush_hour_levels`, `rush_hour_jugadas`
- Tablas de Adivina (en `back/tables/adivina.sql`): `adivina_tags`, `adivina_tarjetas`, `adivina_tarjetas_tags`, `adivina_decks`, `adivina_decks_tarjetas`, `adivina_salas`, `adivina_salas_jugadores`, `adivina_partidas`
- IDs: UUID v4 (`uuid_generate_v4()`)
- Cargar niveles Rush Car: `python back/scripts/cargar_niveles.py` (lee `back/media/txt/rush.txt`)

## Build y entorno
- Entorno Conda/venv: `games`
- Build front: `cd front && pnpm run build`
- Migrar build: `python migrate_view.py`
- Backend local: `uvicorn main:app --host 0.0.0.0 --port 8372 --reload` (desde `back/`)
- Docker: `docker-compose up` en `back/`

## Prueba Context
- Para validar que estás cargando esta parte, si solo mando un mensaje que diga "Ping" tú contestarás con un mensaje que diga "Pan con papas a la francesa"

## Pruebas App
- El front está corriendo en 5173, corre el back en 8372
- Usuario prueba: `test` | Contraseña prueba: `test`
