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

// import { parse } from 'node-html-parser'; // Not used, remove
import { generateVerificationCode, verifyLeetCodeProfile } from './leetcodeVerify';
import { generateVerificationCode as generateCodeforcesCode, verifyCodeforcesProfile } from './codeforcesVerify';
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

interface LeetCodeVerifyRequest {
	handle: string;
	action?: 'generate' | 'verify';
}

interface CodeforcesVerifyRequest {
	handle: string;
	action?: 'generate' | 'verify';
}

const prisma = new PrismaClient().$extends(withAccelerate())

// LeetCode handlers
async function handleLeetCodeGenerate(request: Request): Promise<Response> {
	const { handle } = (await request.json()) as LeetCodeVerifyRequest;
	if (!handle) return new Response(JSON.stringify({ error: 'Missing handle' }), { status: 400 });
	const code = await generateVerificationCode(handle, 'leetcode');
	return new Response(JSON.stringify({ code }), { headers: { 'Content-Type': 'application/json' } });
}

async function handleLeetCodeStatus(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const handle = url.searchParams.get('handle');
	if (!handle) return new Response(JSON.stringify({ error: 'Missing handle' }), { status: 400 });
	const record = await prisma.userVerification.findFirst({
		where: { handle, platform: 'leetcode' },
	});
	if (!record) return new Response(JSON.stringify({ status: 'not_found' }), { headers: { 'Content-Type': 'application/json' } });
	return new Response(JSON.stringify({ status: record.verified ? 'verified' : 'pending', code: record.code }), { headers: { 'Content-Type': 'application/json' } });
}

async function handleLeetCodeVerify(request: Request): Promise<Response> {
	const { handle } = (await request.json()) as LeetCodeVerifyRequest;
	if (!handle) return new Response(JSON.stringify({ error: 'Missing handle' }), { status: 400 });
	const result = await verifyLeetCodeProfile(handle);
	if (result.verified) {
		return new Response(JSON.stringify({ verified: true }), { headers: { 'Content-Type': 'application/json' } });
	} else {
		return new Response(JSON.stringify({ verified: false, reason: result.reason }), { headers: { 'Content-Type': 'application/json' } });
	}
}

// Codeforces handlers
async function handleCodeforcesGenerate(request: Request): Promise<Response> {
	const { handle } = (await request.json()) as CodeforcesVerifyRequest;
	if (!handle) return new Response(JSON.stringify({ error: 'Missing handle' }), { status: 400 });
	const code = await generateCodeforcesCode(handle, 'codeforces');
	return new Response(JSON.stringify({ code }), { headers: { 'Content-Type': 'application/json' } });
}

async function handleCodeforcesStatus(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const handle = url.searchParams.get('handle');
	if (!handle) return new Response(JSON.stringify({ error: 'Missing handle' }), { status: 400 });
	const record = await prisma.userVerification.findFirst({
		where: { handle, platform: 'codeforces' },
	});
	if (!record) return new Response(JSON.stringify({ status: 'not_found' }), { headers: { 'Content-Type': 'application/json' } });
	return new Response(JSON.stringify({ status: record.verified ? 'verified' : 'pending', code: record.code }), { headers: { 'Content-Type': 'application/json' } });
}

async function handleCodeforcesVerify(request: Request): Promise<Response> {
	const { handle } = (await request.json()) as CodeforcesVerifyRequest;
	if (!handle) return new Response(JSON.stringify({ error: 'Missing handle' }), { status: 400 });
	const result = await verifyCodeforcesProfile(handle);
	if (result.verified) {
		return new Response(JSON.stringify({ verified: true }), { headers: { 'Content-Type': 'application/json' } });
	} else {
		return new Response(JSON.stringify({ verified: false, reason: result.reason }), { headers: { 'Content-Type': 'application/json' } });
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		
		if (url.pathname === '/api/leetcode-verify/generate' && request.method === 'POST') {
			return await handleLeetCodeGenerate(request);
		}
		if (url.pathname === '/api/leetcode-verify/status' && request.method === 'GET') {
			return await handleLeetCodeStatus(request);
		}
		if (url.pathname === '/api/leetcode-verify' && request.method === 'POST') {
			return await handleLeetCodeVerify(request);
		}
		
		if (url.pathname === '/api/codeforces-verify/generate' && request.method === 'POST') {
			return await handleCodeforcesGenerate(request);
		}
		if (url.pathname === '/api/codeforces-verify/status' && request.method === 'GET') {
			return await handleCodeforcesStatus(request);
		}
		if (url.pathname === '/api/codeforces-verify' && request.method === 'POST') {
			return await handleCodeforcesVerify(request);
		}
		
		return new Response('Hello World!');
	},
} satisfies ExportedHandler<Env>;