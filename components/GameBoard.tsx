
'use client';

import React from 'react';

interface GameBoardProps {
  board: { filled: boolean; color: string }[][];
  activePiece: any;
  ghostPos: any;
}

export default function GameBoard({ board, activePiece, ghostPos }: GameBoardProps) {
  // Safety check to prevent errors when board is not yet initialized
  if (!board || !board.length || !board[0]) {
    return <div className="tetris-board-wrapper"><div className="tetris-grid" /></div>;
  }

  return (
    <div className="tetris-board-wrapper">
      <div className="tetris-grid">
        {board.map((row, y) =>
          row.map((cell, x) => {
            let color = cell.color;
            let isGhost = false;
            let isFilled = cell.filled;

            // Check if it's the active piece
            if (activePiece) {
              const pieceY = y - activePiece.pos.y;
              const pieceX = x - activePiece.pos.x;
              if (
                pieceY >= 0 &&
                pieceY < activePiece.shape.length &&
                pieceX >= 0 &&
                pieceX < activePiece.shape[0].length &&
                activePiece.shape[pieceY][pieceX]
              ) {
                color = activePiece.color;
                isFilled = true;
              }
            }

            // Check if it's the ghost piece
            if (!isFilled && ghostPos) {
              const ghostY = y - ghostPos.y;
              const ghostX = x - ghostPos.x;
              if (
                ghostY >= 0 &&
                ghostY < activePiece.shape.length &&
                ghostX >= 0 &&
                ghostX < activePiece.shape[0].length &&
                activePiece.shape[ghostY][ghostX]
              ) {
                color = activePiece.color;
                isGhost = true;
              }
            }

            return (
              <div
                key={`${y}-${x}`}
                className={`cell ${isFilled ? 'filled-cell' : ''} ${isGhost ? 'ghost' : ''}`}
                style={{
                  backgroundColor: color || 'transparent',
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
