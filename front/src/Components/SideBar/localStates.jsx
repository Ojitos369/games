import { useMemo } from "react";
import { useStates, createState } from "../../Hooks/useStates";
import style from './styles/index.module.scss';
import { useEffect } from "react";

export const localStates = () => {
    const { f, s } = useStates();

    const actualPage = useMemo(() => s.page?.actual || '', [s.page?.actual]);
    const actualMenu = useMemo(() => s.page?.actualMenu || '', [s.page?.actualMenu]);
    const { prod_mode, dev_mode } = useMemo(() => s.app?.modes ?? {}, [s.app?.modes]);
    const isInMd = useMemo(() => s.app?.general?.isInMd, [s.app?.general?.isInMd]);
    const [sidebarOpen, setSidebarOpen] = createState(['sidebar', 'open'], false);
    const [menusAbiertos, setMenusAbiertos] = createState(['sidebar', 'menusAbiertos'], {});

    const elementos = useMemo(() => {
        return [
            {name: 'Index', menu_name: 'index', opened: menusAbiertos['index'], elements: [
                // cargar, asignar
                {name: 'Index', page_name: 'index', to: '/'},
            ]},
            {name: 'Chat', menu_name: 'chat', opened: menusAbiertos['chat'], elements: [
                // cargar, asignar
                {name: 'Chat', page_name: 'chat', to: '/chat/chat'},
            ]},
            {name: 'Test', menu_name: 'test', opened: menusAbiertos['test'], elements: [
                // cargar, asignar
                {name: 'Test', page_name: 'test', to: '/test/test'},
            ]},
        ]
    }, [menusAbiertos]);

    const toggleMenu = menu => {
        setMenusAbiertos({ [menu]: !menusAbiertos[menu] });
    }

    return {
        style,
        prod_mode, dev_mode, isInMd,
        actualPage,
        toggleMenu, 
        sidebarOpen, setSidebarOpen,
        setMenusAbiertos,
        elementos, actualMenu, 
    }
}

export const localEffects = () => {
    const { actualMenu, setMenusAbiertos } = localStates();

    useEffect(() => {
        setMenusAbiertos({ [actualMenu]: true });
    }, [actualMenu]);
}