
import { useEffect, useCallback } from 'react';
import { createState } from '../../../Hooks/useStates';
import styles from './styles/index.module.scss';
import stylesGen from '../styles/index.module.scss';


export const localStates = props => {
    const [titulo, setTitulo] = createState(['page', 'title'], "");
    const [actualPage, setActualPage] = createState(['page', 'actual'], "");

    const init = useCallback(() => {
        const title = "test";
        setTitulo(title);
        setActualPage("test");
        document.title = title;
        console.log("index effect page");
    }, []);


    return {
        styles, stylesGen,
        init,
    }
}

export const indexEffects = () => {
    const { init } = localStates();

    useEffect(() => {
        init();
    }, []);

}