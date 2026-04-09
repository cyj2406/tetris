
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  COLS,
  ROWS,
  TETROMINOES,
  PieceType,
  INITIAL_SPEED,
  SPEED_INCREMENT,
  LINE_POINTS,
  WIN_LINES,
} from '@/lib/constants';

type GameStatus = 'START' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'WIN';

interface Pos {
  x: number;
  y: number;
}

interface Piece {
  pos: Pos;
  type: PieceType;
  shape: number[][];
  color: string;
}

const createEmptyBoard = () =>
  Array.from({ length: ROWS }, () => Array(COLS).fill({ filled: false, color: '' }));

const getRandomPiece = (): Piece => {
  const keys = Object.keys(TETROMINOES) as PieceType[];
  const type = keys[Math.floor(Math.random() * keys.length)];
  const tetromino = TETROMINOES[type];
  return {
    pos: { x: Math.floor(COLS / 2) - Math.floor(tetromino.shape[0].length / 2), y: 0 },
    type,
    shape: tetromino.shape,
    color: tetromino.color,
  };
};

export const useTetris = () => {
  const [board, setBoard] = useState(createEmptyBoard());
  const [activePiece, setActivePiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<Piece>(getRandomPiece());
  const [status, setStatus] = useState<GameStatus>('START');
  const [score, setScore] = useState(0);
  const [linesCleared, setLinesCleared] = useState(0);
  const [level, setLevel] = useState(1);
  const [timer, setTimer] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('tetris_high_score');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    if (linesCleared > highScore) {
      setHighScore(linesCleared);
      localStorage.setItem('tetris_high_score', linesCleared.toString());
    }
  }, [linesCleared, highScore]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const dropTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer logic
  useEffect(() => {
    if (status === 'PLAYING') {
      timerRef.current = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const checkCollision = (piece: Piece, boardState = board, moveX = 0, moveY = 0, newShape?: number[][]) => {
    const shape = newShape || piece.shape;
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const newX = piece.pos.x + x + moveX;
          const newY = piece.pos.y + y + moveY;
          if (
            newX < 0 ||
            newX >= COLS ||
            newY >= ROWS ||
            (newY >= 0 && boardState[newY][newX].filled)
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const lockPiece = useCallback(() => {
    if (!activePiece) return;

    const newBoard = board.map((row) => [...row]);
    activePiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          const boardY = activePiece.pos.y + y;
          const boardX = activePiece.pos.x + x;
          if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
            newBoard[boardY][boardX] = { filled: true, color: activePiece.color };
          }
        }
      });
    });

    // Clear lines
    let linesInThisMove = 0;
    const filteredBoard = newBoard.filter((row) => {
      const isFull = row.every((cell) => cell.filled);
      if (isFull) linesInThisMove++;
      return !isFull;
    });

    while (filteredBoard.length < ROWS) {
      filteredBoard.unshift(Array(COLS).fill({ filled: false, color: '' }));
    }

    const newLinesCleared = linesCleared + linesInThisMove;
    setLinesCleared(newLinesCleared);
    setScore((s) => s + LINE_POINTS[linesInThisMove] || 0);
    setBoard(filteredBoard);

    if (newLinesCleared >= WIN_LINES) {
      setStatus('WIN');
      setActivePiece(null);
      return;
    }

    // Spawn next piece
    const nextActive = { ...nextPiece };
    if (checkCollision(nextActive, filteredBoard)) {
      setStatus('GAME_OVER');
      setActivePiece(null);
    } else {
      setActivePiece(nextActive);
      setNextPiece(getRandomPiece());
    }
  }, [activePiece, board, nextPiece, linesCleared]);

  const moveDown = useCallback(() => {
    if (status !== 'PLAYING' || !activePiece) return;
    if (!checkCollision(activePiece, board, 0, 1)) {
      setActivePiece((prev) => prev ? { ...prev, pos: { ...prev.pos, y: prev.pos.y + 1 } } : null);
    } else {
      lockPiece();
    }
  }, [status, activePiece, board, lockPiece]);

  const moveSide = (dir: number) => {
    if (status !== 'PLAYING' || !activePiece) return;
    if (!checkCollision(activePiece, board, dir, 0)) {
      setActivePiece((prev) => prev ? { ...prev, pos: { ...prev.pos, x: prev.pos.x + dir } } : null);
    }
  };

  const rotate = () => {
    if (status !== 'PLAYING' || !activePiece) return;
    const newShape = activePiece.shape[0].map((_, i) =>
      activePiece.shape.map((row) => row[i]).reverse()
    );
    if (!checkCollision(activePiece, board, 0, 0, newShape)) {
      setActivePiece((prev) => prev ? { ...prev, shape: newShape } : null);
    }
  };

  const hardDrop = () => {
    if (status !== 'PLAYING' || !activePiece) return;
    let dropY = 0;
    while (!checkCollision(activePiece, board, 0, dropY + 1)) {
      dropY++;
    }
    setActivePiece((prev) => prev ? { ...prev, pos: { ...prev.pos, y: prev.pos.y + dropY } } : null);
    // Force lock in next tick or right now? Let's do it in a way that feels responsive.
    // We'll update the state and then call lockPiece with the new position.
    const droppedPiece = { ...activePiece, pos: { ...activePiece.pos, y: activePiece.pos.y + dropY } };
    
    // Using setBoard and lockPiece logic directly to ensure immediate result
    const newBoard = board.map((row) => [...row]);
    droppedPiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          const boardY = droppedPiece.pos.y + y;
          const boardX = droppedPiece.pos.x + x;
          if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
            newBoard[boardY][boardX] = { filled: true, color: droppedPiece.color };
          }
        }
      });
    });

    let linesInThisMove = 0;
    const filteredBoard = newBoard.filter((row) => {
      const isFull = row.every((cell) => cell.filled);
      if (isFull) linesInThisMove++;
      return !isFull;
    });

    while (filteredBoard.length < ROWS) {
      filteredBoard.unshift(Array(COLS).fill({ filled: false, color: '' }));
    }

    const newLinesCleared = linesCleared + linesInThisMove;
    setLinesCleared(newLinesCleared);
    setScore((s) => s + LINE_POINTS[linesInThisMove] || 0);
    setBoard(filteredBoard);

    if (newLinesCleared >= WIN_LINES) {
      setStatus('WIN');
      setActivePiece(null);
    } else {
      const nextActive = { ...nextPiece };
      if (checkCollision(nextActive, filteredBoard)) {
        setStatus('GAME_OVER');
        setActivePiece(null);
      } else {
        setActivePiece(nextActive);
        setNextPiece(getRandomPiece());
      }
    }
  };

  const getGhostPos = () => {
    if (!activePiece) return null;
    let dropY = 0;
    while (!checkCollision(activePiece, board, 0, dropY + 1)) {
      dropY++;
    }
    return { ...activePiece.pos, y: activePiece.pos.y + dropY };
  };

  // Auto drop timer
  useEffect(() => {
    if (status === 'PLAYING') {
      const speed = INITIAL_SPEED * Math.pow(SPEED_INCREMENT, level - 1);
      dropTimerRef.current = setInterval(moveDown, speed);
    } else {
      if (dropTimerRef.current) clearInterval(dropTimerRef.current);
    }
    return () => {
      if (dropTimerRef.current) clearInterval(dropTimerRef.current);
    };
  }, [status, activePiece, board, moveDown, level]);

  // Level up every 10 lines (not strictly required but good for Polish)
  useEffect(() => {
    const newLevel = Math.floor(linesCleared / 10) + 1;
    if (newLevel !== level) setLevel(newLevel);
  }, [linesCleared, level]);

  const startGame = (name: string) => {
    setPlayerName(name);
    setBoard(createEmptyBoard());
    setActivePiece(getRandomPiece());
    setNextPiece(getRandomPiece());
    setStatus('PLAYING');
    setScore(0);
    setLinesCleared(0);
    setTimer(0);
    setLevel(1);
  };

  const togglePause = () => {
    if (status === 'PLAYING') setStatus('PAUSED');
    else if (status === 'PAUSED') setStatus('PLAYING');
  };

  const quitGame = () => {
    setStatus('GAME_OVER');
  };

  const resetToStart = () => {
    setStatus('START');
    setBoard(createEmptyBoard());
    setActivePiece(null);
  };

  return {
    board,
    activePiece,
    nextPiece,
    status,
    score,
    linesCleared,
    highScore,
    level,
    timer,
    playerName,
    startGame,
    togglePause,
    quitGame,
    resetToStart,
    moveSide,
    rotate,
    moveDown,
    hardDrop,
    ghostPos: getGhostPos(),
  };
};
