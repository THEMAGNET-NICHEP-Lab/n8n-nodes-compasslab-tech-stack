import type { INodeProperties } from 'n8n-workflow';
import { baseURL } from './shared/transport';

export const operations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		options: [
			{
				name: 'Detect Tech Stack',
				value: 'detectTechStack',
				action: 'Detect the technologies of a website',
				description:
					'Find the CMS, shop platform, analytics, CDN, hosting, payments and more behind a website',
				routing: { request: { method: 'GET', baseURL, url: '/v1/tech-stack' } },
			},
		],
		default: 'detectTechStack',
	},
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'https://example.com',
		description: 'Website or page URL; a bare domain works too',
		routing: { send: { type: 'query', property: 'url' } },
	},
	{
		displayName: 'Check DNS',
		name: 'dns',
		type: 'boolean',
		default: true,
		description: 'Whether to also read DNS records (hosting, DNS and email providers)',
		routing: { send: { type: 'query', property: 'dns' } },
	},
];
