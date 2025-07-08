import { prisma } from './db';

export async function fetchAndStoreCodeforcesProfile(userHandle: string, userId: string) {
  const userInfoRes = await fetch(`https://codeforces.com/api/user.info?handles=${userHandle}`);
  if (!userInfoRes.ok) throw new Error('Failed to fetch Codeforces user info');
  const userInfoJson = (await userInfoRes.json()) as any;
  if (userInfoJson.status !== 'OK') throw new Error(userInfoJson.comment || 'User not found');
  const user = userInfoJson.result[0];

  const statusRes = await fetch(`https://codeforces.com/api/user.status?handle=${userHandle}`);
  if (!statusRes.ok) throw new Error('Failed to fetch Codeforces user status');
  const statusJson = (await statusRes.json()) as any;
  if (statusJson.status !== 'OK') throw new Error(statusJson.comment || 'User status not found');
  const submissions = statusJson.result;

  const profile = await prisma.codeforcesProfile.upsert({
    where: { userId },
    update: {
      handle: userHandle,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      country: user.country,
      city: user.city,
      organization: user.organization,
      contribution: user.contribution,
      rank: user.rank,
      maxRank: user.maxRank,
      rating: user.rating,
      maxRating: user.maxRating,
      friendOfCount: user.friendOfCount,
      registrationTimeSeconds: user.registrationTimeSeconds,
      submissions: submissions,
    },
    create: {
      userId,
      handle: userHandle,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      country: user.country,
      city: user.city,
      organization: user.organization,
      contribution: user.contribution,
      rank: user.rank,
      maxRank: user.maxRank,
      rating: user.rating,
      maxRating: user.maxRating,
      friendOfCount: user.friendOfCount,
      registrationTimeSeconds: user.registrationTimeSeconds,
      submissions: submissions,
    },
  });

  return { profile, submissions };
}