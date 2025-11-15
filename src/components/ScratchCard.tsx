'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Gift } from 'lucide-react';

interface ScratchCardProps {
  coupon: {
    id: string;
    premio: string;
    status: 'disponivel' | 'raspado';
  };
  onScratch: (id: string) => void;
}

const SCRATCH_THRESHOLD = 40; // Percentage to reveal

export const ScratchCard = ({ coupon, onScratch }: ScratchCardProps) => {
  const [isRevealed, setIsRevealed] = useState(coupon.status === 'raspado');
  const [scratchProgress, setScratchProgress] = useState(coupon.status === 'raspado' ? 100 : 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const handleScratch = useCallback(() => {
    if (!isRevealed) {
      setIsRevealed(true);
      onScratch(coupon.id);
    }
  }, [isRevealed, onScratch, coupon.id]);

  useEffect(() => {
    if (isRevealed || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.parentElement!.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    ctx.scale(scale, scale);

    ctx.fillStyle = '#d1d5db'; // gray-300
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 40;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const getPosition = (e: MouseEvent | TouchEvent) => {
      const parentRect = canvas.getBoundingClientRect();
      if (e.type.startsWith('touch')) {
        const touch = (e as TouchEvent).touches[0];
        return { x: touch.clientX - parentRect.left, y: touch.clientY - parentRect.top };
      }
      return { x: (e as MouseEvent).clientX - parentRect.left, y: (e as MouseEvent).clientY - parentRect.top };
    }

    const startDrawing = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      isDrawing.current = true;
      const { x, y } = getPosition(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing.current) return;
      e.preventDefault();
      const { x, y } = getPosition(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const stopDrawing = () => {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      ctx.closePath();
      checkScratchProgress();
    };
    
    const checkScratchProgress = () => {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let transparentPixels = 0;
        for (let i = 3; i < data.length; i += 4) {
            if (data[i] === 0) {
                transparentPixels++;
            }
        }
        const totalPixels = canvas.width * canvas.height;
        const progress = (transparentPixels / totalPixels) * 100;
        setScratchProgress(progress);

        if (progress >= SCRATCH_THRESHOLD) {
            handleScratch();
        }
    }

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDrawing);

    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    window.addEventListener('touchend', stopDrawing);

    return () => {
      if (canvas) {
        canvas.removeEventListener('mousedown', startDrawing);
        canvas.removeEventListener('mousemove', draw);
        canvas.removeEventListener('touchstart', startDrawing);
        canvas.removeEventListener('touchmove', draw);
      }
      window.removeEventListener('mouseup', stopDrawing);
      window.removeEventListener('touchend', stopDrawing);
    };
  }, [isRevealed, handleScratch]);

  return (
    <Card className="shadow-lg border-amber-400/50 bg-gradient-to-br from-yellow-50 to-amber-100 overflow-hidden">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl font-bold text-center text-amber-600 flex items-center justify-center gap-2">
          <Sparkles /> Raspadinha Premiada!
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4 px-4 pb-6">
        <p className="text-muted-foreground">
          {isRevealed ? 'Parabéns! Você ganhou:' : 'Raspe para revelar seu prêmio instantâneo!'}
        </p>
        <div 
          className={`relative w-full h-36 rounded-lg border-2 border-dashed border-amber-400 flex items-center justify-center transition-all duration-500`}
          style={{ touchAction: 'none' }}
        >
          <div className={`absolute inset-0 flex items-center justify-center text-center p-2 transition-opacity duration-700 ${isRevealed ? 'opacity-100' : 'opacity-0'}`}>
            <div className='animate-in fade-in-50 zoom-in-90'>
                <Gift className="h-10 w-10 mx-auto text-amber-500 mb-2"/>
                <p className="text-2xl font-black text-transparent bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text">
                  {coupon.premio}
                </p>
            </div>
          </div>
          {!isRevealed && (
            <canvas 
              ref={canvasRef} 
              className="absolute inset-0 z-10 w-full h-full cursor-pointer rounded-md"
            ></canvas>
          )}
        </div>
        {!isRevealed && (
            <div className='space-y-2 pt-2'>
                <Progress value={scratchProgress} className="w-full h-2" />
                <p className='text-xs text-muted-foreground'>Raspe para revelar</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
};
