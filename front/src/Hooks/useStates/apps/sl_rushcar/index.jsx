import { levels as levelsMod } from './levels';
import { records as recordsMod } from './records';

export const sl_rushcar = props => {
    const records = recordsMod(props);
    const levels = levelsMod({ ...props, records });
    return { levels, records };
};
