import { useMemo, useEffect } from "react";
import { useStates, createState } from "../../Hooks/useStates";
import style from './styles/index.module.scss';

import { MenuBarDefault } from "../../Pages/Index/MenuBarDefault";
import { MenuBar1 as MenuBar1SLRC } from "../../Pages/Solo/RushCar/MenuBar1";

export const localStates = () => {
    const { s } = useStates();
    // const menubarOpen = useMemo(() => s.menubar?.open, [s.menubar?.open]);
    const [menubarOpen, setMenuBarOpen] = createState(['menubar', 'open'], false);
    const menuMode = useMemo(() => s.menubar?.menuMode, [s.menubar?.menuMode]);
    const isInMd = useMemo(() => s.app?.general?.isInMd, [s.app?.general?.isInMd]);

    const Component = useMemo(() => {
        switch (menuMode) {
            case 'menuBarDefault':
                return MenuBarDefault;
            case 'menuBar1SLRC':
                return MenuBar1SLRC;
            default:
                return null;
        }
    }, [menuMode]);

    return {
        style, Component,
        menubarOpen, setMenuBarOpen,
        isInMd
    }
}

export const localEffects = () => {
    const { Component, setMenuBarOpen, isInMd } = localStates();

    useEffect(() => {
        if (!Component) {
            setMenuBarOpen(false);
        } else if (!isInMd) {
            setMenuBarOpen(false);
        }
    }, [Component, isInMd]);
}