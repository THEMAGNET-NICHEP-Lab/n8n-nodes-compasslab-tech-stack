import type {
	ICredentialsDecrypted,
	ICredentialTestFunctions,
	INodeCredentialTestResult,
} from 'n8n-workflow';
import { API_MARKET_SLUG, API_TITLE, RAPIDAPI_HOST } from './config';
import { API_MARKET_STORE } from './transport';

/**
 * Both tests call a path that does not exist, so they never use the customer's quota.
 * The marketplace answers before reaching the API, and its answer tells a bad key from a good one.
 */

interface FullResponse {
	statusCode: number;
	body: { message?: string } | string | undefined;
}

async function probe(
	context: ICredentialTestFunctions,
	uri: string,
	headers: Record<string, string>,
): Promise<FullResponse> {
	return (await context.helpers.request({
		uri,
		method: 'GET',
		headers,
		json: true,
		simple: false,
		resolveWithFullResponse: true,
		timeout: 15000,
	})) as FullResponse;
}

export async function apiMarketTest(
	this: ICredentialTestFunctions,
	credential: ICredentialsDecrypted,
): Promise<INodeCredentialTestResult> {
	try {
		const response = await probe(this, `${API_MARKET_STORE}/${API_MARKET_SLUG}/__key-check__`, {
			'x-api-market-key': String(credential.data?.apiKey ?? ''),
		});
		const message =
			typeof response.body === 'object' && response.body ? String(response.body.message ?? '') : '';
		if (/invalid x-api-market-key|no x-api-market-key/i.test(message)) {
			return { status: 'Error', message: 'api.market did not accept this API key' };
		}
		if (/no active subscription/i.test(message)) {
			return {
				status: 'Error',
				message: `The key is valid, but it has no subscription to ${API_TITLE} yet. Subscribe on api.market (free plan available).`,
			};
		}
		return { status: 'OK', message: 'Connection successful' };
	} catch (error) {
		return { status: 'Error', message: `Could not reach api.market: ${(error as Error).message}` };
	}
}

export async function rapidApiTest(
	this: ICredentialTestFunctions,
	credential: ICredentialsDecrypted,
): Promise<INodeCredentialTestResult> {
	try {
		const response = await probe(this, `https://${RAPIDAPI_HOST}/__key-check__`, {
			'x-rapidapi-key': String(credential.data?.apiKey ?? ''),
		});
		// 404 "Endpoint does not exist": RapidAPI accepted the key for this API
		if (response.statusCode === 404) return { status: 'OK', message: 'Connection successful' };
		return {
			status: 'Error',
			message: `RapidAPI did not accept this key for ${API_TITLE}. Check the key and subscribe to ${API_TITLE} on RapidAPI (free plan available).`,
		};
	} catch (error) {
		return { status: 'Error', message: `Could not reach RapidAPI: ${(error as Error).message}` };
	}
}
