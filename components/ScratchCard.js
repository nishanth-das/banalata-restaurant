"use client";

import { useRef, useState, useEffect } from 'react';

export default function ScratchCard({ children, width = 300, height = 120 }) {
  const canvasRef = useRef(null);
  const [isScratched, setIsScratched] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // Draw the cover (scratch-off layer)
    ctx.fillStyle = '#facc15'; // Yellow-400 (matches Banalata theme)
    ctx.fillRect(0, 0, width, height);

    // Add some pattern/text
    ctx.font = '900 18px Arial';
    ctx.fillStyle = '#a16207';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎁 SCRATCH TO REVEAL 🎁', width / 2, height / 2);

    let isDrawing = false;

    const scratch = (x, y) => {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      // Use a larger brush
      ctx.arc(x, y, 25, 0, Math.PI * 2);
      ctx.fill();
    };

    const handleDown = (e) => {
      isDrawing = true;
      handleMove(e);
    };

    const handleMove = (e) => {
      if (!isDrawing) return;
      e.preventDefault(); // Prevent scrolling while scratching
      
      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;
      
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      // Calculate position relative to canvas
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;
      
      scratch(x, y);
      
      // We only check if scratched every few moves to save performance, 
      // but let's just debounce it slightly or check on mouseup/touchend
    };

    const handleUp = () => {
      isDrawing = false;
      checkScratched();
    };

    const checkScratched = () => {
      if (isScratched) return;
      
      const imageData = ctx.getImageData(0, 0, width, height);
      let transparentPixels = 0;
      const totalPixels = width * height;
      
      // Step by 4 to check alpha channel
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] === 0) {
          transparentPixels++;
        }
      }
      
      // If 40% is scratched, reveal the whole thing
      if (transparentPixels / totalPixels > 0.4) {
        setIsScratched(true);
        canvas.style.transition = 'opacity 0.5s ease-out';
        canvas.style.opacity = '0';
        setTimeout(() => {
            canvas.style.display = 'none';
        }, 500);
      }
    };

    canvas.addEventListener('mousedown', handleDown);
    canvas.addEventListener('mousemove', handleMove, { passive: false });
    window.addEventListener('mouseup', handleUp);

    canvas.addEventListener('touchstart', handleDown, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);

    return () => {
      canvas.removeEventListener('mousedown', handleDown);
      canvas.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);

      canvas.removeEventListener('touchstart', handleDown);
      canvas.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [width, height, isScratched]);

  return (
    <div 
      className="relative select-none overflow-hidden rounded-[2rem] shadow-2xl mx-auto"
      style={{ width: '100%', maxWidth: width, height, touchAction: 'none' }}
    >
      {/* Hidden Content (The Prize) */}
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 border-4 border-dashed border-zinc-700 p-4 text-center">
        {children}
      </div>

      {/* Scratch Layer */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0 w-full h-full cursor-crosshair z-10"
        style={{ touchAction: 'none' }}
      />
    </div>
  );
}
