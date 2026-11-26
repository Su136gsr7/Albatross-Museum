import React, { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { WelcomeScreen } from './components/WelcomeScreen/WelcomeScreen';
import { CharacterIntroduction } from './components/CharacterPreview/CharacterIntroduction';
import { MuseumScene } from './components/Museum/MuseumScene';

export function App() {
  const stage = useGameStore((s) => s.stage);
  const isHydrated = useGameStore((s) => s.isHydrated);
  const hydrate = useGameStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!isHydrated) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#140f0c] text-[#f5efe6]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#d4af6a]/30 border-t-[#d4af6a]" />
        <p className="mt-4 font-serif text-xl tracking-widest text-[#d4af6a]">
          Preparing Our Little Universe...
        </p>
      </div>
    );
  }

  if (stage === 'WELCOME') return <WelcomeScreen />;
  if (stage === 'CHARACTER_INTRO' || stage === 'CHARACTER_SELECT') return <CharacterIntroduction />;
  return <MuseumScene />;
}

export default App;
