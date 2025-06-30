// 'use client';

// import { useSearchParams } from 'next/navigation';
// import { useEffect, useRef } from 'react';
// import { toast } from 'sonner';

// export default function HomeSection() {
//   const params = useSearchParams();
//   const shownRef = useRef(false); 

//   useEffect(() => {
//     if (shownRef.current) return; 
//     const status = params.get("status");
//     if (status === "signed_in") {
//       toast.success("Signed in successfully!");
//       shownRef.current = true;
//     } else if (status === "signed_up") {
//       toast.success("Sign up successful. Welcome!");
//       shownRef.current = true;
//     }
//   }, [params]);

//   return (
//   <div className="flex justify-center h-screen">
//     <p className="text-white text-4xl p-2">Welcome to CP-Mate</p>
//   </div>
//   );
// }


'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

export default function HomeSection() {
  const params = useSearchParams();
  const shownRef = useRef(false);
  const { theme } = useTheme();

  useEffect(() => {
    if (shownRef.current) return;
    const status = params.get('status');
    if (status === 'signed_in') {
      toast.success('Signed in successfully!');
      shownRef.current = true;
    } else if (status === 'signed_up') {
      toast.success('Sign up successful. Welcome!');
      shownRef.current = true;
    }
  }, [params]);

  const getBackground = () => {
    switch (theme) {
      case 'idle':
        return 'bg-gradient-to-br from-[#000428] via-[#004e92] to-[#1a1a1a]';
      case 'dark':
        return 'bg-black';
      default:
        return 'bg-gradient-to-br from-[#1f1c2c] via-[#928dab] to-[#f0c27b]';
    }
  };

  const getTextStyle = () => {
    return `
      text-5xl font-bold drop-shadow-[0_0_20px_rgba(255,215,0,0.3)]
    `;
  };

  const getCPMateAnimation = () => {
    const gradientClass = (() => {
      switch (theme) {
        case 'idle':
          return 'bg-gradient-to-r from-yellow-300 via-yellow-500 to-orange-400';
        case 'dark':
          return 'bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-300';
        default:
          return 'bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-400';
      }
    })();

    const animationProps =
      theme === 'idle'
        ? {
            initial: { rotate: -5, scale: 0.95 },
            animate: {
              rotate: [0, 4, -4, 0],
              scale: [1, 1.1, 0.97, 1],
            },
          }
        : {
            animate: {
              textShadow: [
                '0 0 10px rgba(255,200,0,0.4)',
                '0 0 20px rgba(255,170,0,0.7)',
                '0 0 10px rgba(255,200,0,0.4)',
              ],
            },
          };

    return (
      <motion.span
        {...animationProps}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`bg-clip-text text-transparent ${gradientClass}`}
      >
        CP-Mate
      </motion.span>
    );
  };

  return (
    <div
      className={`flex justify-center items-start pt-5 h-screen transition-colors duration-500 ${getBackground()}`}
    >
      <motion.p
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className={`text-center ${getTextStyle()}`}
      >
        Welcome to {getCPMateAnimation()}
      </motion.p>
    </div>
  );
}
