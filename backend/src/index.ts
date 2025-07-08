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
	id: string; // This will be the Clerk user ID
	handle: string;
	email: string;
}

// Environment variables interface
interface Env {
	CLERK_PUBLISHABLE_KEY: string;
	CLERK_SECRET_KEY: string;
	CLERK_JWT_VERIFICATION_KEY: string; // Your Clerk public key for JWT verification
	// Add other environment variables as needed
}

function getSessionToken(req: Request): string | null {
	// 1) look for Bearer header first (most explicit)
	const auth = req.headers.get('authorization') || '';
	const bearer = auth.match(/^Bearer\s+(.+)$/i);
	if (bearer) return bearer[1];
  
	// 2) otherwise parse cookies
	const cookieString = req.headers.get('cookie') || '';
	const cookies = Object.fromEntries(
	  cookieString.split(';').map(c => {
		const [k, ...v] = c.trim().split('=');
		return [k, decodeURIComponent(v.join('='))];
	  }),
	);
  
	// Clerk may use either cookie name depending on config
	return cookies['__session'] || cookies['__clerk_session'] || null;
  }

  export function getSessionIdFromJwt(jwt: string): string {
	const parts = jwt.split('.');
	if (parts.length !== 3) throw new Error('Invalid JWT format');
  
	// JWT payload is the 2nd part (base64url‑encoded)
	const base64url = parts[1];
  
	// Convert base64url -> base64
	const base64 = base64url
	  .replace(/-/g, '+')
	  .replace(/_/g, '/')
	  .padEnd(base64url.length + (4 - (base64url.length % 4)) % 4, '=');
  
	// Decode JSON payload
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
	  // Use Clerk's backend SDK for networkless verification
	  const payload = await verifyToken(sessionToken, {
		secretKey: env.CLERK_SECRET_KEY,
	  });
  
	  const clerkUserId = payload.sub;
  
	  // Get user from your database
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

// LeetCode handlers
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
		await prisma.user.update({
			where: { id: user.id },
			data: { leetcodeHandle: handle },
		});
		return new Response(JSON.stringify({ verified: true }), { headers: { 'Content-Type': 'application/json' } });
	} else {
		return new Response(JSON.stringify({ verified: false, reason: result.reason }), { headers: { 'Content-Type': 'application/json' } });
	}
}

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
		return new Response(JSON.stringify({ verified: true }), { headers: { 'Content-Type': 'application/json' } });
	} else {
		return new Response(JSON.stringify({ verified: false, reason: result.reason }), { headers: { 'Content-Type': 'application/json' } });
	}
}

// AtCoder handlers
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
		return new Response(JSON.stringify({ verified: true }), { headers: { 'Content-Type': 'application/json' } });
	} else {
		return new Response(JSON.stringify({ verified: false, reason: result.reason }), { headers: { 'Content-Type': 'application/json' } });
	}
}

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
		return new Response(JSON.stringify({ verified: true }), { headers: { 'Content-Type': 'application/json' } });
	} else {
		return new Response(JSON.stringify({ verified: false, reason: result.reason }), { headers: { 'Content-Type': 'application/json' } });
	}
}

async function handleLeetCodeData(request: Request, user: AuthenticatedUser, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const handle = url.searchParams.get('handle');
	if (!handle) return new Response(JSON.stringify({ error: 'Missing handle' }), { status: 400 });
	
	try {
		const data = await fetchLeetCodeData(handle);
		const userRecord = await prisma.user.findFirst({ where: { leetcodeHandle: handle } });
		if (!userRecord) {
			return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
		}
		
		// Optional: Check if the authenticated user has permission to access this data
		// if (user.id !== userRecord.id) {
		//     return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
		// }
		
		const leetcodeProfile = await prisma.leetCodeProfile.upsert({
			where: { userId: userRecord.id },
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
				userId: userRecord.id,
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

// User data handler
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

		// Apply authentication to all protected routes
		if (url.pathname === '/api/leetcode-verify/generate' && request.method === 'POST') {
			return await withAuth(request, env, handleLeetCodeGenerate);
		}
		if (url.pathname === '/api/leetcode-verify/status' && request.method === 'GET') {
			return await withAuth(request, env, handleLeetCodeStatus);
		}
		if (url.pathname === '/api/leetcode-verify' && request.method === 'POST') {
			return await withAuth(request, env, handleLeetCodeVerify);
		}

		if (url.pathname === '/api/codeforces-verify/generate' && request.method === 'POST') {
			return await withAuth(request, env, handleCodeforcesGenerate);
		}
		if (url.pathname === '/api/codeforces-verify/status' && request.method === 'GET') {
			return await withAuth(request, env, handleCodeforcesStatus);
		}
		if (url.pathname === '/api/codeforces-verify' && request.method === 'POST') {
			return await withAuth(request, env, handleCodeforcesVerify);
		}

		if (url.pathname === '/api/atcoder-verify/generate' && request.method === 'POST') {
			return await withAuth(request, env, handleAtcoderGenerate);
		}
		if (url.pathname === '/api/atcoder-verify/status' && request.method === 'GET') {
			return await withAuth(request, env, handleAtcoderStatus);
		}
		if (url.pathname === '/api/atcoder-verify' && request.method === 'POST') {
			return await withAuth(request, env, handleAtcoderVerify);
		}

		if (url.pathname === '/api/codechef-verify/generate' && request.method === 'POST') {
			return await withAuth(request, env, handleCodechefGenerate);
		}
		if (url.pathname === '/api/codechef-verify/status' && request.method === 'GET') {
			return await withAuth(request, env, handleCodechefStatus);
		}
		if (url.pathname === '/api/codechef-verify' && request.method === 'POST') {
			return await withAuth(request, env, handleCodechefVerify);
		}

		if (url.pathname === '/api/leetcode-data' && request.method === 'GET') {
			return await withAuth(request, env, handleLeetCodeData);
		}

		if (url.pathname === '/api/codeforces-data' && request.method === 'GET') {
			return await withAuth(request, env, handleCodeforcesData);
		}

		if (url.pathname === '/api/user' && request.method === 'GET') {
			return await withAuth(request, env, handleGetUser);
		}

		// Wrap all responses with CORS headers
		let response: Response;
		if (url.pathname === '/api/leetcode-verify/generate' && request.method === 'POST') {
			response = await withAuth(request, env, handleLeetCodeGenerate);
		} else if (url.pathname === '/api/leetcode-verify/status' && request.method === 'GET') {
			response = await withAuth(request, env, handleLeetCodeStatus);
		} else if (url.pathname === '/api/leetcode-verify' && request.method === 'POST') {
			response = await withAuth(request, env, handleLeetCodeVerify);
		} else if (url.pathname === '/api/codeforces-verify/generate' && request.method === 'POST') {
			response = await withAuth(request, env, handleCodeforcesGenerate);
		} else if (url.pathname === '/api/codeforces-verify/status' && request.method === 'GET') {
			response = await withAuth(request, env, handleCodeforcesStatus);
		} else if (url.pathname === '/api/codeforces-verify' && request.method === 'POST') {
			response = await withAuth(request, env, handleCodeforcesVerify);
		} else if (url.pathname === '/api/atcoder-verify/generate' && request.method === 'POST') {
			response = await withAuth(request, env, handleAtcoderGenerate);
		} else if (url.pathname === '/api/atcoder-verify/status' && request.method === 'GET') {
			response = await withAuth(request, env, handleAtcoderStatus);
		} else if (url.pathname === '/api/atcoder-verify' && request.method === 'POST') {
			response = await withAuth(request, env, handleAtcoderVerify);
		} else if (url.pathname === '/api/codechef-verify/generate' && request.method === 'POST') {
			response = await withAuth(request, env, handleCodechefGenerate);
		} else if (url.pathname === '/api/codechef-verify/status' && request.method === 'GET') {
			response = await withAuth(request, env, handleCodechefStatus);
		} else if (url.pathname === '/api/codechef-verify' && request.method === 'POST') {
			response = await withAuth(request, env, handleCodechefVerify);
		} else if (url.pathname === '/api/leetcode-data' && request.method === 'GET') {
			response = await withAuth(request, env, handleLeetCodeData);
		} else if (url.pathname === '/api/codeforces-data' && request.method === 'GET') {
			response = await withAuth(request, env, handleCodeforcesData);
		} else if (url.pathname === '/api/user' && request.method === 'GET') {
			response = await withAuth(request, env, handleGetUser);
		} else {
			response = new Response('Hello World!');
		}
		return withCORSHeaders(response);
	},
} satisfies ExportedHandler<Env>;