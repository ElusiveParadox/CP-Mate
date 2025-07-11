'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { FaCheckCircle, FaTrash, FaSpinner } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { toast } from 'sonner';

const platforms = [
  { name: 'LeetCode', key: 'leetcode', icon: '/logos/leetcode.svg', baseUrl: 'https://leetcode.com/u/' },
  { name: 'Codeforces', key: 'codeforces', icon: '/logos/codeforces.svg', baseUrl: 'https://codeforces.com/profile/' },
  { name: 'AtCoder', key: 'atcoder', icon: '/logos/atcoder.svg', baseUrl: 'https://atcoder.jp/users/' },
  { name: 'CodeChef', key: 'codechef', icon: '/logos/codechef.svg', baseUrl: 'https://www.codechef.com/users/' },
  { name: 'LinkedIn', key: 'linkedin', icon: '/logos/linkedin.svg', baseUrl: 'https://www.linkedin.com/in/' },
];

// Helper to get the API base (adjust if needed)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8787';

interface VerificationState {
  code: string;
  verified: boolean;
  generated: boolean;
  status: 'not_found' | 'pending' | 'verified' | 'error';
  loading: boolean;
}

interface PlatformProfile {
  [key: string]: any;
}

export default function UserProfile() {
  const { theme } = useTheme();
  const [usernames, setUsernames] = useState(platforms.map(() => ''));
  const [verifications, setVerifications] = useState<VerificationState[]>(
    platforms.map(() => ({
      code: '',
      verified: false,
      generated: false,
      status: 'not_found',
      loading: false
    }))
  );
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<{ [key: string]: PlatformProfile }>({});
  const [basicDetails, setBasicDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    bio: '',
    country: '',
    college: '',
    degree: '',
    branch: '',
    graduationYear: '',
  });

  // Fetch user data and pre-fill fields
  useEffect(() => {
    async function loadUser() {
      try {
        const user = await fetchUser();
        // Fill platform handles
        setUsernames([
          user.leetcodeHandle || '',
          user.codeforcesHandle || '',
          user.atcoderHandle || '',
          user.codechefHandle || '',
          '', // LinkedIn (not handled by backend)
        ]);
        // Fill basic details
        setBasicDetails({
          firstName: user.firstName?.split(' ')[0] || '',
          lastName: user.lastName?.split(' ')[0] || '',
          email: user.email || '',
          bio: '', // If you have a bio field, set it here
          country: user.country || '',
          college: user.university || '',
          degree: '', // If you have a degree field, set it here
          branch: '', // If you have a branch field, set it here
          graduationYear: '', // If you have a graduationYear field, set it here
        });
        setProfilePhoto(user.avatarUrl || null);
      } catch (e) {
        toast.error('Failed to load user profile');
      }
    }
    loadUser();
    // Optionally, also call loadVerificationStatuses() here if you want to refresh statuses after user loads
  }, []);

  const loadVerificationStatuses = async () => {
    for (let i = 0; i < platforms.length; i++) {
      const platform = platforms[i];
      const handle = usernames[i];
      
      if (handle && platform.key !== 'linkedin') { // Skip LinkedIn as it doesn't have verification API
        try {
          const response = await fetch(`${API_BASE}/api/${platform.key}-verify/status?handle=${encodeURIComponent(handle)}`, {
            credentials: 'include',
          });
          
          if (response.ok) {
            const data = await response.json();
            updateVerificationState(i, {
              code: data.code || '',
              verified: data.status === 'verified',
              generated: data.status === 'pending' || data.status === 'verified',
              status: data.status,
              loading: false
            });
          }
        } catch (error) {
          console.error(`Error loading ${platform.name} status:`, error);
        }
      }
    }
  };

  const updateVerificationState = (index: number, updates: Partial<VerificationState>) => {
    const updated = [...verifications];
    updated[index] = { ...updated[index], ...updates };
    setVerifications(updated);
  };

  const handleChange = (index: number, value: string) => {
    const updated = [...usernames];
    updated[index] = value;
    setUsernames(updated);
  };

  const generateVerificationCode = async (index: number) => {
    const platform = platforms[index];
    const handle = usernames[index];
    
    if (!handle.trim()) {
      toast.error('Please enter a username first');
      return;
    }

    if (platform.key === 'linkedin') {
      toast.info('LinkedIn verification is not available through API');
      return;
    }

    updateVerificationState(index, { loading: true });

    try {
      const response = await fetch(`${API_BASE}/api/${platform.key}-verify/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ handle }),
      });

      if (response.ok) {
        const data = await response.json();
        updateVerificationState(index, {
          code: data.code,
          generated: true,
          verified: false,
          status: 'pending',
          loading: false
        });

        toast(
          <div className="flex items-center justify-between w-full">
            <span>
              Insert this code on your <strong>{platform.name}</strong> profile:
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(data.code);
                toast.success('Copied to clipboard');
              }}
              className="ml-4 text-xs px-2 py-1 bg-blue-600 text-white rounded"
            >
              Copy
            </button>
          </div>
        );
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to generate verification code');
        updateVerificationState(index, { loading: false, status: 'error' });
      }
    } catch (error) {
      console.error('Error generating verification code:', error);
      toast.error('Network error. Please try again.');
      updateVerificationState(index, { loading: false, status: 'error' });
    }
  };

  const submitVerification = async (index: number) => {
    const platform = platforms[index];
    const handle = usernames[index];

    if (!handle.trim()) {
      toast.error('Please enter a username first');
      return;
    }

    updateVerificationState(index, { loading: true });

    try {
      const response = await fetch(`${API_BASE}/api/${platform.key}-verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ handle }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.verified) {
          updateVerificationState(index, {
            verified: true,
            status: 'verified',
            loading: false
          });
          toast.success(`${platform.name} profile verified successfully!`);
          
          // Fetch profile data if it's LeetCode
          if (platform.key === 'leetcode') {
            await fetchLeetCodeProfile(handle);
          }
        } else {
          toast.error(data.reason || 'Verification failed');
          updateVerificationState(index, { loading: false, status: 'error' });
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Verification failed');
        updateVerificationState(index, { loading: false, status: 'error' });
      }
    } catch (error) {
      console.error('Error submitting verification:', error);
      toast.error('Network error. Please try again.');
      updateVerificationState(index, { loading: false, status: 'error' });
    }
  };

  const fetchLeetCodeProfile = async (handle: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/leetcode-data?handle=${encodeURIComponent(handle)}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const profile = await response.json();
        setProfiles(prev => ({ ...prev, leetcode: profile }));
        toast.success('LeetCode profile data synced!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to fetch LeetCode profile');
      }
    } catch (error) {
      console.error('Error fetching LeetCode profile:', error);
      toast.error('Failed to fetch LeetCode profile');
    }
  };

  const removePlatform = (index: number) => {
    const updated = [...usernames];
    updated[index] = '';
    setUsernames(updated);
    
    updateVerificationState(index, {
      code: '',
      verified: false,
      generated: false,
      status: 'not_found',
      loading: false
    });
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

  const getVerificationButton = (index: number) => {
    const verification = verifications[index];
    const platform = platforms[index];
    
    if (verification.loading) {
      return (
        <button
          disabled
          className="text-xs px-3 py-1 rounded border border-gray-500 bg-gray-600 text-white flex items-center gap-2"
        >
          <FaSpinner className="animate-spin" />
          Loading...
        </button>
      );
    }

    if (verification.verified) {
      return <FaCheckCircle className="text-green-400 text-lg animate-pulse" />;
    }

    if (verification.generated) {
      return (
        <button
          onClick={() => submitVerification(index)}
          className="text-xs px-3 py-1 rounded border border-green-500 bg-green-600 text-white hover:bg-green-700"
        >
          Submit
        </button>
      );
    }

    if (platform.key === 'linkedin') {
      return (
        <span className="text-xs px-3 py-1 rounded border border-gray-500 bg-gray-600 text-white">
          Manual
        </span>
      );
    }

    return (
      <button
        onClick={() => generateVerificationCode(index)}
        className="text-xs px-3 py-1 rounded border border-yellow-500 bg-yellow-600 text-white hover:bg-yellow-700"
      >
        Verify
      </button>
    );
  };

  async function fetchUser() {
    const res = await fetch(`${API_BASE}/api/user`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  }

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

            {getVerificationButton(index)}

            <FaTrash 
              className="ml-2 text-gray-400 cursor-pointer hover:text-red-500 transition"
              onClick={() => removePlatform(index)}
            />
          </motion.div>
        ))}

        {/* Show verification codes */}
        {verifications.some(v => v.generated && v.code) && (
          <div className="p-6 rounded-xl border border-yellow-300 backdrop-blur-lg bg-yellow-50/10 dark:bg-yellow-900/10">
            <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Verification Codes</h2>
            {verifications.map((verification, index) => {
              if (!verification.generated || !verification.code) return null;
              return (
                <div key={index} className="mb-2 p-3 rounded bg-white/10 dark:bg-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-black dark:text-white">
                      <strong>{platforms[index].name}:</strong> {verification.code}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(verification.code);
                        toast.success('Copied to clipboard');
                      }}
                      className="text-xs px-2 py-1 bg-blue-600 text-white rounded"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Add this code to your {platforms[index].name} profile description or bio
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Show LeetCode profile data if available */}
        {/* {profiles.leetcode && (
          <div className="p-6 rounded-xl border border-green-300 backdrop-blur-lg bg-green-50/10 dark:bg-green-900/10">
            <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">LeetCode Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-black dark:text-white"><strong>Username:</strong> {profiles.leetcode.username}</p>
                <p className="text-black dark:text-white"><strong>Real Name:</strong> {profiles.leetcode.realName}</p>
                <p className="text-black dark:text-white"><strong>Ranking:</strong> {profiles.leetcode.ranking}</p>
                <p className="text-black dark:text-white"><strong>Rating:</strong> {profiles.leetcode.rating}</p>
              </div>
              <div>
                <p className="text-black dark:text-white"><strong>AC Submissions:</strong> {profiles.leetcode.acSubmissionNum}</p>
                <p className="text-black dark:text-white"><strong>Total Submissions:</strong> {profiles.leetcode.totalSubmissionNum}</p>
                <p className="text-black dark:text-white"><strong>Contest Attended:</strong> {profiles.leetcode.attendedContestsCount}</p>
                <p className="text-black dark:text-white"><strong>Global Ranking:</strong> {profiles.leetcode.globalRanking}</p>
              </div>
            </div>
          </div>
        )} */}

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
            <input placeholder="First Name" className={`flex-1 min-w-[200px] px-3 py-2 rounded ${translucentInput}`} value={basicDetails.firstName} onChange={e => setBasicDetails(b => ({ ...b, firstName: e.target.value }))} />
            <input placeholder="Last Name" className={`flex-1 min-w-[200px] px-3 py-2 rounded ${translucentInput}`} value={basicDetails.lastName} onChange={e => setBasicDetails(b => ({ ...b, lastName: e.target.value }))} />
            <input placeholder="Email" className={`flex-1 min-w-[300px] px-3 py-2 rounded ${translucentInput}`} value={basicDetails.email} onChange={e => setBasicDetails(b => ({ ...b, email: e.target.value }))} />
            <textarea placeholder="Bio (Max 200 Characters)" rows={3} className={`w-full px-3 py-2 rounded ${translucentInput}`} />
            <select className={`flex-1 min-w-[200px] px-3 py-2 rounded ${translucentInput}`}>
              <option value="India">India</option>
              <option value="USA">USA</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <h2 className="text-xl font-semibold mt-8 mb-4 text-black dark:text-white">Educational Details</h2>
          <div className="flex flex-wrap gap-4">
            <input placeholder="College" className={`flex-1 min-w-[250px] px-3 py-2 rounded ${translucentInput}`} value={basicDetails.college} onChange={e => setBasicDetails(b => ({ ...b, college: e.target.value }))} />
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