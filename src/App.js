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

  const canvasWidth = window.innerWidth;
  const canvasHeight = window.innerHeight;
  const playerSpeed = 7;
  const meteorSize = 30;

  const spawnMeteor = useCallback(() => {
    meteors.current.push({
      x: Math.random() * (canvasWidth - meteorSize),
      y: -meteorSize,
      speed: 3 + score * 0.05,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.1
    });
  }, [score, canvasWidth, meteorSize]);

  const isColliding = useCallback((r1, r2) => {
    return !(
      r1.x + r1.w < r2.x ||
      r1.x > r2.x + r2.w ||
      r1.y + r1.h < r2.y ||
      r1.y > r2.y + r2.h
    );
  }, []);

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

    if (p.x < 0) p.x = 0;
    if (p.x + p.w > canvasWidth) p.x = canvasWidth - p.w;
    if (p.y < 0) p.y = 0;
    if (p.y + p.h > canvasHeight) p.y = canvasHeight - p.h;
  }, [canvasWidth, canvasHeight, playerSpeed]);

  const drawPlayer = useCallback((ctx) => {
    const p = playerRef.current;
    
    ctx.save();
    ctx.translate(p.x + p.w/2, p.y + p.h/2);
    
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 25);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(-15, 15);
    ctx.lineTo(15, 15);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#60a5fa';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }, []);

  const drawMeteor = useCallback((ctx, meteor) => {
    ctx.save();
    ctx.translate(meteor.x + meteorSize/2, meteor.y + meteorSize/2);
    ctx.rotate(meteor.rotation);

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, meteorSize);
    gradient.addColorStop(0, 'rgba(239, 68, 68, 0.6)');
    gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, meteorSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(0, 0, meteorSize/2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-5, -3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(3, 2, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }, [meteorSize]);

  const drawHUD = useCallback((ctx) => {
    ctx.save();
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(20, 20, 200, 60);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`Pontuação: ${score}`, 30, 50);
    ctx.fillText(`Melhor: ${highScore}`, 30, 75);

    if (!running) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(canvasWidth - 220, canvasHeight - 80, 200, 60);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.fillText('WASD/Setas para mover', canvasWidth - 210, canvasHeight - 50);
      ctx.fillText('ESPAÇO para iniciar', canvasWidth - 210, canvasHeight - 30);
    }
    
    ctx.restore();
  }, [score, highScore, running, canvasWidth, canvasHeight]);

  const drawGameOver = useCallback((ctx) => {
    if (!running && score > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('FIM DE JOGO', canvasWidth/2, canvasHeight/2 - 100);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px Arial';
      ctx.fillText(`Pontuação Final: ${score}`, canvasWidth/2, canvasHeight/2 - 40);
      
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 28px Arial';
      ctx.fillText(`Melhor Pontuação: ${highScore}`, canvasWidth/2, canvasHeight/2);
      
      if (score >= highScore && score > 0) {
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('🎉 NOVA MELHOR PONTUAÇÃO! 🎉', canvasWidth/2, canvasHeight/2 + 40);
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Arial';
      ctx.fillText('Pressione ESPAÇO para jogar novamente', canvasWidth/2, canvasHeight/2 + 120);
      ctx.textAlign = 'start';
    }
  }, [running, score, highScore, canvasWidth, canvasHeight]);

  const gameLoop = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    bgGradient.addColorStop(0, '#0f172a');
    bgGradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

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
      updatePlayer();
      drawPlayer(ctx);

      if (Math.random() < 0.03) {
        spawnMeteor();
      }

      for (let i = meteors.current.length - 1; i >= 0; i--) {
        const meteor = meteors.current[i];
        meteor.y += meteor.speed;
        meteor.rotation += meteor.rotationSpeed;

        drawMeteor(ctx, meteor);

        const p = playerRef.current;
        if (isColliding(p, { x: meteor.x, y: meteor.y, w: meteorSize, h: meteorSize })) {
          setRunning(false);
          if (score > highScore) {
            setHighScore(score);
          }
          break;
        }

        if (meteor.y > canvasHeight) {
          meteors.current.splice(i, 1);
          setScore(prev => prev + 1);
        }
      }
    }

    drawHUD(ctx);
    drawGameOver(ctx);

    requestRef.current = requestAnimationFrame(gameLoop);
  }, [running, score, highScore, canvasWidth, canvasHeight, meteorSize, updatePlayer, drawPlayer, spawnMeteor, drawMeteor, isColliding, drawHUD, drawGameOver]);

  const startGame = useCallback(() => {
    meteors.current = [];
    playerRef.current = { x: canvasWidth/2 - 20, y: canvasHeight - 100, w: 40, h: 40 };
    setScore(0);
    setRunning(true);
  }, [canvasWidth, canvasHeight]);

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

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [gameLoop]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className="w-full h-full block"
      style={{ cursor: 'none' }}
    />
  );
}