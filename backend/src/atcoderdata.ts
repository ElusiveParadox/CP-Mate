import { prisma } from './db';
import { load as cheerioLoad } from 'cheerio';

// Scrape AtCoder contest history from the user's history page
export async function fetchAndStoreAtcoderSubmissions(userHandle: string, userId: string) {
  const url = `https://atcoder.jp/users/${userHandle}/history`;
  console.log(url,"url")
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
      'Accept': 'text/html',
      'Referer': `https://atcoder.jp/users/${userHandle}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch AtCoder history page');
  const html = await res.text();
  const $ = cheerioLoad(html);

  const rows = $('.table-default tbody tr');
  const storedContests = [];
  for (const row of rows.toArray()) {
    const columns = $(row).find('td');
    if (columns.length < 7) continue;
    const contestId = $(columns[1]).find('a').attr('href')?.split('/')?.[2] || null;
    const place = $(columns[2]).text().trim();
    const performance = $(columns[3]).text().trim();
    const oldRating = $(columns[4]).text().trim();
    const newRating = $(columns[5]).text().trim();
    const diff = $(columns[6]).text().trim();
    if (!contestId) continue;
    // Store as AtcoderProfile row (using contestId as problemId for uniqueness)
    const stored = await prisma.atcoderProfile.upsert({
      where: { userId_id: { userId, id: String(contestId.split('-').pop() || '0') } },
      update: {
        contestId,
        problemId: contestId, // Not a problem, but for uniqueness
        language: null,
        result: null,
        point: null,
        executionTime: null,
        codeLength: null,
        submittedAt: null,
      },
      create: {
        id: (contestId.split('-').pop() || '0'),
        userId,
        contestId,
        problemId: contestId,
        language: null,
        result: null,
        point: null,
        executionTime: null,
        codeLength: null,
        submittedAt: null,
      },
    });
    storedContests.push({
      contestId,
      place,
      performance,
      oldRating,
      newRating,
      diff,
    });
  }
  return storedContests;
} 