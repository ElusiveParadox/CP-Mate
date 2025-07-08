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