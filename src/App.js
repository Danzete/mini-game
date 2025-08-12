import React, { useEffect, useRef, useState } from 'react';

export default function App() {
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const [running, setRunning] = useState(true);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem('dodge_high') || 0);
    } catch {
      return 0;
    }
  });
  const playerRef = useRef({ x: 180, y: 350, w: 40, h: 40 });
  const keysPressed = useRef({});
  const meteors = useRef([]);

  // Configurações
  const canvasWidth = 400;
  const canvasHeight = 400;
  const playerSpeed = 6;
  const meteorSize = 30;

  // Controle das teclas
  useEffect(() => {
    function downHandler(e) {
      keysPressed.current[e.key.toLowerCase()] = true;
    }
    function upHandler(e) {
      keysPressed.current[e.key.toLowerCase()] = false;
    }
    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);
    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
  }, []);

  // Função para gerar meteoros aleatórios
  function spawnMeteor() {
    meteors.current.push({
      x: Math.random() * (canvasWidth - meteorSize),
      y: -meteorSize,
      speed: 2 + score * 0.05,
    });
  }

  // Função de colisão entre retângulos
  function isColliding(r1, r2) {
    return !(
      r1.x + r1.w < r2.x ||
      r1.x > r2.x + r2.w ||
      r1.y + r1.h < r2.y ||
      r1.y > r2.y + r2.h
    );
  }

  // Atualiza posição do jogador conforme teclas
  function updatePlayer() {
    const p = playerRef.current;
    if (keysPressed.current['arrowleft'] || keysPressed.current['a']) {
      p.x -= playerSpeed;
    }
    if (keysPressed.current['arrowright'] || keysPressed.current['d']) {
      p.x += playerSpeed;
    }
    if (keysPressed.current['arrowup'] || keysPressed.current['w']) {
      p.y -= playerSpeed;
    }
    if (keysPressed.current['arrowdown'] || keysPressed.current['s']) {
      p.y += playerSpeed;
    }
    // Limita jogador dentro do canvas
    if (p.x < 0) p.x = 0;
    if (p.x + p.w > canvasWidth) p.x = canvasWidth - p.w;
    if (p.y < 0) p.y = 0;
    if (p.y + p.h > canvasHeight) p.y = canvasHeight - p.h;
  }

  // Loop principal do jogo
  const gameLoop = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Atualiza posição do jogador
    updatePlayer();

    // Desenha jogador (nave)
    const p = playerRef.current;
    ctx.fillStyle = '#00f';
    ctx.fillRect(p.x, p.y, p.w, p.h);

    // Cria meteoros aleatoriamente
    if (Math.random() < 0.03) {
      spawnMeteor();
    }

    // Atualiza e desenha meteoros
    meteors.current.forEach((m, i) => {
      m.y += m.speed;
      ctx.fillStyle = '#888';
      ctx.fillRect(m.x, m.y, meteorSize, meteorSize);

      // Colisão meteoro vs jogador
      if (isColliding(p, { x: m.x, y: m.y, w: meteorSize, h: meteorSize })) {
        setRunning(false);
      }

      // Remove meteoros que saíram da tela
      if (m.y > canvasHeight) {
        meteors.current.splice(i, 1);
        setScore((prev) => prev + 1);
      }
    });

    if (running) {
      requestRef.current = requestAnimationFrame(gameLoop);
    } else {
      // Salva recorde se bateu
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('dodge_high', score);
      }
    }
  };

  // Inicia o jogo ou reinicia
  const startGame = () => {
    meteors.current = [];
    playerRef.current = { x: 180, y: 350, w: 40, h: 40 };
    setScore(0);
    setRunning(true);
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  // Começa o loop na montagem
  useEffect(() => {
    startGame();
    return () => cancelAnimationFrame(requestRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center p-4 font-sans">
      <h1 className="text-2xl mb-2">🚀 Space Dodger</h1>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={{ border: '2px solid #333', background: '#000' }}
      />
      <div className="mt-4 flex gap-6 items-center">
        <button
          onClick={startGame}
          disabled={running}
          className={`px-4 py-2 rounded ${
            running
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {running ? 'Jogando...' : 'Recomeçar'}
        </button>
        <div className="text-lg">
          Pontuação: <strong>{score}</strong>
        </div>
        <div className="text-lg">
          Recorde: <strong>{highScore}</strong>
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-600 max-w-xs text-center">
        Use as setas do teclado ou as teclas WASD para mover a nave. Desvie dos
        meteoros que caem. Sobreviva o máximo possível!
      </p>
    </div>
  );
}
