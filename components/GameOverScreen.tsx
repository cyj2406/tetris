
'use client';

import React, { useEffect, useState, useRef } from 'react';

interface Ranking {
  name: string;
  timeSeconds: number;
  formattedTime: string;
}

interface GameOverScreenProps {
  status: 'GAME_OVER' | 'WIN';
  score: number;
  timer: number;
  linesCleared: number;
  playerName: string;
  onRestart: () => void;
}

export default function GameOverScreen({ status, score, timer, linesCleared, playerName, onRestart }: GameOverScreenProps) {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(true);
  const hasSaved = useRef(false);

  useEffect(() => {
    if (hasSaved.current) return;
    hasSaved.current = true;

    const handleSaveAndFetch = async () => {
      // 1. 이름 결정 (localStorage 우선)
      const actualName = localStorage.getItem('tetris_player_name') || playerName || 'Unknown';
      
      // 2. 시간 포맷팅 (0:00 형식 문자열 생성)
      const mins = Math.floor(timer / 60);
      const secs = timer % 60;
      const formattedFinishedTime = `${mins}:${secs.toString().padStart(2, '0')}`;

      try {
        setIsSaving(true);
        // 3. 구글 시트로 데이터 전송 (딱 2가지 필드만 포함)
        await fetch('/api/save-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: actualName, 
            finishtime: formattedFinishedTime
          }),
        });
        setIsSaving(false);

        // 4. 랭킹 불러오기
        const res = await fetch('/api/get-rankings');
        const data = await res.json();
        if (Array.isArray(data)) {
          setRankings(data);
        }
      } catch (err) {
        console.error("Communication error:", err);
      } finally {
        setLoading(false);
        setIsSaving(false);
      }
    };

    handleSaveAndFetch();
  }, []);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 backdrop-blur-md text-white">
      <div className="retro-container flex-col p-4 w-full max-w-[500px] animate-in fade-in zoom-in duration-300">
        <div className="bg-black p-8 border border-[#444] rounded flex flex-col items-center gap-6 w-full text-white">
          
          <h2 className={`text-4xl font-bold tracking-tighter ${status === 'WIN' ? 'text-cyan-400' : 'text-red-500'} uppercase`}>
            {status === 'WIN' ? 'COMPLETED!' : 'GAME OVER'}
          </h2>

          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="bg-[#111] p-4 border border-[#333] rounded text-center text-white">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Total Time</div>
              <div className="text-2xl font-bold font-mono text-cyan-400">{formatTime(timer)}</div>
            </div>
            <div className="bg-[#111] p-4 border border-[#333] rounded text-center text-white">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Status</div>
              <div className="text-2xl font-bold font-mono">{status}</div>
            </div>
          </div>

          <div className="w-full space-y-3">
            <h3 className="text-xs font-bold text-center text-slate-400 uppercase tracking-[0.2em] mb-2">Top 3 Ranking (by Time)</h3>
            <div className="bg-[#0a0a0a] border border-[#222] rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#111] border-b border-[#222]">
                  <tr className="text-[10px] text-slate-500 uppercase">
                    <th className="py-2 px-4 text-left">No</th>
                    <th className="py-2 px-4 text-left">Name</th>
                    <th className="py-2 px-4 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-sm font-bold">
                  {loading ? (
                    <tr><td colSpan={3} className="py-6 text-center text-xs italic text-slate-600 font-normal">Loading Rankings...</td></tr>
                  ) : rankings.length > 0 ? (
                    rankings.map((r, i) => (
                      <tr key={i} className="border-b border-[#111] last:border-0 hover:bg-white/5">
                        <td className="py-2 px-4 text-cyan-500">#{i + 1}</td>
                        <td className="py-2 px-4 truncate max-w-[150px]">{r.name}</td>
                        <td className="py-2 px-4 text-right">{r.formattedTime || formatTime(r.timeSeconds)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={3} className="py-6 text-center text-xs text-slate-600 font-normal">No records.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={onRestart}
            disabled={isSaving}
            className={`retro-button py-4 text-xl mt-4 bg-white text-black font-bold uppercase transition-all ${isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-200'}`}
          >
            {isSaving ? '저장 중...' : 'PLAY AGAIN'}
          </button>
        </div>
      </div>
    </div>
  );
}
