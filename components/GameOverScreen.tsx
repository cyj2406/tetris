
'use client';

import React, { useEffect, useState } from 'react';

interface Ranking {
  name: string;
  timeSeconds: number;
  score: number;
  date: string;
}

interface GameOverScreenProps {
  status: 'GAME_OVER' | 'WIN';
  score: number;
  timer: number;
  playerName: string;
  onRestart: () => void;
}

export default function GameOverScreen({ status, score, timer, playerName, onRestart }: GameOverScreenProps) {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saveDataAndFetchRankings = async () => {
      try {
        // 점수 저장 API 호출
        await fetch('/api/save-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: playerName,
            timeSeconds: timer,
            score: score,
            date: new Date().toLocaleString(),
          }),
        });

        // 랭킹 데이터 불러오기
        const res = await fetch('/api/get-rankings');
        const data = await res.json();
        if (Array.isArray(data)) {
          setRankings(data);
        }
      } catch (err) {
        console.error("Failed to process ranking:", err);
      } finally {
        setLoading(false);
      }
    };

    saveDataAndFetchRankings();
  }, [playerName, score, timer]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
      {/* 결과창 박스 - 레트로 테두리 적용 */}
      <div className="retro-container flex-col p-4 w-full max-w-[500px] animate-in fade-in zoom-in duration-300">
        <div className="bg-black p-8 border border-[#444] rounded flex flex-col items-center gap-6 w-full text-white">
          
          <h2 className={`text-4xl font-bold tracking-tighter ${status === 'WIN' ? 'text-cyan-400' : 'text-red-500'} uppercase`}>
            {status === 'WIN' ? 'COMPLETED!' : 'GAME OVER'}
          </h2>

          {/* 나의 기록 요약 */}
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="bg-[#111] p-4 border border-[#333] rounded text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Your Score</div>
              <div className="text-2xl font-bold font-mono">{score}</div>
            </div>
            <div className="bg-[#111] p-4 border border-[#333] rounded text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Time Took</div>
              <div className="text-2xl font-bold font-mono">{formatTime(timer)}</div>
            </div>
          </div>

          {/* 실시간 랭킹 표 */}
          <div className="w-full space-y-3">
            <h3 className="text-xs font-bold text-center text-slate-400 uppercase tracking-[0.2em] mb-2">Top 3 Ranking</h3>
            <div className="bg-[#0a0a0a] border border-[#222] rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#111] border-b border-[#222]">
                  <tr className="text-[10px] text-slate-500 uppercase">
                    <th className="py-2 px-4 text-left">No</th>
                    <th className="py-2 px-4 text-left">Name</th>
                    <th className="py-2 px-4 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-sm">
                  {loading ? (
                    <tr><td colSpan={3} className="py-6 text-center text-xs italic text-slate-600">Updating Rank...</td></tr>
                  ) : rankings.length > 0 ? (
                    rankings.map((r, i) => (
                      <tr key={i} className="border-b border-[#111] last:border-0 hover:bg-white/5">
                        <td className="py-2 px-4 text-cyan-500 font-bold">#{i + 1}</td>
                        <td className="py-2 px-4 truncate max-w-[150px]">{r.name}</td>
                        <td className="py-2 px-4 text-right">{formatTime(r.timeSeconds)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={3} className="py-6 text-center text-xs text-slate-600">No records yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 다시 시작 버튼 */}
          <button
            onClick={onRestart}
            className="retro-button py-4 text-xl mt-4 bg-white text-black hover:bg-slate-200 transition-colors uppercase font-bold"
          >
            PLAY AGAIN
          </button>
        </div>
      </div>
    </div>
  );
}
