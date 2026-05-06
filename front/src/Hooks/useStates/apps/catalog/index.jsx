import { juegos as juegosMod } from './juegos';
import { categorias as categoriasMod } from './categorias';
import { imagenes as imagenesMod } from './imagenes';

export const catalog = props => {
    const juegos = juegosMod(props);
    const categorias = categoriasMod(props);
    const imagenes = imagenesMod({ ...props, juegos });
    return { juegos, categorias, imagenes };
};
