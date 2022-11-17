import { IExecuteFunctions } from 'n8n-core';

import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

// @ts-ignore
import createBrowserless from 'browserless';

export class Browser implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Browser',
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		documentationUrl: 'https://github.com/one-acre-fund/n8n-nodes-browser',
		name: 'browser',
		icon: 'file:chrome.svg',
		group: ['transform'],
		version: 1,
		description: 'A node to run a headless browser and take screenshots or PDF',
		defaults: {
			name: 'Browser',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [],
		properties: [
			// Resources
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Page',
						value: 'page',
						description: 'Manipulate Web Pages',
					},
				],
				default: 'page',
				required: true,
			},

			// Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				required: true,
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['page'],
					},
				},
				default: 'screenshot',
				options: [
					{
						name: 'Screenshot',
						value: 'screenshot',
						action: 'Take page screenshot',
					},
					{
						name: 'PDF',
						value: 'pdf',
						action: 'Save page as pdf',
					},
					{
						name: 'Text',
						value: 'text',
						action: 'Save page text',
					},
					{
						name: 'HTML',
						value: 'html',
						action: 'Save page html',
					},
				],
			},

			{
				displayName: 'Target URL',
				name: 'url',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['page'],
					},
				},
			},

			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				default: {},
				displayOptions: {
					show: {
						resource: ['page'],
					},
				},
				options: [
					{
						displayName: 'Browser Name',
						name: 'device',
						type: 'string',
						default: '',
						description:
							'Name of browser to emulate - see [Puppeteer docs](https://pptr.dev/next/api/puppeteer.devices) for a list',
					},
					{
						displayName: 'Timeout',
						name: 'timeout',
						type: 'number',
						default: 30000,
						description: 'Browser Timeout (ms)',
					},
					{
						displayName: 'Width',
						name: 'width',
						type: 'number',
						default: 1440,
						description: 'Viewport Width (px)',
					},
					{
						displayName: 'Height',
						name: 'height',
						type: 'number',
						default: 900,
						description: 'Viewport Height (px)',
					},
					{
						displayName: 'User-Agent',
						name: 'userAgent',
						type: 'string',
						default: '',
						description: 'User Agent',
					},
					{
						displayName: 'Element',
						name: 'element',
						type: 'string',
						default: '',
						description: 'CSS selector to take screenshot for',
					},
					{
						displayName: 'Full Page?',
						name: 'fullPage',
						type: 'boolean',
						default: true,
						description: 'Whether to take entire page or only visible part?',
					},
					{
						displayName: 'Omit Background?',
						name: 'omitBackground',
						type: 'boolean',
						default: false,
						description:
							'Whether to ignore default browser background (white) and use transparent?',
					},
					{
						displayName: 'Scroll To',
						name: 'scroll',
						type: 'string',
						default: '',
						description: 'CSS selector of an element to scroll to',
					},
					{
						displayName: 'Styles',
						name: 'styles',
						type: 'fixedCollection',
						default: [],
						description: 'CSS Styles to inject in the page (URL or inline)',
						typeOptions: {
							multipleValues: true,
						},
						options: [
							{
								displayName: 'Style',
								name: 'style',
								type: 'string',
								default: '',
								placeholder: 'Use a URL or inline CSS',
							},
						],
					},
					{
						displayName: 'Headers',
						name: 'headers',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
						},
						default: {
							parameters: [
								{
									name: '',
									value: '',
								},
							],
						},
						description: 'Add Headers',
						options: [
							{
								name: 'parameters',
								displayName: 'Parameter',
								values: [
									{
										displayName: 'Name',
										name: 'name',
										type: 'string',
										default: '',
									},
									{
										displayName: 'Value',
										name: 'value',
										type: 'string',
										default: '',
									},
								],
							},
						],
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		// tslint:disable-next-line: no-any
		// tslint:disable-next-line: no-any
		const binaryItems: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		const browser = createBrowserless({
			timeout: 25000,
			lossyDeviceName: true,
			ignoreHTTPSErrors: true,
		});

		const context = await browser.createContext();

		for (let i = 0; i < items.length; i++) {
			const url = this.getNodeParameter('url', i) as string;
			const options = this.getNodeParameter('options', i) as IDataObject;
			const binaryItem: INodeExecutionData = {
				json: {},
				binary: {},
			};

			if (resource === 'page') {
				if (operation === 'screenshot') {
					// *********************************************************************
					//                             Screenshot
					// *********************************************************************
					const opt = {
						...(options.element && { element: options.element }),
						...(options.device && { device: options.device }),
						...(options.timeout && { timeout: options.timeout }),
						...(options.userAgent && { userAgent: options.userAgent }),
						...(options.fullPage && { fullPage: options.fullPage }),
						...(options.omitBackground && { omitBackground: options.omitBackground }),
						...(options.scroll && { scroll: options.scroll }),
						viewport: {
							...(options.width && { width: options.width }),
							...(options.height && { height: options.height }),
						},
						headers: {},
					};

					// tslint:disable-next-line: no-any
					if (options.headers && (options.headers as any)['parameters']) {
						// tslint:disable-next-line: no-any
						for (const header of (options.headers as any)['parameters']) {
							// tslint:disable-next-line: no-any
							(opt.headers as any)[header.name] = header.value;
						}
					}
					console.dir(opt);
					binaryItem.binary!['data'] = await this.helpers.prepareBinaryData(
						await context.screenshot(url, {
							...opt,
							type: 'png',
							encoding: 'binary',
						}),
						'screenshot.png',
					);

					binaryItems.push(binaryItem);
				}
			}
		}

		await browser.close();

		return [binaryItems];
	}
}
