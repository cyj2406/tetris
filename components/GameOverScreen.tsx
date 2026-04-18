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
      // 기록 저장 (WIN 또는 GAME_OVER)
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
          const errStatus = saveRes.status;
          const errText = await saveRes.text();
          throw new Error(`서버 응답 오류 (${errStatus}): ${errText}`);
        }

        const saveResult = await saveRes.json();
        console.log('[SaveScore] Response:', saveResult);

        if (saveResult.success) {
          setDebugMsg('저장 성공! 랭킹 업데이트 중...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          throw new Error(saveResult.error || '알 수 없는 저장 실패');
        }
      }

      // 랭킹 조회
      console.log('[GetRankings] Fetching latest rankings...');
      const res = await fetch('/api/get-rankings');
      
      if (!res.ok) {
        throw new Error(`랭킹 데이터 조회 실패 (${res.status})`);
      }

      const data = await res.json();
      console.log('[GetRankings] Raw data:', data);
      
      let rawRankings = Array.isArray(data) ? data : (data.rankings || []);
      
      const normalizedRankings = rawRankings.map((item: any, idx: number) => {
        // 데이터가 없는 행 방지
        if (!item) return null;

        // 필드 파싱 함수
        const isDate = (s: any) => {
          const str = String(s).trim();
          return str.includes('T') || str.includes('Z') || /^\d{4}[\.-]/.test(str);
        };

        const isTime = (s: any) => {
          const str = String(s).trim();
          if (isDate(str) || !str.includes(':')) return false;
          return /^(\d{1,2}:)?\d{1,2}:\d{2}$/.test(str) || str.includes('1899');
        };

        let name = 'Unknown';
        let timeStr = '';

        // 1. 이름 찾기 (JSON 키 또는 인덱스 1)
        const nameCandidates = [item.playerName, item.name, item.Name, item.이름, item[1]];
        for (const cand of nameCandidates) {
          if (cand !== undefined && cand !== null && !isDate(cand) && !isTime(cand)) {
            name = String(cand).trim();
            break;
          }
        }

        // 2. 시간 찾기 (JSON 키 또는 인덱스 2)
        const timeCandidates = [item.finishtime, item.time, item.Time, item.기록, item[2]];
        for (const cand of timeCandidates) {
          if (cand !== undefined && cand !== null && isTime(cand)) {
            timeStr = String(cand).trim();
            break;
          }
        }

        // 3. 전체 순회 (Fallback - 날짜 컬럼은 제외)
        if (name === 'Unknown' || !timeStr) {
          Object.entries(item).forEach(([k, v]) => {
            if (!v || ['date', 'timestamp'].includes(k.toLowerCase()) || k === '0') return;
            if (name === 'Unknown' && !isDate(v) && !isTime(v)) name = String(v);
            if (!timeStr && isTime(v)) timeStr = String(v);
          });
        }

        // 시간 파싱
        let totalSeconds = 999999;
        if (timeStr) {
          const clean = timeStr.includes(' ') ? timeStr.split(' ').pop() || '' : timeStr;
          const parts = clean.split(':').map(Number);
          if (parts.length === 3) {
            // H:M:S -> 시각(H)이 10 이상이면 시각 오류로 판단하고 분:초만 취함
            if (parts[0] > 0 && parts[0] < 5) totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
            else totalSeconds = parts[1] * 60 + parts[2];
          } else if (parts.length === 2) {
            totalSeconds = parts[0] * 60 + parts[1];
          }
        }

        console.debug(`[Row #${idx}] Raw:`, item, `Mapped:`, { name, timeStr, totalSeconds });

        return {
          name: name.substring(0, 15),
          formattedTime: formatTime(totalSeconds),
          timeSeconds: totalSeconds
        } as Ranking;
      })
      .filter((r: any) => r !== null && r.name !== 'Unknown' && r.timeSeconds < 36000)
      .sort((a: Ranking, b: Ranking) => a.timeSeconds - b.timeSeconds)
      .slice(0, 3);

      console.log('[Ranking] Final Display List:', normalizedRankings);
      setRankings(normalizedRankings);
      setDebugMsg('연동 완료');
    } catch (err: any) {
      console.error('[GameOver] Error process:', err);
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
