// 'use client';

// import { useEffect, useState } from 'react';
// import { motion } from 'framer-motion';
// import { useTheme } from '@/context/ThemeContext';
// import Image from 'next/image';

// const Dashboard = () => {
//   const { theme } = useTheme();

//   const [data, setData] = useState({
//     totalQuestions: 0,
//     totalDays: 0,
//     submissions: 0,
//     streak: 0,
//     contests: {
//       leetcode: 0,
//       codeforces: 0,
//       atcoder: 0,
//       codechef: 0,
//     },
//     solved: {
//       easy: 0,
//       medium: 0,
//       hard: 0,
//     },
//     cp: {
//       codeforces: 0,
//       codechef: 0,
//     },
//     fundamentals: {
//       gfg: 0,
//       hackerrank: 0,
//     },
//     rating: 0,
//     contestDate: '',
//     contestRank: '',
//     dsa: {
//       arrays: 0,
//       algorithms: 0,
//     },
//     awards: 0,
//     githubStats: {
//       contributions: 0,
//       rank: 0,
//     },
//   });

//   useEffect(() => {
//     // Mock future API logic
//     setTimeout(() => {
//       setData((prev) => ({
//         ...prev,
//         totalQuestions: 0,
//         totalDays: 0,
//         submissions: 0,
//         streak: 0,
//         contests: {
//           leetcode: 99,
//           codeforces: 99,
//           atcoder: 99,
//           codechef: 99,
//         },
//         solved: {
//           easy: 99,
//           medium: 99,
//           hard: 99,
//         },
//         cp: {
//           codeforces: 99,
//           codechef: 99,
//         },
//         fundamentals: {
//           gfg: 35,
//           hackerrank: 13,
//         },
//         rating: 1672,
//         contestDate: '22 Jun 2025',
//         contestRank: '8293',
//         dsa: {
//           arrays: 75,
//           algorithms: 188,
//         },
//         awards: 6,
//         githubStats: {
//           contributions: 2195,
//           rank: 2195,
//         },
//       }));
//     }, 1000);
//   }, []);

//   return (
//     <main className="min-h-screen p-6 pt-24 text-white font-sans bg-transparent">
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Left Sidebar */}
//         <div className="space-y-6">
//           <div className="bg-white/10 dark:bg-white/10 backdrop-blur-md p-4 rounded-xl border border-gray-700">
//             <div className="flex items-center gap-4">
//               <Image
//                 src="/avatar.png"
//                 alt="Profile"
//                 width={64}
//                 height={64}
//                 className="rounded-full border border-gray-500"
//               />
//               <div>
//                 <h2 className="text-xl font-semibold">Elusive Paradox</h2>
//                 <p className="text-sm text-blue-400">@ElusiveParadox</p>
//               </div>
//             </div>
//             <button className="mt-4 w-full bg-yellow-500 text-black py-1 rounded hover:bg-yellow-400">
//               Get your Codilio Card
//             </button>
//             <div className="mt-4 space-y-1 text-sm text-gray-300">
//               <p>📍 India</p>
//               <p>🎓 Rishihood University</p>
//             </div>
//           </div>

//           {/* Platform Stats */}
//           <div className="bg-white/10 dark:bg-white/10 backdrop-blur-md p-4 rounded-xl border border-gray-700">
//             <h3 className="text-lg font-semibold mb-2">Problem Solving Stats</h3>
//             {Object.entries(data.cp).map(([platform, value]) => (
//               <p key={platform} className="flex justify-between">
//                 <span className="capitalize">{platform}</span>
//                 <span>{value}</span>
//               </p>
//             ))}
//           </div>
//         </div>

//         {/* Main Stats */}
//         <div className="lg:col-span-2 space-y-6">
//           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
//             <StatBox label="Total Questions" value={data.totalQuestions} />
//             <StatBox label="Total Active Days" value={data.totalDays} />
//             <StatBox label="Submissions" value={data.submissions} />
//             <StatBox label="Streak" value={data.streak} />
//           </div>

//           <div className="bg-white/10 dark:bg-white/10 backdrop-blur-md p-4 rounded-xl border border-gray-700">
//             <h3 className="text-lg font-semibold mb-2">Problems Solved</h3>
//             <p>Fundamentals: {data.fundamentals.gfg + data.fundamentals.hackerrank}</p>
//             <p>DSA: {data.solved.easy + data.solved.medium + data.solved.hard}</p>
//             <p>Competitive: {data.cp.codeforces + data.cp.codechef}</p>
//           </div>

//           <div className="bg-white/10 dark:bg-white/10 backdrop-blur-md p-4 rounded-xl border border-gray-700">
//             <h3 className="text-lg font-semibold mb-2">Contests</h3>
//             {Object.entries(data.contests).map(([platform, value]) => (
//               <p key={platform} className="capitalize">
//                 {platform}: {value}
//               </p>
//             ))}
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// };

// const StatBox = ({ label, value }: { label: string; value: number }) => (
//   <motion.div
//     whileHover={{ scale: 1.05 }}
//     transition={{ type: 'spring', stiffness: 300 }}
//     className="p-4 bg-white/10 dark:bg-white/10 border border-gray-600 rounded-xl text-center backdrop-blur-md"
//   >
//     <h4 className="text-lg font-semibold text-white dark:text-white">{label}</h4>
//     <p className="text-2xl font-bold text-yellow-300">{value}</p>
//   </motion.div>
// );

// export default Dashboard;


'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import Image from 'next/image';

const Dashboard = () => {
  const { theme } = useTheme();
  const shownRef = useRef(false);

  const [data, setData] = useState({
    contests: {
      leetcode: 0,
      codeforces: 0,
      atcoder: 0,
      codechef: 0,
    },
    cp: {
      codeforces: 0,
      codechef: 0,
      atcoder: 0,
      leetcode: 0,
    },
  });

  useEffect(() => {
    const storedData = localStorage.getItem('cp-profile-data');
    if (storedData) {
      const parsed = JSON.parse(storedData);
      setData({
        contests: {
          leetcode: parsed.contests?.leetcode || 0,
          codeforces: parsed.contests?.codeforces || 0,
          atcoder: parsed.contests?.atcoder || 0,
          codechef: parsed.contests?.codechef || 0,
        },
        cp: {
          codeforces: parsed.cp?.codeforces || 0,
          codechef: parsed.cp?.codechef || 0,
          atcoder: parsed.cp?.atcoder || 0,
          leetcode: parsed.cp?.leetcode || 0,
        },
      });
    }
  }, []);

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

  return (
    <main className={`min-h-screen p-6 pt-24 text-white font-sans transition-colors duration-500 ${getBackground()}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar */}
        <div className="space-y-6">
          <div className="bg-white/10 dark:bg-white/10 backdrop-blur-md p-4 rounded-xl border border-gray-700">
            <div className="flex items-center gap-4">
              <Image
                src="/avatar.png"
                alt="Profile"
                width={64}
                height={64}
                className="rounded-full border border-gray-500"
              />
              <div>
                <h2 className="text-xl font-semibold">JohnDoe</h2>
                <p className="text-sm text-blue-400">@JohnDoe</p>
              </div>
            </div>
            <button className="mt-4 w-full bg-yellow-500 text-black py-1 rounded hover:bg-yellow-400">
              Get your CP-Mate Card
            </button>
          </div>

          {/* Platform Stats */}
          <div className="bg-white/10 dark:bg-white/10 backdrop-blur-md p-4 rounded-xl border border-gray-700">
            <h3 className="text-lg font-semibold mb-2">Problem Solving Stats</h3>
            {Object.entries(data.cp).map(([platform, value]) => (
              <p key={platform} className="flex justify-between">
                <span className="capitalize">{platform}</span>
                <span>{value}</span>
              </p>
            ))}
          </div>
        </div>

        {/* Main Stats */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/10 dark:bg-white/10 backdrop-blur-md p-4 rounded-xl border border-gray-700">
            <h3 className="text-lg font-semibold mb-2">Contests</h3>
            {Object.entries(data.contests).map(([platform, value]) => (
              <p key={platform} className="capitalize">
                {platform}: {value}
              </p>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;