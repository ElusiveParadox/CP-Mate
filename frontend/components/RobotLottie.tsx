'use client';


import { useEffect } from 'react';
import DotLottiePlayer from './DotLottiePlayer';

export default function RobotLottie() {
  useEffect(() => {
    import('@dotlottie/player-component'); // load once in browser
  }, []);

  return (
    <div className="fixed top-2 left-4 z-50 flex flex-col items-center pt-20">
      <div className="relative w-32 sm:w-40 md:w-48 aspect-square transition duration-300 ease-in-out transform hover:scale-110 group">
        {/* Glowing gradient background */}
        <div
          className="absolute inset-0 rounded-full blur-lg opacity-80 group-hover:opacity-100 transition duration-300"
          style={{
            background:
              'radial-gradient(circle at center, rgba(255,215,0,0.4), rgba(0,0,139,0.6))',
            zIndex: 0,
          }}
        />

        {/* Lottie animation (SSR-safe) */}
        <DotLottiePlayer
          src="https://lottie.host/55b00eac-8886-46b3-b909-342fbde88c0b/peRLOziFTg.lottie"
          background="transparent"
          speed="1"
          loop
          autoplay
          style={{ width: '100%', height: '100%' }}
          className="relative z-10 rounded-full"
        />
      </div>
    </div>
  );
}
