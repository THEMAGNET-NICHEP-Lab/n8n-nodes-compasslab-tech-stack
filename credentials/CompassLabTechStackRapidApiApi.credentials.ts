import type { IAuthenticateGeneric, Icon, ICredentialType, INodeProperties } from 'n8n-workflow';

export class CompassLabTechStackRapidApiApi implements ICredentialType {
	name = 'compassLabTechStackRapidApiApi';

	displayName = 'CompassLab Tech Stack (RapidAPI) API';

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
				'Your RapidAPI key (X-RapidAPI-Key). Subscribe to Website Technology Stack Detector on RapidAPI first; it has a free plan.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-rapidapi-key': '={{$credentials.apiKey}}',
			},
		},
	};
}
