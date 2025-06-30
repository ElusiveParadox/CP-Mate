'use client';

import { useEffect, useRef } from 'react';

interface DotLottiePlayerProps {
  src: string;
  speed?: number;
  loop?: boolean;
  autoplay?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export default function DotLottiePlayer({
  src,
  speed = 1,
  loop = true,
  autoplay = true,
  style,
  className,
}: DotLottiePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import('@dotlottie/player-component');

    const player = document.createElement('dotlottie-player');
    player.setAttribute('src', src);
    player.setAttribute('background', 'transparent');
    player.setAttribute('speed', String(speed));
    if (loop) player.setAttribute('loop', '');
    if (autoplay) player.setAttribute('autoplay', '');
    if (style) Object.assign(player.style, style);

    containerRef.current?.appendChild(player);

    return () => {
      containerRef.current?.removeChild(player);
    };
  }, [src, speed, loop, autoplay, style]);

  return <div ref={containerRef} className={className} />;
}
