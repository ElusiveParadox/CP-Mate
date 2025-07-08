import { load } from 'cheerio';

import { prisma } from './db';

export async function generateVerificationCode(
  handle: string,
  platform: string = 'codeforces'
): Promise<string> {
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();

  const existingRecord = await prisma.userVerification.findFirst({
    where: { handle, platform },
  });

  if (existingRecord) {
    await prisma.userVerification.update({
      where: { id: existingRecord.id },
      data: { code, verified: false },
    });
  } else {
    await prisma.userVerification.create({
      data: { handle, platform, code, verified: false },
    });
  }

  return code;
}

interface CodeforcesApiResponse {
  status: string;
  comment?: string;
  result: Array<{
    firstName?: string;
    lastName?: string;
    organization?: string;
    rank?: string;
    rating?: number;
  }>;
}

export async function fetchCodeforcesProfileInfo(handle: string): Promise<{ firstName?: string; lastName?: string; organization?: string; rank?: string; rating?: number }> {
  // Use Codeforces API to get user info
  const res = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
  if (!res.ok) throw new Error('Failed to fetch Codeforces user info');
  
  const data = await res.json() as CodeforcesApiResponse;
  if (data.status !== 'OK') {
    throw new Error(data.comment || 'User not found');
  }
  
  const user = data.result[0];
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    organization: user.organization,
    rank: user.rank,
    rating: user.rating
  };
}

export async function fetchCodeforcesProfilePage(handle: string): Promise<string> {
  // Scrape the profile page to get additional info like bio/description
  const res = await fetch(`https://codeforces.com/profile/${handle}`);
  if (!res.ok) throw new Error('Profile not found');
  
  const html = await res.text();
  const $ = load(html);
  
  // Look for user info in the profile page
  // Codeforces profile structure may vary, so we'll look for common elements
  const userInfo = $('.userbox .info').text() || $('.profile-info').text() || $('.user-info').text();
  return userInfo;
}

export async function verifyCodeforcesProfile(
  handle: string,
  userId: string
): Promise<{ verified: boolean; reason?: string }> {
  const record = await prisma.userVerification.findFirst({
    where: { handle, platform: 'codeforces' },
  });

  if (!record) return { verified: false, reason: 'No code generated for this handle' };

  try {
    // First verify the user exists via API
    const userInfo = await fetchCodeforcesProfileInfo(handle);
    
    if (userInfo["organization"] === record.code) {
      await prisma.userVerification.update({
        where: { id: record.id },
        data: { verified: true },
      });
      // Update the user's codeforcesHandle
      await prisma.user.update({
        where: { id: userId },
        data: { codeforcesHandle: handle },
      });
      return { verified: true };
    } else {
      return { verified: false, reason: 'Code not found in profile. Please add the verification code to your Codeforces profile information.' };
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { verified: false, reason: message };
  }
} 