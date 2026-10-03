import type { IAuthenticateGeneric, Icon, ICredentialType, INodeProperties } from 'n8n-workflow';

export class CompassLabTechStackApiMarketApi implements ICredentialType {
	name = 'compassLabTechStackApiMarketApi';

	displayName = 'CompassLab Tech Stack (api.market) API';

	icon: Icon = { light: 'file:../icons/tech-stack.svg', dark: 'file:../icons/tech-stack.dark.svg' };

	documentationUrl =
		'https://github.com/THEMAGNET-NICHEP-Lab/n8n-nodes-compasslab-tech-stack#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Your api.market key (x-api-market-key). Subscribe to Website Technology Stack Detector on api.market first; it has a free plan.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-api-market-key': '={{$credentials.apiKey}}',
			},
		},
	};
}
