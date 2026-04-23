import { useMemo, useEffect } from "react";
import { useStates, createState } from "../../Hooks/useStates";
import style from './styles/index.module.scss';
import { pages } from "../../Core/helper";

export const localStates = () => {
    const { f, s } = useStates();

    const actualPage = useMemo(() => s.page?.actual || '', [s.page?.actual]);
    const actualMenu = useMemo(() => s.page?.actualMenu || '', [s.page?.actualMenu]);
    const { prod_mode, dev_mode } = useMemo(() => s.app?.modes ?? {}, [s.app?.modes]);
    const isInMd = useMemo(() => s.app?.general?.isInMd, [s.app?.general?.isInMd]);
    const [sidebarOpen, setSidebarOpen] = createState(['sidebar', 'open'], false);
    const [menusAbiertos, setMenusAbiertos] = createState(['sidebar', 'menusAbiertos'], {});
    const [menuBarMode, setMenuBarMode] = createState(['menubar', 'menuMode'], null);

    const isAdmin = useMemo(() => s.usuario?.data?.is_admin, [s.usuario?.data?.is_admin]);

    const categorias = useMemo(() => s.catalog?.categorias || [], [s.catalog?.categorias]);

    const elementos = useMemo(() => {
        return pages
            .filter(page => !page.admin_only || isAdmin)
            .map(page => {
                let p = {...page, opened: menusAbiertos[page.menu_name]};
                if (p.menu_name === 'categorias') {
                    p.elements = [
                        ...p.elements,
                        ...categorias.map(cat => ({
                            name: cat.nombre,
                            page_name: `cat_${cat.id}`,
                            to: `/?cat=${cat.id}`,
                            isCategory: true,
                            id: cat.id
                        }))
                    ];
                }
                return p;
            });
    }, [menusAbiertos, pages, isAdmin, categorias]);

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
        setMenuBarMode, 
    }
}

export const localEffects = () => {
    const { actualMenu, setMenusAbiertos } = localStates();

    useEffect(() => {
        setMenusAbiertos({ [actualMenu]: true });
    }, [actualMenu]);
}