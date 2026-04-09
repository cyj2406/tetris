
'use client';

import React from 'react';

interface SidePanelProps {
  nextPiece: any;
  score: number;
  linesCleared: number;
  highScore: number;
  timer: number;
  onPause: () => void;
  onQuit?: () => void;
  onReset: () => void;
  status: string;
}

export default function SidePanel({
  nextPiece,
  score,
  linesCleared,
  highScore,
  timer,
  onPause,
  onReset,
  status,
}: SidePanelProps) {
  const formatValue = (val: number) => (val || 0).toString().padStart(4, '0');
  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // nextPiece가 정의되지 않았을 경우를 대비한 방어 코드
  if (!nextPiece || !nextPiece.shape || !nextPiece.shape[0]) {
    return (
      <div className="side-panel flex-shrink-0 flex items-center justify-center">
        <div className="text-white animate-pulse">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="side-panel flex-shrink-0">
      {/* NEXT section */}
      <div>
        <h2 className="label text-[12px] opacity-70">Next</h2>
        <div className="next-box">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${nextPiece.shape[0].length}, 25px)`,
              gap: '0px',
            }}
          >
            {nextPiece.shape.map((row: number[], y: number) =>
              row.map((active: number, x: number) => (
                <div
                  key={`${y}-${x}`}
                  className={active ? 'filled-cell' : ''}
                  style={{
                    width: '25px',
                    height: '25px',
                    backgroundColor: active ? nextPiece.color : 'transparent',
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* TIME section (새로 추가) */}
      <div>
        <h2 className="label text-[12px] opacity-70">Time</h2>
        <div className="stat-value text-xl font-mono">{formatTime(timer)}</div>
      </div>

      {/* LINES section */}
      <div>
        <h2 className="label text-[12px] opacity-70">Lines</h2>
        <div className="stat-value font-mono">{formatValue(linesCleared)}</div>
      </div>

      {/* MOST LINES section */}
      <div>
        <h2 className="label text-[12px] opacity-70">Most<br />Lines</h2>
        <div className="stat-value font-mono">{formatValue(highScore)}</div>
      </div>

      {/* BOTTOM buttons */}
      <div className="mt-auto flex flex-col gap-4">
        <button
          onClick={onPause}
          className="retro-button"
        >
          {status === 'PAUSED' ? 'RESUME' : 'PAUSE'}
        </button>
        <button
          onClick={onReset}
          className="retro-button"
        >
          다시 시작
        </button>
      </div>
    </div>
  );
}
