import { useEffect, useCallback } from 'react';
import style from './styles/index.module.scss';
import { createState } from '../../Hooks/useStates';

export const localStates = () => {
    const [, setTitulo] = createState(['page', 'title'], '');
    const [, setActualPage] = createState(['page', 'actual'], '');

    const init = useCallback(() => {
        const title = 'Adivinanza';
        setTitulo(title);
        setActualPage('adivina');
        document.title = title;
    }, []);

    return {
        style, init,
    }
}

export const localEffects = () => {
    const { init } = localStates();
    useEffect(() => { init(); }, []);
};
