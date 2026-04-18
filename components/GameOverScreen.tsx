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
  const [isSaving, setIsSaving] = useState(false);
  const [debugMsg, setDebugMsg] = useState('시스템 준비 중...');
  const hasSaved = useRef(false);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveAndFetch = async () => {
    const studentName = localStorage.getItem('tetris_student_name');
    const playerNick = localStorage.getItem('tetris_player_name');
    const actualName = studentName || playerNick || playerName || 'Unknown';
    
    const mins = Math.floor(timer / 60);
    const secs = timer % 60;
    const formattedFinishedTime = `${mins}:${secs.toString().padStart(2, '0')}`;

    try {
      // 1. 결과 저장
      if (status === 'WIN' || status === 'GAME_OVER') {
        setIsSaving(true);
        setDebugMsg('데이터 시트로 전송 중...');
        console.log('[SaveScore] Initiating save...', { name: actualName, time: formattedFinishedTime, status });
        
        const saveRes = await fetch('/api/save-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: actualName + (status === 'GAME_OVER' ? ' (F)' : ''),
            finishtime: formattedFinishedTime
          }),
        });
        
        if (!saveRes.ok) {
          throw new Error(`저장 실패 (${saveRes.status})`);
        }

        const saveResult = await saveRes.json();
        if (saveResult.success) {
          setDebugMsg('저장 성공! 랭킹 업데이트 중...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          throw new Error(saveResult.error || '저장 처리 실패');
        }
      }

      // 2. 랭킹 조회
      console.log('[GetRankings] Fetching latest rankings...');
      const res = await fetch('/api/get-rankings');
      
      if (!res.ok) {
        throw new Error(`랭킹 데이터 조회 실패 (${res.status})`);
      }

      const data = await res.json();
      console.log('[GetRankings] Raw data received:', data);
      
      let rawRankings = Array.isArray(data) ? data : (data.rankings || []);
      
      // 3. 데이터 정형화 및 TOP 3 필터링
      const normalizedRankings = rawRankings.map((item: any, idx: number) => {
        const rName = item.name || 'Unknown';
        const rTimeStr = String(item.time || '0:00');
        
        let totalSeconds = 999999;
        
        // 시간 패턴 추출 (HH:MM:SS 또는 MM:SS)
        // 예: "Sat Dec 30 1899 00:16:00 GMT+..." -> "00:16:00" 추출
        const timeMatch = rTimeStr.match(/(\d{1,2}:\d{2}:\d{2})|(\d{1,2}:\d{2})/);
        const cleanTime = timeMatch ? timeMatch[0] : rTimeStr;
        
        const parts = cleanTime.split(':').map(Number);
        
        if (parts.length === 3) {
          // H:M:S -> 테트리스는 보통 분:초이거나 초 단위이므로 가공이 대다수임
          // 만약 00:16:00 형식으로 왔다면, 사용자의 의도는 16초일 확률이 높으나 
          // 일단 데이터대로 16분(960초)으로 처리하거나 상황에 맞게 조정
          if (parts[0] === 0 && parts[1] > 0) {
            // 00:MM:SS -> MM분 SS초
            totalSeconds = parts[1] * 60 + parts[2];
          } else if (parts[0] > 0 && parts[0] < 5) {
            totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
          } else {
            // 시각 데이터인 경우(오전 11시 등) 마지막 두 파트만 사용
            totalSeconds = parts[parts.length - 2] * 60 + parts[parts.length - 1];
          }
        } else if (parts.length === 2) {
          totalSeconds = parts[0] * 60 + parts[1];
        }

        const result = {
          name: rName.substring(0, 15),
          formattedTime: formatTime(totalSeconds),
          timeSeconds: totalSeconds
        } as Ranking;

        console.debug(`[Ranking #${idx}]`, { item, rName, rTimeStr, cleanTime, totalSeconds });
        return result;
      })
      .filter((r: Ranking) => r.name !== 'Unknown' && r.timeSeconds < 3600) // 1시간 미만 기록만
      .sort((a: Ranking, b: Ranking) => a.timeSeconds - b.timeSeconds) // 짧은 순 정렬
      .slice(0, 3); // TOP 3만

      console.log('[Ranking] Final Display List:', normalizedRankings);
      setRankings(normalizedRankings);
      setDebugMsg('연동 완료');
    } catch (err: any) {
      console.error('[GameOver] Error:', err);
      setDebugMsg('오류: ' + err.message);
    } finally {
      setIsSaving(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasSaved.current) return;
    hasSaved.current = true;
    handleSaveAndFetch();
  }, [playerName, timer]);

  return (
    <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 backdrop-blur-md text-white">
      <div className="retro-container flex-col p-4 w-full max-w-[500px] animate-in fade-in zoom-in duration-300">
        <div className="bg-black p-8 border border-[#444] rounded flex flex-col items-center gap-6 w-full text-white">
          
          <h2 className={`text-4xl font-bold tracking-tighter ${status === 'WIN' ? 'text-cyan-400' : 'text-red-500'} uppercase`}>
            {status === 'WIN' ? 'COMPLETED!' : 'GAME OVER'}
          </h2>

          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="bg-[#111] p-4 border border-[#333] rounded text-center text-white">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Time Result</div>
              <div className="text-2xl font-bold font-mono text-cyan-400">{formatTime(timer)}</div>
            </div>
            <div className="bg-[#111] p-4 border border-[#333] rounded text-center text-white">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Status</div>
              <div className="text-2xl font-bold font-mono">{status === 'WIN' ? 'SUCCESS' : 'FINISH'}</div>
            </div>
          </div>

          <div className="w-full space-y-3">
            <h3 className="text-xs font-bold text-center text-slate-400 uppercase tracking-[0.2em] mb-2">TOP 3 RANKING (BY TIME)</h3>
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
                    <tr><td colSpan={3} className="py-6 text-center text-xs italic text-slate-600 font-normal">Loading...</td></tr>
                  ) : rankings.length > 0 ? (
                    rankings.map((r, i) => (
                      <tr key={i} className="border-b border-[#111] last:border-0 hover:bg-white/5">
                        <td className="py-2 px-4 text-cyan-500">#{i + 1}</td>
                        <td className="py-2 px-4 truncate max-w-[150px]">{r.name}</td>
                        <td className="py-2 px-4 text-right">{r.formattedTime}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={3} className="py-6 text-center text-xs text-slate-600 font-normal">No records found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col w-full gap-2">
            {!isSaving && (debugMsg.includes('오류') || debugMsg.includes('실패')) && (
              <button 
                onClick={handleSaveAndFetch}
                className="text-[10px] text-red-400 underline hover:text-red-300 transition-colors uppercase tracking-widest mb-1"
              >
                Retry Manual Save
              </button>
            )}
            <button
              onClick={onRestart}
              className={`retro-button py-4 text-xl bg-white text-black font-bold uppercase transition-all hover:bg-slate-200`}
            >
              PLAY AGAIN
            </button>
            <p className="text-[9px] text-slate-600 text-center uppercase tracking-widest">{debugMsg}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
