'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Position {
  x: number;
  y: number;
}

interface Direction {
  x: number;
  y: number;
}

interface Usuario {
  max_score: number;
}

type SupabaseResponse = {
  data: Usuario | null;
  error: Error | null;
};

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE: Position[] = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];

export default function Game(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>({ x: 1, y: 0 });
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [score, setScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [maxScore, setMaxScore] = useState<number>(0);

  useEffect(() => {
    const getMaxScore = async () => {
      const email = localStorage.getItem('userEmail');
      if (!email) return;

      const { data } = await supabase
        .from('usuarios')
        .select('max_score')
        .eq('email', email)
        .single();

      if (data) {
        setMaxScore(data.max_score);
      }
    };

    getMaxScore();
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent): void => {
      switch (e.key) {
        case 'ArrowUp':
          if (direction.y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          if (direction.y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          if (direction.x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          if (direction.x !== -1) setDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction]);

  useEffect(() => {
    if (!canvasRef.current || gameOver) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const gameLoop = setInterval(() => {
      // Limpiar el canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);

      // Dibujar la comida
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

      // Dibujar la serpiente
      ctx.fillStyle = '#00ff00';
      snake.forEach(segment => {
        ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      });

      // Mover la serpiente
      const newHead = {
        x: (snake[0].x + direction.x + GRID_SIZE) % GRID_SIZE,
        y: (snake[0].y + direction.y + GRID_SIZE) % GRID_SIZE
      };

      // Verificar colisión con la serpiente
      if (snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        clearInterval(gameLoop);
        updateMaxScore();
        return;
      }

      const newSnake = [newHead, ...snake];

      // Verificar si la serpiente come la comida
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(prev => prev + 10);
        setFood({
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE)
        });
      } else {
        newSnake.pop();
      }

      setSnake(newSnake);
    }, 100);

    return () => clearInterval(gameLoop);
  }, [snake, direction, food, gameOver]);

  const updateMaxScore = async (): Promise<void> => {
    if (score > maxScore) {
      const email = localStorage.getItem('userEmail');
      if (!email) return;

      await supabase
        .from('usuarios')
        .update({ max_score: score })
        .eq('email', email);

      setMaxScore(score);
    }
  };

  const restartGame = (): void => {
    setSnake(INITIAL_SNAKE);
    setDirection({ x: 1, y: 0 });
    setFood({ x: 15, y: 15 });
    setScore(0);
    setGameOver(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="mb-4">
        <p className="text-xl font-bold">Puntuación: {score}</p>
        <p className="text-lg">Máxima Puntuación: {maxScore}</p>
      </div>
      <canvas
        ref={canvasRef}
        width={GRID_SIZE * CELL_SIZE}
        height={GRID_SIZE * CELL_SIZE}
        className="border-4 border-gray-800"
      />
      {gameOver && (
        <div className="mt-4">
          <p className="text-xl font-bold text-red-600 mb-4">¡Juego Terminado!</p>
          <button
            onClick={restartGame}
            className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Jugar de Nuevo
          </button>
        </div>
      )}
    </div>
  );
}