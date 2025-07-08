import { load } from 'cheerio';
import { prisma } from './db';

export async function generateVerificationCode(handle: string, platform: string = 'leetcode'): Promise<string> {
	const code = Math.random().toString(36).substring(2, 10).toUpperCase();
	
	const existingRecord = await prisma.userVerification.findFirst({
		where: { 
			handle, 
			platform 
		},
	});
	
	if (existingRecord) {
		await prisma.userVerification.update({
			where: { id: existingRecord.id },
			data: { 
				code, 
				verified: false 
			},
		});
	} else {
		await prisma.userVerification.create({
			data: { 
				handle, 
				platform, 
				code, 
				verified: false 
			},
		});
	}
	
	return code;
}

export async function fetchLeetCodeProfileSummary(handle: string): Promise<string> {
    const body = {
      operationName: 'getUserProfile',
      variables: { username: handle },
      query: `
        query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            profile { aboutMe }
          }
        }
      `,
    };
  
    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Pretend to be a real browser → avoids Cloudflare 403
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Origin':  'https://leetcode.com',
        'Referer': 'https://leetcode.com',
      },
      body: JSON.stringify(body),
    });
  
    if (!res.ok) throw new Error(`LeetCode GraphQL ${res.status}`);
  
    const json = await res.json();

    //@ts-ignore
    const summary: string | null = json?.data?.matchedUser?.profile?.aboutMe ?? null;
  
    if (summary === null) throw new Error('Profile not found');
  
    return summary;
  }
  

export async function verifyLeetCodeProfile(handle: string, userId?: string): Promise<{ verified: boolean; reason?: string }> {
	const record = await prisma.userVerification.findFirst({
		where: { handle, platform: 'leetcode' },
	});
	
	if (!record) return { verified: false, reason: 'No code generated for this handle' };
	
	const summary = await fetchLeetCodeProfileSummary(handle);
	
	if (summary.includes(record.code)) {
		await prisma.userVerification.update({
			where: { id: record.id },
			data: { verified: true },
		});
		return { verified: true };
	} else {
		return { verified: false, reason: 'Code not found in profile summary' };
	}
}