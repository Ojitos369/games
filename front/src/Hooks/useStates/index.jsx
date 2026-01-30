import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useBase as useF } from "./apps/base";
import { useLf } from "./localFunctions";

const useStates = props => {
    const ls = useSelector(state => state.fs.ls);
    const s = useSelector(state => state.fs.s);
    const f = useF();
    const lf = useLf();

    return { ls, s, f, lf };
}

const createState = (elements, init) => {
    const { s, f } = useStates();
    let state = `s.` + elements.join('?.');
    const ele = useMemo(() => eval(state) ?? init, [eval(state)]);
    const updater = value => {
        value = JSON.stringify(value);
        let update = `f.u${elements.length - 1}('${elements.join("','")}',${value});`;
        eval(update);
    }
    return [ele, updater]
}

export { useStates, createState };