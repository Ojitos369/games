---
trigger: always_on
---

## Backend  
- Los cambios que se hagan a la base de datos se deben ir registrando en `back/tables`.
- El entorno es con conda `games`


## Frontend
- Los componentes deben ir modularizados en pequeños componentes que los componen.
- Cada componente debe jalar las variables que ocupa del LocalState correspondente.
- Agregar en lo posible funciones para MenuBar.
- Utilizar grid con minmax para el responsive de ser posible.
- Para colores y medidas utilizar variables en `front/src/static/css/vars.css`.
- En caso de utilizar media querys utilizar `front/src/static/css/response.scss`.
- Utilizar container query en lugar de media query de ser posible si se llega a utilizar los responsives.
- Hacer los estilos responsivos.
- Las clases de los componentes deben tener la siguiente forma className={`${style.nombreClase} clasesExtra`} para poder utilizar clases del componente y clases generales.


## Migraciones de front
- El front se comipla, una vez compilado se ejecuta migrate_view.py para migrar el front como vista del back


## Prueba Context
- Para validar que estas cargando esta parte, si solo mando un mensaje que diga "Ping" tu contestaras con un mensaje que diga "Pan con papas a la francesa"


## Pruebas App
- El front esta corriendo en 5173, corre el back en 8369
- Usuario prueba: test
- Contraseña prueba: test