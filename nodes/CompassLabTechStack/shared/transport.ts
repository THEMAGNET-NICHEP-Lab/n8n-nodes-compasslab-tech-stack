import {
	NodeApiError,
	type IDataObject,
	type IExecuteSingleFunctions,
	type IHttpRequestOptions,
	type IN8nHttpFullResponse,
	type INodeExecutionData,
	type INodeProperties,
	type JsonObject,
} from 'n8n-workflow';
import { API_MARKET_SLUG, API_TITLE, RAPIDAPI_HOST } from './config';

export const API_MARKET_STORE = 'https://prod.api.market/api/v1/compasslab-1';

/**
 * Base URL of this API on the marketplace chosen in the node.
 * api.market: the store URL plus the product slug. RapidAPI: the API's own host.
 */
export const baseURL = `={{$parameter.authentication === "rapidApi" ? "https://${RAPIDAPI_HOST}" : "${API_MARKET_STORE}/${API_MARKET_SLUG}"}}`;

/** Sends an optional field only when it has a value (an empty string would fail validation). */
export const ifSet = '={{ $value === "" ? undefined : $value }}';

/** Splits a list typed by the user (one per line or comma-separated) into an array for batch endpoints. */
export function listExpression(parameter: string, separators = '[\\n,;]+'): string {
	// The pattern sits inside a string literal in the expression, so its backslashes are escaped once more
	const pattern = separators.replace(/\\/g, '\\\\');
	return `={{ String($parameter.${parameter}).split(new RegExp("${pattern}")).map(s => s.trim()).filter(s => s) }}`;
}

/**
 * Sends the request body as multipart/form-data, adding the file from the input item's binary
 * property when the node's Source is "binary". Built by hand so the package has no dependencies.
 */
export async function sendAsMultipart(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const boundary = `----CompassLabN8n${Date.now().toString(16)}`;
	const parts: Buffer[] = [];
	const fields = (requestOptions.body ?? {}) as IDataObject;
	for (const [name, value] of Object.entries(fields)) {
		if (value === undefined || value === null || value === '') continue;
		parts.push(
			Buffer.from(
				`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${String(value)}\r\n`,
			),
		);
	}
	if (this.getNodeParameter('source') === 'binary') {
		const property = this.getNodeParameter('binaryPropertyName') as string;
		const meta = this.helpers.assertBinaryData(property);
		const data = await this.helpers.getBinaryDataBuffer(property);
		const fileName = (meta.fileName ?? 'file').replace(/["\r\n]/g, '_');
		parts.push(
			Buffer.from(
				`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
					`Content-Type: ${meta.mimeType || 'application/octet-stream'}\r\n\r\n`,
			),
			data,
			Buffer.from('\r\n'),
		);
	}
	parts.push(Buffer.from(`--${boundary}--\r\n`));
	requestOptions.body = Buffer.concat(parts);
	requestOptions.headers = {
		...requestOptions.headers,
		'Content-Type': `multipart/form-data; boundary=${boundary}`,
	};
	return requestOptions;
}

/** Turns an image response (PNG or SVG) into n8n binary data, named after the operation. */
export async function imageToBinary(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const contentType = String(response.headers['content-type'] ?? 'image/png').split(';')[0];
	const extension = contentType.includes('svg') ? 'svg' : 'png';
	const operation = this.getNodeParameter('operation') as string;
	const name = operation === 'generateBarcode' ? 'barcode' : 'qr';
	const property = this.getNodeParameter('binaryPropertyOutput', 'data') as string;
	const binary = await this.helpers.prepareBinaryData(
		Buffer.from(response.body as Buffer),
		`${name}.${extension}`,
		contentType,
	);
	return items.map((item) => ({
		json: { fileName: `${name}.${extension}`, mimeType: contentType },
		binary: { ...item.binary, [property]: binary },
	}));
}

/** Parameters shared by the operations that accept a file: from a URL or from the input's binary data. */
export function fileSourceFields(
	show: { operation: string[] },
	urlField: { name: string; displayName: string; description: string; placeholder: string },
): INodeProperties[] {
	return [
		{
			displayName: 'Source',
			name: 'source',
			type: 'options',
			noDataExpression: true,
			options: [
				{ name: 'URL', value: 'url', description: 'A public http(s) link to the file' },
				{
					name: 'Binary File',
					value: 'binary',
					description:
						'A file from a previous node (for example an email attachment or a download)',
				},
			],
			default: 'url',
			displayOptions: { show },
		},
		{
			displayName: urlField.displayName,
			name: urlField.name,
			type: 'string',
			default: '',
			required: true,
			placeholder: urlField.placeholder,
			description: urlField.description,
			displayOptions: { show: { ...show, source: ['url'] } },
			routing: { send: { type: 'body', property: urlField.name } },
		},
		{
			displayName: 'Input Binary Field',
			name: 'binaryPropertyName',
			type: 'string',
			default: 'data',
			required: true,
			hint: 'The name of the input binary field containing the file',
			displayOptions: { show: { ...show, source: ['binary'] } },
		},
	];
}

const HINTS: Array<[RegExp, string]> = [
	[
		/no active subscription/i,
		`Subscribe to ${API_TITLE} on api.market first (it has a free plan).`,
	],
	[/not subscribed/i, `Subscribe to ${API_TITLE} on RapidAPI first (it has a free plan).`],
	[/invalid .*key|no x-api-market-key/i, `Check the API key in your ${API_TITLE} credential.`],
	[
		/too many requests|rate limit|quota/i,
		'You reached the rate limit or quota of your plan. Wait or upgrade your plan.',
	],
];

function parseBody(body: unknown): JsonObject {
	const text = Buffer.isBuffer(body) ? body.toString('utf8') : body;
	if (typeof text !== 'string') return (text && typeof text === 'object' ? text : {}) as JsonObject;
	try {
		const parsed: unknown = JSON.parse(text);
		return (parsed && typeof parsed === 'object' ? parsed : { message: text }) as JsonObject;
	} catch {
		return { message: text.slice(0, 500) };
	}
}

/** Readable reason from our API errors ({error, detail} or FastAPI's list) or the marketplace's {message}. */
function reason(body: JsonObject): string {
	const detail = body.detail;
	if (Array.isArray(detail)) {
		return detail
			.map((d) => {
				const item = d as JsonObject;
				const loc = Array.isArray(item.loc)
					? item.loc.filter((l) => l !== 'body' && l !== 'query').join('.')
					: '';
				return loc ? `${loc}: ${String(item.msg)}` : String(item.msg);
			})
			.join('; ');
	}
	if (typeof detail === 'string') return detail;
	if (typeof body.message === 'string') return body.message;
	if (typeof body.error === 'string') return body.error;
	return '';
}

/** Turns HTTP errors into n8n errors that show the API's own reason and, when known, how to fix it. */
export async function checkResponse(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	if (response.statusCode < 400) return items;
	const body = parseBody(response.body);
	const why = reason(body) || `HTTP ${response.statusCode}`;
	const hint = HINTS.find(([pattern]) => pattern.test(why))?.[1];
	throw new NodeApiError(this.getNode(), body, {
		message: why,
		description: hint,
		httpCode: String(response.statusCode),
	});
}

/** Adds checkResponse to every operation, so HTTP errors are reported with the API's own reason. */
export function withErrorHandling(properties: INodeProperties[]): INodeProperties[] {
	return properties.map((property) => {
		if (property.name !== 'operation' || !property.options) return property;
		return {
			...property,
			options: property.options.map((option) => {
				if (!('routing' in option) || !option.routing?.request) return option;
				const routing = option.routing;
				return {
					...option,
					routing: {
						...routing,
						request: { ...routing.request, ignoreHttpStatusErrors: true },
						output: {
							...routing.output,
							postReceive: [checkResponse, ...(routing.output?.postReceive ?? [])],
						},
					},
				};
			}),
		} as INodeProperties;
	});
}
