
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
  const [debugMsg, setDebugMsg] = useState('시스템 준비 중...');
  const hasSaved = useRef(false);

  const handleSaveAndFetch = async () => {
    const studentName = localStorage.getItem('tetris_student_name');
    const playerNick = localStorage.getItem('tetris_player_name');
    const actualName = studentName || playerNick || playerName || 'Unknown';
    
    const mins = Math.floor(timer / 60);
    const secs = timer % 60;
    const formattedFinishedTime = `${mins}:${secs.toString().padStart(2, '0')}`;

    try {
      // 성공(WIN) 상태일 때만 기록 저장 진행
      if (status === 'WIN') {
        setIsSaving(true);
        setDebugMsg('데이터 시트로 전송 중...');
        
        const saveRes = await fetch('/api/save-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: actualName, 
            finishtime: formattedFinishedTime
          }),
        });
        
        const saveResult = await saveRes.json();
        if (saveResult.success) {
          setDebugMsg('저장 성공! 랭킹 업데이트 중...');
          // Wait 1.5s for Sheet propagation
          await new Promise(resolve => setTimeout(resolve, 1500));
        } else {
          setDebugMsg('저장 실패: ' + (saveResult.error || '통신 오류'));
          setIsSaving(false);
          setLoading(false);
          return; // 저장 실패 시 랭킹 조회하지 않음
        }
      }

      // 랭킹 조회 (WIN인 경우 저장 후 조회, GAME_OVER인 경우 조회 생략 또는 선택)
      if (status === 'WIN') {
        const res = await fetch('/api/get-rankings');
        const data = await res.json();
        
        let rawRankings = Array.isArray(data) ? data : (data.rankings || []);
        
        // 데이터 정형화 (Normalization) 및 정제
        const normalizedRankings = rawRankings.map((item: any) => {
          const isDateStr = (s: any) => typeof s === 'string' && (s.includes('T') && s.includes('Z') || /^\d{4}-\d{2}-\d{2}/.test(s));
          const isTimeStr = (s: any) => typeof s === 'string' && (/^(\d{1,2}:)?\d{1,2}:\d{2}$/.test(s.trim()) || s.includes('1899'));

          let foundName = '';
          let foundTime = '';

          // 1. 이름 찾기 (명시적 키 우선, 날짜/시간 제외)
          const nameKeys = ['playerName', 'Name', '이름', 'userName', 'name'];
          for (const key of nameKeys) {
            const val = item[key];
            if (val && typeof val === 'string' && !isDateStr(val) && !isTimeStr(val)) {
              foundName = val;
              break;
            }
          }

          // 2. 시간 찾기 (명시적 키 우선)
          const timeKeys = ['finishtime', 'FinishTime', 'formattedTime', '기록', 'time', 'Time', '완료시간'];
          for (const key of timeKeys) {
            const val = item[key];
            if (val !== undefined && val !== null) {
              const sVal = String(val);
              if (isTimeStr(sVal)) {
                foundTime = sVal;
                break;
              }
            }
          }

          // 3. 배열/객체 순회하며 못 찾은 값 보완
          const allValues = Object.entries(item);
          if (!foundName) {
            const candidate = allValues.find(([k, v]) => 
              typeof v === 'string' && v.length > 0 && !isDateStr(v) && !isTimeStr(v) && k !== '0' && k !== 'date'
            );
            if (candidate) foundName = candidate[1] as string;
          }
          if (!foundTime) {
            const candidate = allValues.find(([k, v]) => typeof v === 'string' && isTimeStr(v));
            if (candidate) foundTime = candidate[1] as string;
          }

          // 4. 시간 데이터 정제 (1899 날짜 포함된 경우 등)
          if (foundTime && typeof foundTime === 'string' && foundTime.includes('1899')) {
            const timeMatch = foundTime.match(/(\d{1,2}:\d{2}:\d{2})|(\d{1,2}:\d{2})/);
            if (timeMatch) {
              const extracted = timeMatch[0];
              const parts = extracted.split(':');
              if (parts.length === 3 && parts[0] === '00') foundTime = `${parseInt(parts[1])}:${parts[2]}`;
              else if (parts.length === 3 && parts[0] !== '00') foundTime = `${parseInt(parts[0]) * 60 + parseInt(parts[1])}:${parts[2]}`;
              else foundTime = extracted;
            }
          }

          // 5. 숫자로 된 시간 처리 (초 단위 등)
          let timeSeconds = 999999;
          if (foundTime) {
            const parts = foundTime.split(':').map(Number);
            if (parts.length === 3) timeSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
            else if (parts.length === 2) timeSeconds = parts[0] * 60 + parts[1];
            else if (!isNaN(Number(foundTime))) timeSeconds = Number(foundTime);
          } else if (item.timeSeconds) {
            timeSeconds = item.timeSeconds;
            foundTime = formatTime(timeSeconds);
          }

          return { 
            name: foundName || 'Unknown', 
            formattedTime: (foundTime && foundTime.includes(':')) ? foundTime : formatTime(timeSeconds),
            timeSeconds: timeSeconds
          } as Ranking;
        })
        .filter((r: Ranking) => r.name !== 'Unknown' || r.formattedTime !== '0:00') // 의미 없는 데이터 제외
        .sort((a: Ranking, b: Ranking) => a.timeSeconds - b.timeSeconds) // 시간순 정렬 (적은 기록이 위)
        .slice(0, 3); // 상위 3개만

        setRankings(normalizedRankings);
        setDebugMsg('연동 완료');
      } else {
        // WIN이 아닐 경우
        setDebugMsg('게임 종료');
      }
    } catch (err: any) {
      setDebugMsg('네트워크 에러: ' + err.message);
      console.error(err);
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

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Time Result</div>
              <div className="text-2xl font-bold font-mono text-cyan-400">{formatTime(timer)}</div>
            </div>
            <div className="bg-[#111] p-4 border border-[#333] rounded text-center text-white">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Status</div>
              <div className="text-2xl font-bold font-mono">{status === 'WIN' ? 'SUCCESS' : 'FINISH'}</div>
            </div>
          </div>

          {/* 성공(WIN)인 경우에만 랭킹 테이블 표시 */}
          {status === 'WIN' && (
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
          )}

          <div className="flex flex-col w-full gap-2">
            {!isSaving && debugMsg.includes('실패') && (
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
