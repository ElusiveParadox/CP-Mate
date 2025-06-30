// 'use client';

// import { useState } from 'react';
// import { useTheme } from '@/context/ThemeContext';
// import { FaCheckCircle, FaTrash } from 'react-icons/fa';
// import { motion } from 'framer-motion';
// import Image from 'next/image';
// import { toast } from 'sonner';

// const platforms = [
//   { name: 'LeetCode', icon: '/logos/leetcode.svg', baseUrl: 'https://leetcode.com/u/' },
//   { name: 'Codeforces', icon: '/logos/codeforces.svg', baseUrl: 'https://codeforces.com/profile/' },
//   { name: 'AtCoder', icon: '/logos/atcoder.svg', baseUrl: 'https://atcoder.jp/users/' },
//   { name: 'CodeChef', icon: '/logos/codechef.svg', baseUrl: 'https://www.codechef.com/users/' },
//   { name: 'LinkedIn', icon: '/logos/linkedin.svg', baseUrl: 'https://www.linkedin.com/in/' },
// ];

// export default function UserProfile() {
//   const { theme } = useTheme();
//   const [usernames, setUsernames] = useState(platforms.map(() => ''));
//   const [verifications, setVerifications] = useState(platforms.map(() => ({ otp: '', verified: false, generated: false })));
//   const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

//   const handleChange = (index: number, value: string) => {
//     const updated = [...usernames];
//     updated[index] = value;
//     setUsernames(updated);
//   };

//   const generateOTP = (index: number) => {
//     const otp = Math.random().toString(36).substring(2, 8);
//     const updated = [...verifications];
//     updated[index] = { otp, verified: false, generated: true };
//     setVerifications(updated);
//     toast(
//       <div className="flex items-center justify-between w-full">
//         <span>
//           Insert this code on your <strong>{platforms[index].name}</strong> profile:
//         </span>
//         <button
//           onClick={() => {
//             navigator.clipboard.writeText(otp);
//             toast.success('Copied to clipboard');
//           }}
//           className="ml-4 text-xs px-2 py-1 bg-blue-600 text-white rounded"
//         >
//           Copy
//         </button>
//       </div>
//     );
//   };

//   const markVerified = (index: number) => {
//     const updated = [...verifications];
//     updated[index].verified = true;
//     setVerifications(updated);
//     toast.success(`${platforms[index].name} profile verified`);
//   };

//   const translucentInput = 'bg-white/10 dark:bg-white/10 backdrop-blur-md border border-gray-300 dark:border-gray-700 text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400';

//   return (
//     <main className="min-h-screen pt-24 px-4 font-sans bg-transparent">
//       <motion.div
//         initial={{ opacity: 0, scale: 0.95, y: 10 }}
//         animate={{ opacity: 1, scale: 1, y: 0 }}
//         transition={{ duration: 0.6 }}
//         className="w-full max-w-5xl mx-auto space-y-10"
//       >
//         <h1 className="text-3xl font-bold text-center mb-6 text-black dark:text-white">
//           🌐 Your Coding Profiles
//         </h1>

//         {platforms.map((platform, index) => (
//           <motion.div
//             key={platform.name}
//             whileHover={{ scale: 1.02 }}
//             transition={{ type: 'spring', stiffness: 200, damping: 15 }}
//             className="flex items-center gap-4 p-4 rounded-xl border border-gray-300 dark:border-gray-700 backdrop-blur-md bg-white/10 dark:bg-white/10"
//           >
//             <div className="flex items-center gap-2 min-w-[140px]">
//               <Image
//                 src={platform.icon}
//                 alt={platform.name}
//                 width={28}
//                 height={28}
//                 className="invert dark:invert-0"
//               />
//               <span className="font-medium text-sm text-black dark:text-white">{platform.name}</span>
//             </div>

//             <input
//               type="text"
//               className={`flex-grow px-3 py-1 rounded ${translucentInput}`}
//               value={usernames[index]}
//               placeholder="johndoe"
//               onChange={(e) => handleChange(index, e.target.value)}
//             />

//             {verifications[index].verified ? (
//               <FaCheckCircle className="text-green-400 text-lg animate-pulse" />
//             ) : verifications[index].generated ? (
//               <button
//                 onClick={() => markVerified(index)}
//                 className="text-xs px-3 py-1 rounded border border-green-500 bg-green-600 text-white hover:bg-green-700"
//               >
//                 Submit
//               </button>
//             ) : (
//               <button
//                 onClick={() => generateOTP(index)}
//                 className="text-xs px-3 py-1 rounded border border-yellow-500 bg-yellow-600 text-white hover:bg-yellow-700"
//               >
//                 Verify
//               </button>
//             )}

//             <FaTrash className="ml-2 text-gray-400 cursor-pointer hover:text-red-500 transition" />
//           </motion.div>
//         ))}

//         <div className="p-6 rounded-xl border border-blue-300 backdrop-blur-lg bg-white/10 dark:bg-white/10">
//           <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Basic Details</h2>

//           <div className="flex items-center gap-4 mb-6">
//             {profilePhoto ? (
//               <Image
//                 src={profilePhoto}
//                 alt="Profile"
//                 width={64}
//                 height={64}
//                 className="rounded-full border border-gray-300"
//               />
//             ) : (
//               <div className="w-16 h-16 rounded-full border border-gray-400 bg-gray-300" />
//             )}
//             <input
//               type="file"
//               accept="image/*"
//               onChange={(e) => {
//                 const file = e.target.files?.[0];
//                 if (file && file.size < 1024 * 1024) {
//                   const reader = new FileReader();
//                   reader.onload = () => {
//                     if (typeof reader.result === 'string') {
//                       setProfilePhoto(reader.result);
//                     }
//                   };
//                   reader.readAsDataURL(file);
//                 } else {
//                   toast.error('Max image size is 1MB');
//                 }
//               }}
//               className="text-sm text-gray-600"
//             />
//           </div>

//           <div className="flex flex-wrap gap-4">
//             <input placeholder="First Name" className={`flex-1 min-w-[200px] px-3 py-2 rounded ${translucentInput}`} />
//             <input placeholder="Last Name" className={`flex-1 min-w-[200px] px-3 py-2 rounded ${translucentInput}`} />
//             <input placeholder="Email" className={`flex-1 min-w-[300px] px-3 py-2 rounded ${translucentInput}`} />
//             <textarea placeholder="Bio (Max 200 Characters)" rows={3} className={`w-full px-3 py-2 rounded ${translucentInput}`} />
//             <select className={`flex-1 min-w-[200px] px-3 py-2 rounded ${translucentInput}`}>
//               <option value="India">India</option>
//               <option value="USA">USA</option>
//               <option value="Other">Other</option>
//             </select>
//           </div>

//           <h2 className="text-xl font-semibold mt-8 mb-4 text-black dark:text-white">Educational Details</h2>
//           <div className="flex flex-wrap gap-4">
//             <input placeholder="College" className={`flex-1 min-w-[250px] px-3 py-2 rounded ${translucentInput}`} />
//             <select className={`flex-1 min-w-[250px] px-3 py-2 rounded ${translucentInput}`}>
//               <option>Bachelor of Technology</option>
//               <option>Master of Science</option>
//             </select>
//             <input placeholder="Branch" className={`flex-1 min-w-[250px] px-3 py-2 rounded ${translucentInput}`} />
//             <input placeholder="Year of Graduation" className={`flex-1 min-w-[250px] px-3 py-2 rounded ${translucentInput}`} />
//           </div>
//         </div>
//       </motion.div>
//     </main>
//   );
// }

'use client';

import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { FaCheckCircle, FaTrash } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { toast } from 'sonner';

const platforms = [
  { name: 'LeetCode', icon: '/logos/leetcode.svg', baseUrl: 'https://leetcode.com/u/' },
  { name: 'Codeforces', icon: '/logos/codeforces.svg', baseUrl: 'https://codeforces.com/profile/' },
  { name: 'AtCoder', icon: '/logos/atcoder.svg', baseUrl: 'https://atcoder.jp/users/' },
  { name: 'CodeChef', icon: '/logos/codechef.svg', baseUrl: 'https://www.codechef.com/users/' },
  { name: 'LinkedIn', icon: '/logos/linkedin.svg', baseUrl: 'https://www.linkedin.com/in/' },
];

export default function UserProfile() {
  const { theme } = useTheme();
  const [usernames, setUsernames] = useState(platforms.map(() => ''));
  const [verifications, setVerifications] = useState(platforms.map(() => ({ otp: '', verified: false, generated: false })));
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  const handleChange = (index: number, value: string) => {
    const updated = [...usernames];
    updated[index] = value;
    setUsernames(updated);
  };

  const generateOTP = (index: number) => {
    const otp = Math.random().toString(36).substring(2, 8);
    const updated = [...verifications];
    updated[index] = { otp, verified: false, generated: true };
    setVerifications(updated);
    toast(
      <div className="flex items-center justify-between w-full">
        <span>
          Insert this code on your <strong>{platforms[index].name}</strong> profile:
        </span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(otp);
            toast.success('Copied to clipboard');
          }}
          className="ml-4 text-xs px-2 py-1 bg-blue-600 text-white rounded"
        >
          Copy
        </button>
      </div>
    );
  };

  const markVerified = (index: number) => {
    const updated = [...verifications];
    updated[index].verified = true;
    setVerifications(updated);
    toast.success(`${platforms[index].name} profile verified`);
  };

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

  const translucentInput = 'bg-white/10 dark:bg-white/10 backdrop-blur-md border border-gray-300 dark:border-gray-700 text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400';

  return (
    <main className={`min-h-screen pt-24 px-4 font-sans transition-colors duration-500 ${getBackground()}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-5xl mx-auto space-y-10"
      >
        <h1 className="text-3xl font-bold text-center mb-6 text-black dark:text-white">
          🌐 Your Coding Profiles
        </h1>

        {platforms.map((platform, index) => (
          <motion.div
            key={platform.name}
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="flex items-center gap-4 p-4 rounded-xl border border-gray-300 dark:border-gray-700 backdrop-blur-md bg-white/10 dark:bg-white/10"
          >
            <div className="flex items-center gap-2 min-w-[140px]">
              <Image
                src={platform.icon}
                alt={platform.name}
                width={28}
                height={28}
                className="invert dark:invert-0"
              />
              <span className="font-medium text-sm text-black dark:text-white">{platform.name}</span>
            </div>

            <input
              type="text"
              className={`flex-grow px-3 py-1 rounded ${translucentInput}`}
              value={usernames[index]}
              placeholder="johndoe"
              onChange={(e) => handleChange(index, e.target.value)}
            />

            {verifications[index].verified ? (
              <FaCheckCircle className="text-green-400 text-lg animate-pulse" />
            ) : verifications[index].generated ? (
              <button
                onClick={() => markVerified(index)}
                className="text-xs px-3 py-1 rounded border border-green-500 bg-green-600 text-white hover:bg-green-700"
              >
                Submit
              </button>
            ) : (
              <button
                onClick={() => generateOTP(index)}
                className="text-xs px-3 py-1 rounded border border-yellow-500 bg-yellow-600 text-white hover:bg-yellow-700"
              >
                Verify
              </button>
            )}

            <FaTrash className="ml-2 text-gray-400 cursor-pointer hover:text-red-500 transition" />
          </motion.div>
        ))}

        <div className="p-6 rounded-xl border border-blue-300 backdrop-blur-lg bg-white/10 dark:bg-white/10">
          <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Basic Details</h2>

          <div className="flex items-center gap-4 mb-6">
            {profilePhoto ? (
              <Image
                src={profilePhoto}
                alt="Profile"
                width={64}
                height={64}
                className="rounded-full border border-gray-300"
              />
            ) : (
              <div className="w-16 h-16 rounded-full border border-gray-400 bg-gray-300" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && file.size < 1024 * 1024) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === 'string') {
                      setProfilePhoto(reader.result);
                    }
                  };
                  reader.readAsDataURL(file);
                } else {
                  toast.error('Max image size is 1MB');
                }
              }}
              className="text-sm text-gray-600"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <input placeholder="First Name" className={`flex-1 min-w-[200px] px-3 py-2 rounded ${translucentInput}`} />
            <input placeholder="Last Name" className={`flex-1 min-w-[200px] px-3 py-2 rounded ${translucentInput}`} />
            <input placeholder="Email" className={`flex-1 min-w-[300px] px-3 py-2 rounded ${translucentInput}`} />
            <textarea placeholder="Bio (Max 200 Characters)" rows={3} className={`w-full px-3 py-2 rounded ${translucentInput}`} />
            <select className={`flex-1 min-w-[200px] px-3 py-2 rounded ${translucentInput}`}>
              <option value="India">India</option>
              <option value="USA">USA</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-black dark:text-white">Educational Details</h2>
          <div className="flex flex-wrap gap-4">
            <input placeholder="College" className={`flex-1 min-w-[250px] px-3 py-2 rounded ${translucentInput}`} />
            <select className={`flex-1 min-w-[250px] px-3 py-2 rounded ${translucentInput}`}>
              <option>Bachelor of Technology</option>
              <option>Master of Science</option>
            </select>
            <input placeholder="Branch" className={`flex-1 min-w-[250px] px-3 py-2 rounded ${translucentInput}`} />
            <input placeholder="Year of Graduation" className={`flex-1 min-w-[250px] px-3 py-2 rounded ${translucentInput}`} />
          </div>
        </div>
      </motion.div>
    </main>
  );
}
