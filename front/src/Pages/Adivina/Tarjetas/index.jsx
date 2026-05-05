import { localStates, localEffects } from './localStates';
import { TopBar } from './Components/TopBar';
import { ScopeTabs } from './Components/ScopeTabs';
import { TopTagStrip } from './Components/TopTagStrip';
import { ActiveChips } from './Components/ActiveChips';
import { TarjetasGrid } from './Components/TarjetasGrid';
import { TarjetaFormModal } from './Components/TarjetaFormModal';
import { PreviewModal } from './Components/PreviewModal';

export const Tarjetas = () => {
    const { style } = localStates();
    localEffects();

    return (
        <div className={`${style.tarjetasPage}`}>
            <TopBar />
            <ScopeTabs />
            <TopTagStrip />
            <main className={`${style.contentArea}`}>
                <ActiveChips />
                <TarjetasGrid />
            </main>
            <TarjetaFormModal />
            <PreviewModal />
        </div>
    );
};
