/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { generateVerificationCode, verifyLeetCodeProfile } from './leetcodeVerify';
import { generateVerificationCode as generateCodeforcesCode, verifyCodeforcesProfile } from './codeforcesVerify';
import { generateVerificationCode as generateAtcoderCode, verifyAtcoderProfile } from './atcoderVerify';
import { generateVerificationCode as generateCodechefCode, verifyCodechefProfile } from './codechefVerify';
import { fetchLeetCodeData } from './leetcodeData';
import { verifyToken } from '@clerk/backend';
import { prisma } from './db';
import { getUserById } from './user';
import { fetchAndStoreCodeforcesProfile } from './codeforcesData';
import { fetchAndStoreAtcoderSubmissions } from './atcoderdata';

interface LeetCodeVerifyRequest {
  handle: string;
  action?: 'generate' | 'verify';
}

interface CodeforcesVerifyRequest {
  handle: string;
  action?: 'generate' | 'verify';
}

interface AtcoderVerifyRequest {
  handle: string;
  action?: 'generate' | 'verify';
}

interface CodechefVerifyRequest {
  handle: string;
  action?: 'generate' | 'verify';
}

interface AuthenticatedUser {
  id: string;
  handle: string;
  email: string;
}

interface Env {
  CLERK_PUBLISHABLE_KEY: string;
  CLERK_SECRET_KEY: string;
  CLERK_JWT_VERIFICATION_KEY: string;
}

// Helper functions
function getSessionToken(req: Request): string | null {
  const auth = req.headers.get('authorization') || '';
  const bearer = auth.match(/^Bearer\s+(.+)$/i);
  if (bearer) return bearer[1];

  const cookieString = req.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieString.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, decodeURIComponent(v.join('='))];
    }),
  );

  return cookies['__session'] || cookies['__clerk_session'] || null;
}

export function getSessionIdFromJwt(jwt: string): string {
  const parts = jwt.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');

  const base64url = parts[1];
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(base64url.length + (4 - (base64url.length % 4)) % 4, '=');

  const json = atob(base64);
  const payload = JSON.parse(json);

  const sid = payload.sid;
  if (typeof sid !== 'string') throw new Error('sid claim missing in JWT');

  return sid;
}

async function authenticateUser(request: Request, env: Env): Promise<AuthenticatedUser | null> {
  const sessionToken = getSessionToken(request);
  if (!sessionToken) return null;

  try {
    const payload = await verifyToken(sessionToken, {
      secretKey: env.CLERK_SECRET_KEY,
    });

    const clerkUserId = payload.sub;

    const user = await prisma.user.findUnique({
      where: { id: clerkUserId },
      select: { id: true, handle: true, email: true },
    });

    return user || null;
  } catch (error) {
    console.error('Clerk backend verification failed:', error);
    return null;
  }
}

async function withAuth<T>(
  request: Request,
  env: Env,
  handler: (request: Request, user: AuthenticatedUser, env: Env) => Promise<T>
): Promise<Response> {
  const user = await authenticateUser(request, env);
  if (!user) {
    return withCORSHeaders(new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' }
      }
    ));
  }

  try {
    const result = await handler(request, user, env);
    return withCORSHeaders(result as Response);
  } catch (error) {
    console.error('Handler error:', error);
    return withCORSHeaders(new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      }
    ));
  }
}

// LeetCode Handlers
async function handleLeetCodeGenerate(request: Request, user: AuthenticatedUser, env: Env): Promise<Response> {
  const { handle } = (await request.json()) as LeetCodeVerifyRequest;
  if (!handle) return new Response(JSON.stringify({ error: 'Missing handle' }), { status: 400 });
  
  const code = await generateVerificationCode(handle, 'leetcode');
  return new Response(JSON.stringify({ code }), { headers: { 'Content-Type': 'application/json' } });
}

async function handleLeetCodeStatus(request: Request, user: AuthenticatedUser, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const handle = url.searchParams.get('handle');
  if (!handle) return new Response(JSON.stringify({ error: 'Missing handle' }), { status: 400 });
  
  const record = await prisma.userVerification.findFirst({
    where: { handle, platform: 'leetcode' },
  });
  if (!record) return new Response(JSON.stringify({ status: 'not_found' }), { headers: { 'Content-Type': 'application/json' } });
  
  return new Response(JSON.stringify({ status: record.verified ? 'verified' : 'pending', code: record.code }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleLeetCodeVerify(request: Request, user: AuthenticatedUser, env: Env): Promise<Response> {
  const { handle } = (await request.json()) as LeetCodeVerifyRequest;
  if (!handle) return new Response(JSON.stringify({ error: 'Missing handle' }), { status: 400 });

  const result = await verifyLeetCodeProfile(handle, user.id);
  if (result.verified) {
    try {
      // Update user's leetcodeHandle if not already set
      await prisma.user.update({
        where: { id: user.id },
        data: { leetcodeHandle: handle },
      });
      const data = await fetchLeetCodeData(handle);
      const leetcodeProfile = await prisma.leetCodeProfile.upsert({
        where: { userId: user.id },
        update: {
          username: data.username,
          avatar: data.avatar,
          realName: data.realName,
          ranking: data.ranking,
          reputation: data.reputation,
          acSubmissionNum: data.acSubmissionNum,
          totalSubmissionNum: data.totalSubmissionNum,
          attendedContestsCount: data.attendedContestsCount,
          rating: data.rating,
          globalRanking: data.globalRanking,
          topPercentage: data.topPercentage,
          recentAcSubmissions: data.recentAcSubmissions,
        },
        create: {
          userId: user.id,
          username: data.username,
          avatar: data.avatar,
          realName: data.realName,
          ranking: data.ranking,
          reputation: data.reputation,
          acSubmissionNum: data.acSubmissionNum,
          totalSubmissionNum: data.totalSubmissionNum,
          attendedContestsCount: data.attendedContestsCount,
          rating: data.rating,
          globalRanking: data.globalRanking,
          topPercentage: data.topPercentage,
          recentAcSubmissions: data.recentAcSubmissions,
        },
      });
      return new Response(JSON.stringify({ verified: true, profile: leetcodeProfile }), { 
        headers: { 'Content-Type': 'application/json' } 
      });
    } catch (e) {
      console.error('Failed to fetch LeetCode data:', e);
      return new Response(JSON.stringify({ verified: true }), { 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
  } else {
    return new Response(JSON.stringify({ verified: false, reason: result.reason }), { 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}

async function handleLeetCodeData(request: Request, user: AuthenticatedUser, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const handle = url.searchParams.get('handle');
  if (!handle) return new Response(JSON.stringify({ error: 'Missing handle' }), { status: 400 });
  
  try {
    const data = await fetchLeetCodeData(handle);
    const leetcodeProfile = await prisma.leetCodeProfile.upsert({
      where: { userId: user.id },
      update: {
        username: data.username,
        avatar: data.avatar,
        realName: data.realName,
        ranking: data.ranking,
        reputation: data.reputation,
        acSubmissionNum: data.acSubmissionNum,
        totalSubmissionNum: data.totalSubmissionNum,
        attendedContestsCount: data.attendedContestsCount,
        rating: data.rating,
        globalRanking: data.globalRanking,
        topPercentage: data.topPercentage,
        recentAcSubmissions: data.recentAcSubmissions,
      },
      create: {
        userId: user.id,
        username: data.username,
        avatar: data.avatar,
        realName: data.realName,
        ranking: data.ranking,
        reputation: data.reputation,
        acSubmissionNum: data.acSubmissionNum,
        totalSubmissionNum: data.totalSubmissionNum,
        attendedContestsCount: data.attendedContestsCount,
        rating: data.rating,
        globalRanking: data.globalRanking,
        topPercentage: data.topPercentage,
        recentAcSubmissions: data.recentAcSubmissions,
      },
    });
    return new Response(JSON.stringify(leetcodeProfile), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}

// Codeforces Handlers (keep existing implementations)
async function handleCodeforcesGenerate(request: Request, user: AuthenticatedUser, env: Env): Promise<Response> {
  const { handle } = (await request.json()) as CodeforcesVerifyRequest;
  if (!handle) return new Response(JSON.stringify({ error: 'Missing handle' }), { status: 400 });
  
  const code = await generateCodeforcesCode(handle, 'codeforces');
  return new Response(JSON.stringify({ code }), { headers: { 'Content-Type': 'application/json' } });
}

async function handleCodeforcesStatus(request: Request, user: AuthenticatedUser, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const handle = url.searchParams.get('handle');
  if (!handle) return new Response(JSON.stringify({ error: 'Missing handle' }), { status: 400 });
  
  const record = await prisma.userVerification.findFirst({
    where: { handle, platform: 'codeforces' },
  });
  if (!record) return new Response(JSON.stringify({ status: 'not_found' }), { headers: { 'Content-Type': 'application/json' } });
  
  return new Response(JSON.stringify({ status: record.verified ? 'verified' : 'pending', code: record.code }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleCodeforcesVerify(request: Request, user: AuthenticatedUser, env: Env): Promise<Response> {
  const { handle } = (await request.json()) as CodeforcesVerifyRequest;
  if (!handle) return new Response(JSON.stringify({ error: 'Missing handle' }), { status: 400 });

  const result = await verifyCodeforcesProfile(handle, user.id);
  if (result.verified) {
    try {
      const { profile, submissions } = await fetchAndStoreCodeforcesProfile(handle, user.id);
      return new Response(JSON.stringify({ verified: true, profile, submissions }), { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {}
    return new Response(JSON.stringify({ verified: true }), { headers: { 'Content-Type': 'application/json' } });
  } else {
    return new Response(JSON.stringify({ verified: false, reason: result.reason }), { headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleCodeforcesData(request: Request, user: AuthenticatedUser, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const handle = url.searchParams.get('handle');
  if (!handle) return new Response(JSON.stringify({ error: 'Missing handle' }), { status: 400 });

  try {
    const { profile, submissions } = await fetchAndStoreCodeforcesProfile(handle, user.id);
    return new Response(JSON.stringify({ profile, submissions }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}

// AtCoder Handlers (keep existing implementations)
async function handleAtcoderGenerate(request: Request, user: AuthenticatedUser, env: Env): Promise<Response> {
  const { handle } = (await request.json()) as AtcoderVerifyRequest;
  if (!handle) return new Response(JSON.stringify({ error: 'Missing handle' }), { status: 400 });
  
  const code = await generateAtcoderCode(handle, 'atcoder');
  return new Response(JSON.stringify({ code }), { headers: { 'Content-Type': 'application/json' } });
}

async function handleAtcoderStatus(request: Request, user: AuthenticatedUser, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const handle = url.searchParams.get('handle');
  if (!handle) return new Response(JSON.stringify({ error: 'Missing handle' }), { status: 400 });
  
  const record = await prisma.userVerification.findFirst({
    where: { handle, platform: 'atcoder' },
  });
  if (!record) return new Response(JSON.stringify({ status: 'not_found' }), { headers: { 'Content-Type': 'application/json' } });
  
  return new Response(JSON.stringify({ status: record.verified ? 'verified' : 'pending', code: record.code }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleAtcoderVerify(request: Request, user: AuthenticatedUser, env: Env): Promise<Response> {
  const { handle } = (await request.json()) as AtcoderVerifyRequest;
  if (!handle) return new Response(JSON.stringify({ error: 'Missing handle' }), { status: 400 });
  const result = await verifyAtcoderProfile(handle, user.id);
  if (result.verified) {
    try {
      const submissions = await fetchAndStoreAtcoderSubmissions(handle, user.id);
      return new Response(JSON.stringify({ verified: true, submissions }), { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
		console.error(e)
	}
    return new Response(JSON.stringify({ verified: true }), { headers: { 'Content-Type': 'application/json' } });
  } else {
    return new Response(JSON.stringify({ verified: false, reason: result.reason }), { headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleAtcoderData(request: Request, user: AuthenticatedUser, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const handle = url.searchParams.get('handle');
  if (!handle) return new Response(JSON.stringify({ error: 'Missing handle' }), { status: 400 });

  try {
    const submissions = await fetchAndStoreAtcoderSubmissions(handle, user.id);
    return new Response(JSON.stringify({ submissions }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}

// Codechef Handlers (keep existing implementations)
async function handleCodechefGenerate(request: Request, user: AuthenticatedUser, env: Env): Promise<Response> {
  const { handle } = (await request.json()) as CodechefVerifyRequest;
  if (!handle) return new Response(JSON.stringify({ error: 'Missing handle' }), { status: 400 });
  
  const code = await generateCodechefCode(handle, 'codechef');
  return new Response(JSON.stringify({ code }), { headers: { 'Content-Type': 'application/json' } });
}

async function handleCodechefStatus(request: Request, user: AuthenticatedUser, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const handle = url.searchParams.get('handle');
  if (!handle) return new Response(JSON.stringify({ error: 'Missing handle' }), { status: 400 });
  
  const record = await prisma.userVerification.findFirst({
    where: { handle, platform: 'codechef' },
  });
  if (!record) return new Response(JSON.stringify({ status: 'not_found' }), { headers: { 'Content-Type': 'application/json' } });
  
  return new Response(JSON.stringify({ status: record.verified ? 'verified' : 'pending', code: record.code }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleCodechefVerify(request: Request, user: AuthenticatedUser, env: Env): Promise<Response> {
  const { handle } = (await request.json()) as CodechefVerifyRequest;
  if (!handle) return new Response(JSON.stringify({ error: 'Missing handle' }), { status: 400 });

  const result = await verifyCodechefProfile(handle, user.id);
  if (result.verified) {
    try {
      const { fetchAndStoreCodechefProfile } = await import('./codechefVerify');
      const profile = await fetchAndStoreCodechefProfile(handle, user.id);
      return new Response(JSON.stringify({ verified: true, profile }), { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {}
    return new Response(JSON.stringify({ verified: true }), { headers: { 'Content-Type': 'application/json' } });
  } else {
    return new Response(JSON.stringify({ verified: false, reason: result.reason }), { headers: { 'Content-Type': 'application/json' } });
  }
}

// User Data Handler
async function handleGetUser(request: Request, user: AuthenticatedUser, env: Env): Promise<Response> {
  const userData = await getUserById(user.id);
  if (!userData) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }
  return new Response(JSON.stringify(userData), { headers: { 'Content-Type': 'application/json' } });
}

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

function withCORSHeaders(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  Object.entries(CORS_HEADERS).forEach(([k, v]) => newHeaders.set(k, v));
  return new Response(response.body, { ...response, headers: newHeaders });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight requests globally
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: CORS_HEADERS });
    }

    // LeetCode routes
    if (url.pathname === '/api/leetcode-verify/generate' && request.method === 'POST') {
      return await withAuth(request, env, handleLeetCodeGenerate);
    }
    if (url.pathname === '/api/leetcode-verify/status' && request.method === 'GET') {
      return await withAuth(request, env, handleLeetCodeStatus);
    }
    if (url.pathname === '/api/leetcode-verify' && request.method === 'POST') {
      return await withAuth(request, env, handleLeetCodeVerify);
    }
    if (url.pathname === '/api/leetcode-data' && request.method === 'GET') {
      return await withAuth(request, env, handleLeetCodeData);
    }

    // Codeforces routes
    if (url.pathname === '/api/codeforces-verify/generate' && request.method === 'POST') {
      return await withAuth(request, env, handleCodeforcesGenerate);
    }
    if (url.pathname === '/api/codeforces-verify/status' && request.method === 'GET') {
      return await withAuth(request, env, handleCodeforcesStatus);
    }
    if (url.pathname === '/api/codeforces-verify' && request.method === 'POST') {
      return await withAuth(request, env, handleCodeforcesVerify);
    }
    if (url.pathname === '/api/codeforces-data' && request.method === 'GET') {
      return await withAuth(request, env, handleCodeforcesData);
    }

    // AtCoder routes
    if (url.pathname === '/api/atcoder-verify/generate' && request.method === 'POST') {
      return await withAuth(request, env, handleAtcoderGenerate);
    }
    if (url.pathname === '/api/atcoder-verify/status' && request.method === 'GET') {
      return await withAuth(request, env, handleAtcoderStatus);
    }
    if (url.pathname === '/api/atcoder-verify' && request.method === 'POST') {
      return await withAuth(request, env, handleAtcoderVerify);
    }
    if (url.pathname === '/api/atcoder-data' && request.method === 'GET') {
      return await withAuth(request, env, handleAtcoderData);
    }

    // Codechef routes
    if (url.pathname === '/api/codechef-verify/generate' && request.method === 'POST') {
      return await withAuth(request, env, handleCodechefGenerate);
    }
    if (url.pathname === '/api/codechef-verify/status' && request.method === 'GET') {
      return await withAuth(request, env, handleCodechefStatus);
    }
    if (url.pathname === '/api/codechef-verify' && request.method === 'POST') {
      return await withAuth(request, env, handleCodechefVerify);
    }

    // User route
    if (url.pathname === '/api/user' && request.method === 'GET') {
      return await withAuth(request, env, handleGetUser);
    }

    return withCORSHeaders(new Response('Not found', { status: 404 }));
  },
} satisfies ExportedHandler<Env>;