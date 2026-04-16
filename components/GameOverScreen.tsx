
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
        
        const res = await fetch('/api/get-rankings');
        const data = await res.json();
        
        let rawRankings = Array.isArray(data) ? data : (data.rankings || []);
        
        // 데이터 정형화 (Normalization)
        const normalizedRankings = rawRankings.map((item: any) => {
          // 1. 이름 찾기
          // 우선권: 'playerName', 'Name', '이름', 'name', 'userName' ...
          let foundName = item.playerName || item.Name || item['이름'] || item.name || item.userName || '';
          
          // 2. 시간 찾기
          // 우선권: 'formattedTime', 'finishtime', 'FinishTime', '기록', 'time', 'Time' ...
          let foundTime = item.formattedTime || item.finishtime || item.FinishTime || item['기록'] || item.time || item.Time || item['완료시간'];

          // 3. 만약 필드명으로 못 찾았다면, 숫자 인덱스(배열 형태의 객체) 가능성 확인
          if (!foundName && item[1]) foundName = item[1];
          if (!foundTime && item[2]) foundTime = item[2];

          // 4. 날짜/이름 뒤바뀜 방지 로직 (screenshot 이슈 대응)
          // 만약 찾은 이름이 날짜 ISO 형식인 경우, 다른 필드에서 이름을 가져옴
          const isDateStr = (s: any) => typeof s === 'string' && (s.includes('T') && s.includes('Z') || /^\d{4}-\d{2}-\d{2}/.test(s));
          
          if (isDateStr(foundName)) {
            // 다른 필드 중 날짜가 아닌 문자열 찾기 (주로 'Name'이나 'playerName' 또는 인덱스 1)
            const backup = item.playerName || item.Name || item['이름'] || item[1];
            if (backup && !isDateStr(backup)) {
              foundName = backup;
            } else {
              // 최후의 수단: 모든 필드를 뒤져서 날짜가 아닌 문자열 중 가장 이름 같은 것 찾기
              const fields = Object.entries(item).find(([k, v]) => 
                k !== 'name' && k !== 'date' && k !== '0' && 
                typeof v === 'string' && v.length > 0 && !isDateStr(v)
              );
              if (fields) foundName = fields[1];
            }
          }

          // 5. 시간 데이터 정제 (긴 날짜 문자열 등 처리)
          if (foundTime && typeof foundTime === 'string' && foundTime.includes('1899')) {
            // "00:13:00" 같은 부분만 추출 시도
            const timeMatch = foundTime.match(/(\d{1,2}:\d{2}:\d{2})|(\d{1,2}:\d{2})/);
            if (timeMatch) {
              const extracted = timeMatch[0];
              // 만약 00:13:00 이면 0:13 혹은 13:00 등으로 보정 (앞의 00: 제거)
              const parts = extracted.split(':');
              if (parts.length === 3 && parts[0] === '00') {
                foundTime = `${parseInt(parts[1])}:${parts[2]}`;
              } else if (parts.length === 3 && parts[0] !== '00') {
                foundTime = `${parseInt(parts[0]) * 60 + parseInt(parts[1])}:${parts[2]}`;
              } else {
                foundTime = extracted;
              }
            }
          }

          // 6. 시간 데이터가 여전히 비어있거나 불완전하다면
          if (!foundTime && item.timeSeconds) foundTime = formatTime(item.timeSeconds);
          if (!foundTime) foundTime = '0:00';

          return {
            ...item,
            name: foundName || 'Unknown',
            formattedTime: foundTime
          };
        });

        if (normalizedRankings.length > 0) {
          setRankings(normalizedRankings);
          setDebugMsg('연동 완료');
        } else {
          setDebugMsg('저장 성공했으나 랭킹 목록이 비어있음');
        }
      } else {
        setDebugMsg('저장 실패: ' + (saveResult.error || '통신 오류'));
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
                        <td className="py-2 px-4 text-right">{r.formattedTime || formatTime(r.timeSeconds)}</td>
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
