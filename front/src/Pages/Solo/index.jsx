import { Route, Routes } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { useStates, createState } from '../../Hooks/useStates';
import { P404 } from '../P404';
import { P401 } from '../P401';
import { RushCar as RushCarPage } from './RushCar';

export const Solo = () => {
    const { s } = useStates();
    const permisoPagina = useMemo(() => s.page?.permiso ?? true, [s.page?.permiso]);
    const [actualMenu, setActualMenu] = createState(['page', 'actualMenu'], '');

    useEffect(() => {
        setActualMenu('Solo');
    }, []);

    if (!permisoPagina) return <P401 />

    return (
        <Routes>
            <Route path="rushcar" element={ <RushCarPage /> } />
            <Route path="*" element={ <P404 /> } />
        </Routes>
    )
}