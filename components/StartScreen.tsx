
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StartScreen() {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [dept, setDept] = useState('');
  const [studentName, setStudentName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const savedName = localStorage.getItem('tetris_player_name');
    const savedSubject = localStorage.getItem('tetris_subject') || 'AI 코딩';
    const savedDept = localStorage.getItem('tetris_dept') || '컴퓨터공학과';
    const savedStudentName = localStorage.getItem('tetris_student_name') || '';

    if (savedName) setName(savedName || '');
    setSubject(savedSubject);
    setDept(savedDept);
    setStudentName(savedStudentName);
  }, []);

  const handleStart = () => {
    if (name.trim() && subject.trim() && dept.trim() && studentName.trim()) {
      localStorage.setItem('tetris_player_name', name);
      localStorage.setItem('tetris_subject', subject);
      localStorage.setItem('tetris_dept', dept);
      localStorage.setItem('tetris_student_name', studentName);
      router.push('/game');
    }
  };

  const isFormValid = name.trim() !== '' && subject.trim() !== '' && dept.trim() !== '' && studentName.trim() !== '';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#1a1a1a]">
      <div className="retro-container flex-col p-4 w-full max-w-[450px] animate-in fade-in zoom-in duration-500">
        <div className="bg-black p-8 border border-[#444] rounded flex flex-col items-center gap-8 w-full">
          <h1 className="text-5xl font-bold tracking-[0.2em] text-white text-center mb-4">
            TETRIS
          </h1>
          
          <div className="w-full space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Player Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ENTER PLAYER NAME..."
              className="w-full px-4 py-3 bg-[#111] border-2 border-[#333] rounded focus:border-white focus:outline-none transition-all text-white font-mono uppercase tracking-widest text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            />
          </div>

          <div className="w-full space-y-4 pt-6 border-t border-[#333]">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center mb-2">Student Information</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap w-16">과목명:</span>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="flex-1 bg-transparent border-b border-[#333] text-sm text-white focus:border-white focus:outline-none py-1"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap w-16">학과:</span>
                <input
                  type="text"
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  className="flex-1 bg-transparent border-b border-[#333] text-sm text-white focus:border-white focus:outline-none py-1"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap w-16">이름:</span>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="본인 이름을 입력하세요"
                  className="flex-1 bg-transparent border-b border-[#333] text-sm text-white focus:border-white focus:outline-none py-1"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={!isFormValid}
            className={`retro-button py-4 text-xl mt-4 ${!isFormValid ? 'opacity-30 border-slate-700 text-slate-700 cursor-not-allowed' : ''}`}
          >
            START GAME
          </button>
        </div>
      </div>
    </div>
  );
}
