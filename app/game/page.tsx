
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTetris } from '@/hooks/useTetris';
import GameBoard from '@/components/GameBoard';
import SidePanel from '@/components/SidePanel';
import GameOverScreen from '@/components/GameOverScreen';

export default function GamePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const tetris = useTetris();

  useEffect(() => {
    setMounted(true);
    const savedName = localStorage.getItem('tetris_player_name');
    if (!savedName) {
      router.push('/');
    } else {
      tetris.startGame(savedName);
    }
  }, []);

  useEffect(() => {
    if (!mounted || tetris.status !== 'PLAYING') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft': tetris.moveSide(-1); break;
        case 'ArrowRight': tetris.moveSide(1); break;
        case 'ArrowDown': tetris.moveDown(); break;
        case 'ArrowUp': tetris.rotate(); break;
        case ' ': e.preventDefault(); tetris.hardDrop(); break;
        case 'p': case 'P': tetris.togglePause(); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mounted, tetris]);

  if (!mounted) return null;

  const handleRestart = () => {
    tetris.resetToStart();
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#1a1a1a]">
      {(tetris.status === 'GAME_OVER' || tetris.status === 'WIN') && (
        <GameOverScreen
          status={tetris.status}
          score={tetris.score}
          timer={tetris.timer}
          linesCleared={tetris.linesCleared}
          playerName={tetris.playerName}
          onRestart={handleRestart}
        />
      )}

      <div className="retro-container scale-[1.1]">
        <div className="relative">
          <GameBoard board={tetris.board} activePiece={tetris.activePiece} ghostPos={tetris.ghostPos} />
          {tetris.status === 'PAUSED' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
              <div className="text-4xl font-bold tracking-widest text-white">PAUSED</div>
            </div>
          )}
        </div>

        <SidePanel
          nextPiece={tetris.nextPiece}
          score={tetris.score}
          linesCleared={tetris.linesCleared}
          highScore={tetris.highScore}
          timer={tetris.timer}
          onPause={tetris.togglePause}
          onReset={handleRestart}
          status={tetris.status}
        />
      </div>

      <div className="mt-20 text-slate-500 text-[10px] flex gap-6 tracking-widest uppercase opacity-50">
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 border border-slate-700 rounded text-xs leading-none">↑</kbd>
          <span>Rotate</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 border border-slate-700 rounded text-xs leading-none">← →</kbd>
          <span>Move</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 border border-slate-700 rounded text-xs leading-none">Space</kbd>
          <span>Drop</span>
        </div>
      </div>
    </div>
  );
}
