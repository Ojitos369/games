import { localStates, localEffects } from './localStates';
import { TopBar } from './Components/TopBar';
import { Tabs } from './Components/Tabs';
import { ScopeStrip } from './Components/ScopeStrip';
import { DecksList } from './Components/DecksList';
import { DeckFormModal } from './Components/DeckFormModal';
import { PreviewModal } from './Components/PreviewModal';

export const Decks = () => {
    const { style } = localStates();
    localEffects();

    return (
        <div className={`${style.decksPage}`}>
            <TopBar />
            <Tabs />
            <ScopeStrip />
            <main className={`${style.contentArea}`}>
                <DecksList />
            </main>
            <DeckFormModal />
            <PreviewModal />
        </div>
    );
};
