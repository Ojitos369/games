
import { useEffect } from 'react';
import { createState } from '../../../Hooks/useStates';
import styles from './styles/index.module.scss';
import stylesGen from '../styles/index.module.scss';


export const localStates = props => {
    const [titulo, setTitulo] = createState(['page', 'title'], "");
    const [actualPage, setActualPage] = createState(['page', 'actual'], "");
    const init = () => {
        const title = "Acciones Celestian";
        setTitulo(title);
        setActualPage("acciones_celestian");
        document.title = title;
    }


    return {
        styles, stylesGen,
        init,
    }
}

export const localEffects = () => {
    const { init } = localStates();

    useEffect(() => {
        init();
    }, []);

}