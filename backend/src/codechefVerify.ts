import { load } from 'cheerio';
import { prisma } from './db';

export async function generateVerificationCode(
  handle: string,
  platform: string = 'codechef'
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

export async function fetchCodechefProfileName(handle: string): Promise<string> {
  const res = await fetch(`https://www.codechef.com/users/${handle}`);
  if (!res.ok) throw new Error('Profile not found');
  const html = await res.text();
  const $ = load(html);
  const name = $('.h2-style').first().text();
  return name;
}

export async function fetchAndStoreCodechefProfile(userHandle: string, userId: string) {
  const url = `https://www.codechef.com/users/${userHandle}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
      'Accept': 'text/html',
      'Referer': `https://www.codechef.com/users/${userHandle}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch Codechef profile page');
  const html = await res.text();
  const $ = load(html);

  const avatarUrl = $('.user-details-container img').attr('src') || null;
  const country = $('.user-country-name').text().trim() || null;
  const institution = $('.user-institution-name').text().trim() || null;
  const rank = parseInt($('.rating-ranks .global .rank').text().replace(/[^0-9]/g, '')) || null;
  const rating = parseInt($('.rating-number').first().text().trim()) || null;
  const highestRating = parseInt($('.rating-header small').text().replace(/[^0-9]/g, '')) || null;
  const stars = $('.user-profile-left .rating-star').length || null;
  let fullySolved = null;
  let partiallySolved = null;
  $('.problems-solved .content h5').each((_, el) => {
    const label = $(el).text().toLowerCase();
    const value = parseInt($(el).next('span').text().replace(/[^0-9]/g, ''));
    if (label.includes('fully')) fullySolved = value;
    if (label.includes('partially')) partiallySolved = value;
  });

  let contestHistory = null;
  let recentSubmissions = null;

  try {
    const activityRes = await fetch(`https://www.codechef.com/recent/user?user_handle=${userHandle}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json',
        'Referer': url,
      },
    });
    if (activityRes.ok) {
      const activityJson = await activityRes.json() as any;
      const content = activityJson.content || '';
      const $activity = load(content);
      const recent: { time: string; problem: string; result: string; lang: string; solution: string }[] = [];
      $activity('table tbody tr').each((_, row) => {
        const cols = $activity(row).find('td');
        recent.push({
          time: $activity(cols[0]).text().trim(),
          problem: $activity(cols[1]).text().trim(),
          result: $activity(cols[2]).text().trim(),
          lang: $activity(cols[3]).text().trim(),
          solution: $activity(cols[4]).find('a').attr('href') ? `https://www.codechef.com${$activity(cols[4]).find('a').attr('href')}` : '',
        });
      });
      recentSubmissions = recent;
    }
  } catch (err) {
    // If recent activity fetch fails, just skip it
  }

  const profile = await prisma.codechefProfile.upsert({
    where: { userId },
    update: {
      username: userHandle,
      avatarUrl,
      country,
      institution,
      rank,
      rating,
      highestRating,
      stars,
      fullySolved,
      partiallySolved,
      contestHistory,
      recentSubmissions,
    },
    create: {
      userId,
      username: userHandle,
      avatarUrl,
      country,
      institution,
      rank,
      rating,
      highestRating,
      stars,
      fullySolved,
      partiallySolved,
      contestHistory,
      recentSubmissions,
    },
  });
  return profile;
}

export async function verifyCodechefProfile(
  handle: string,
  userId: string
): Promise<{ verified: boolean; reason?: string }> {
  const record = await prisma.userVerification.findFirst({
    where: { handle, platform: 'codechef' },
  });

  if (!record) return { verified: false, reason: 'No code generated for this handle' };

  try {
    const name = await fetchCodechefProfileName(handle);
    if (name.includes(record.code)) {
      await prisma.userVerification.update({
        where: { id: record.id },
        data: { verified: true },
      });
      // Update the user's codechefHandle
      await prisma.user.update({
        where: { id: userId },
        data: { codechefHandle: handle },
      });
      return { verified: true };
    } else {
      return { verified: false, reason: 'Code not found in profile name. Please add the verification code to your Codechef profile name.' };
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { verified: false, reason: message };
  }
} 