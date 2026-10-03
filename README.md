# n8n-nodes-compasslab-tech-stack

This is an n8n community node for **Website Technology Stack Detector** by CompassLab: detect the technologies behind any website: CMS, shop platform, analytics, CDN, hosting, payments and more.

| Operation | What it does |
|---|---|
| **Detect Tech Stack** | Technologies of a website with category, version when exposed, confidence and the evidence that matched |

The node can also be used as a **tool by the n8n AI Agent**.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation) · [Credentials](#credentials) · [Usage](#usage) · [Example workflows](#example-workflows) · [Compatibility](#compatibility) · [Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation. In short: **Settings > Community Nodes > Install**, then enter `n8n-nodes-compasslab-tech-stack`.

## Credentials

Website Technology Stack Detector is sold on two marketplaces. Pick one; the node works with both, and both have a **free plan**.

**api.market**
1. Sign up at [api.market](https://api.market) and open **Website Technology Stack Detector** (search for "CompassLab").
2. Subscribe (the FREE plan needs no credit card) and copy your API key (`x-api-market-key`).
3. In n8n, create a **CompassLab Tech Stack (api.market) API** credential and paste the key.

**RapidAPI**
1. Sign up at [rapidapi.com](https://rapidapi.com) and search for **Website Technology Stack Detector**.
2. Subscribe to the free BASIC plan and copy your `X-RapidAPI-Key` from the playground.
3. In n8n, create a **CompassLab Tech Stack (RapidAPI) API** credential and paste the key.

In the node, choose the same **Marketplace** as your credential. The credential test checks your key without using any of your quota.

## Usage

- Each input item makes one request.
- Errors show the API's own reason (for example a wrong parameter, or a missing subscription and how to fix it). Turn on **Settings > On Error > Continue** to keep processing the other items.
- Web results always carry a `status` (`ok`, `blocked_by_robots`, `blocked_by_site`, `not_found`, `timeout`, ...). Check it with an IF node. The API respects robots.txt and never bypasses logins, paywalls or CAPTCHAs.

**Measured quality:** Main platform detected on 19 of 20 sites with publicly known stacks; 7.7 technologies found per site on average. We publish only what we measured.

## Example workflows

- **Find Shopify stores.** Google Sheets (prospect domains) > CompassLab Tech Stack > IF technologies contain `Shopify` > CRM.
- **Agency audit.** Form trigger (client URL) > CompassLab Tech Stack > AI Agent writes the audit > email.

## Compatibility

Built with the `n8n-node` CLI (n8n Nodes API version 1). No runtime dependencies. Tested with n8n 2.41.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- Other CompassLab nodes: https://github.com/THEMAGNET-NICHEP-Lab/n8n-nodes-compasslab
- Privacy: https://web-tools-hbvr.onrender.com/privacy
- Terms: https://web-tools-hbvr.onrender.com/terms

## Version history

- **0.1.2**: each package now has its own repository.
- **0.1.1**: node category renamed to n8n's current list.
- **0.1.0**: first release.

## License

[MIT](LICENSE.md)
