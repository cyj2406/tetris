
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StartScreen() {
  const [mounted, setMounted] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const savedName = localStorage.getItem('tetris_player_name');
    if (savedName) setPlayerName(savedName);
  }, []);

  const handleStart = () => {
    if (playerName.trim()) {
      localStorage.setItem('tetris_player_name', playerName.trim());
      // For potential backward compatibility with other components
      localStorage.setItem('tetris_student_name', playerName.trim());
      router.push('/game');
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#1a1a1a] w-full">
      <div className="flex flex-col items-center justify-between min-h-[85vh] w-full max-w-[500px]">
        {/* Top spacer for vertical centering of the main card */}
        <div className="flex-1"></div>
        
        {/* Main Start Card */}
        <div className="retro-container flex-col p-3 w-full animate-in fade-in zoom-in duration-500">
          <div className="bg-black p-10 border border-[#444] rounded flex flex-col items-center gap-12 w-full">
            <h1 className="text-6xl font-bold tracking-[0.2em] text-white text-center">
              TETRIS
            </h1>
            
            <div className="w-full space-y-6">
              <div className="flex flex-col gap-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">
                  사용자 이름
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="이름을 입력하세요"
                  className="w-full bg-transparent border-b border-[#333] text-xl text-white text-center focus:border-white focus:outline-none py-3 transition-all"
                  onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                  autoFocus
                />
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={!playerName.trim()}
              className={`retro-button py-5 text-2xl ${
                !playerName.trim() 
                  ? 'opacity-30 border-slate-700 text-slate-700 cursor-not-allowed' 
                  : 'hover:bg-white hover:text-black hover:border-white'
              }`}
            >
              게임 시작
            </button>
          </div>
        </div>

        {/* Footer Info aligned to the bottom */}
        <div className="flex-1 flex items-end pb-12">
          <p className="text-slate-500 font-bold tracking-widest text-lg opacity-90 font-mono">
            AI코딩 202301910 최유정
          </p>
        </div>
      </div>
    </div>
  );
}
