import React, { useEffect, useRef, useState, useCallback } from 'react';

export default function App() {
  const canvasRef = useRef(null);
  const requestRef = useRef();
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  const playerRef = useRef({ x: 230, y: 500, w: 40, h: 40 });
  const keysPressed = useRef({});
  const meteors = useRef([]);
  const stars = useRef([]);

  // Configurações - tela cheia
  const canvasWidth = window.innerWidth;
  const canvasHeight = window.innerHeight;
  const playerSpeed = 7;
  const meteorSize = 30;

  // Função para gerar meteoros
  const spawnMeteor = useCallback(() => {
    meteors.current.push({
      x: Math.random() * (canvasWidth - meteorSize),
      y: -meteorSize,
      speed: 3 + score * 0.05,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.1
    });
  }, [score, canvasWidth, meteorSize]);

  // Função de colisão
  const isColliding = useCallback((r1, r2) => {
    return !(
      r1.x + r1.w < r2.x ||
      r1.x > r2.x + r2.w ||
      r1.y + r1.h < r2.y ||
      r1.y > r2.y + r2.h
    );
  }, []);

  // Atualiza posição do jogador
  const updatePlayer = useCallback(() => {
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
  }, [canvasWidth, canvasHeight, playerSpeed]);

  // Desenha nave
  const drawPlayer = useCallback((ctx) => {
    const p = playerRef.current;
    
    ctx.save();
    ctx.translate(p.x + p.w/2, p.y + p.h/2);
    
    // Glow da nave
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 25);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.fill();

    // Nave triangular
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(-15, 15);
    ctx.lineTo(15, 15);
    ctx.closePath();
    ctx.fill();
    
    // Centro da nave
    ctx.fillStyle = '#60a5fa';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }, []);

  // Desenha meteoro
  const drawMeteor = useCallback((ctx, meteor) => {
    ctx.save();
    ctx.translate(meteor.x + meteorSize/2, meteor.y + meteorSize/2);
    ctx.rotate(meteor.rotation);

    // Glow do meteoro
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, meteorSize);
    gradient.addColorStop(0, 'rgba(239, 68, 68, 0.6)');
    gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, meteorSize, 0, Math.PI * 2);
    ctx.fill();

    // Meteoro principal
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(0, 0, meteorSize/2, 0, Math.PI * 2);
    ctx.fill();

    // Detalhes
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-5, -3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(3, 2, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }, [meteorSize]);

  // Loop principal do jogo
  const gameLoop = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    // Fundo gradiente
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    bgGradient.addColorStop(0, '#0f172a');
    bgGradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Estrelas
    stars.current.forEach(star => {
      star.y += star.speed;
      if (star.y > canvasHeight) {
        star.y = -5;
        star.x = Math.random() * canvasWidth;
      }
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });

    if (running) {
      // Atualiza jogador
      updatePlayer();
      drawPlayer(ctx);

      // Cria meteoros
      if (Math.random() < 0.03) {
        spawnMeteor();
      }

      // Atualiza meteoros
      for (let i = meteors.current.length - 1; i >= 0; i--) {
        const meteor = meteors.current[i];
        meteor.y += meteor.speed;
        meteor.rotation += meteor.rotationSpeed;

        drawMeteor(ctx, meteor);

        // Colisão
        const p = playerRef.current;
        if (isColliding(p, { x: meteor.x, y: meteor.y, w: meteorSize, h: meteorSize })) {
          setRunning(false);
          if (score > highScore) {
            setHighScore(score);
          }
          break;
        }

        // Remove meteoros que saíram
        if (meteor.y > canvasHeight) {
          meteors.current.splice(i, 1);
          setScore(prev => prev + 1);
        }
      }

      // UI do jogo movida para o HUD externo
      // (removido do canvas para usar HUD)
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  }, [running, score, highScore, canvasWidth, canvasHeight, meteorSize, updatePlayer, drawPlayer, spawnMeteor, drawMeteor, isColliding]);

  // Inicia o jogo
  const startGame = useCallback(() => {
    meteors.current = [];
    playerRef.current = { x: canvasWidth/2 - 20, y: canvasHeight - 100, w: 40, h: 40 };
    setScore(0);
    setRunning(true);
  }, [canvasWidth, canvasHeight]);

  // Inicializa estrelas
  useEffect(() => {
    stars.current = [];
    for (let i = 0; i < 100; i++) {
      stars.current.push({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 1 + 0.5
      });
    }
  }, [canvasWidth, canvasHeight]);

  // Controle das teclas
  useEffect(() => {
    function downHandler(e) {
      keysPressed.current[e.key.toLowerCase()] = true;
      if (e.key === ' ') {
        e.preventDefault();
        if (!running) startGame();
      }
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
  }, [running, startGame]);

  // Inicia o loop principal
  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [gameLoop]);

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center overflow-hidden">
      <div className="relative w-full h-full">
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="w-full h-full block"
        />
        
       
        
        {!running && (
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center z-20">
            <div className="text-center space-y-6">
              {/* Título sempre visível */}
              <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-8">
                🚀 SPACE DODGER
              </h1>
              
              {score > 0 ? (
                <>
                  <h2 className="text-4xl font-bold text-red-400">GAME OVER</h2>
                  <p className="text-3xl text-white">Final Score: {score}</p>
                  <p className="text-2xl text-yellow-400">Best: {highScore}</p>
                  {score >= highScore && score > 0 && (
                    <p className="text-green-400 text-2xl animate-pulse">🎉 NEW HIGH SCORE! 🎉</p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xl text-gray-300 mb-6">Survive the meteor storm!</p>
                  <div className="text-lg text-gray-400 space-y-2">
                  </div>
                </>
              )}
              
              <button
                onClick={startGame}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-full text-2xl font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                {score > 0 ? 'PLAY AGAIN' : 'START GAME'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}