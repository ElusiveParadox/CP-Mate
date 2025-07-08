import { prisma } from './db';

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      handle: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      country: true,
      university: true,
      codeforcesHandle: true,
      leetcodeHandle: true,
      codechefHandle: true,
      atcoderHandle: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getUserByHandle(handle: string) {
  return prisma.user.findUnique({
    where: { handle },
    select: {
      id: true,
      handle: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      country: true,
      university: true,
      codeforcesHandle: true,
      leetcodeHandle: true,
      codechefHandle: true,
      atcoderHandle: true,
      createdAt: true,
      updatedAt: true,
    },
  });
} 