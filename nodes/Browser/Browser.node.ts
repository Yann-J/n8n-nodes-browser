// tslint:disable: no-any
// tslint:disable: no-any
// tslint:disable: no-any
// tslint:disable: no-any
import e from 'express';
import { IExecuteFunctions } from 'n8n-core';

import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

// @ts-ignore
import puppeteer, { ElementHandle, EvaluateFunc, Viewport } from 'puppeteer';

const defaultViewport: Viewport = {
	width: 1440,
	height: 900,
	deviceScaleFactor: 2,
	isMobile: false,
	hasTouch: false,
	isLandscape: false,
};

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
						name: 'HTML',
						value: 'html',
						action: 'Get page content',
					},
					{
						name: 'PDF',
						value: 'pdf',
						action: 'Save page as pdf',
					},
					{
						name: 'Screenshot',
						value: 'screenshot',
						action: 'Take page screenshot',
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

			// TODO: Support header credentials
			// {
			// 	displayName: 'Authentication',
			// 	name: 'authentication',
			// 	noDataExpression: true,
			// 	type: 'options',
			// 	options: [
			// 		{
			// 			name: 'None',
			// 			value: 'none',
			// 		},
			// 		{
			// 			name: 'Generic Credential Type',
			// 			value: 'genericCredentialType',
			// 			description: 'Fully customizable. Choose between basic, header, OAuth2, etc.',
			// 		},
			// 	],
			// 	default: 'none',
			// },
			// {
			// 	displayName: 'Generic Auth Type',
			// 	name: 'genericAuthType',
			// 	type: 'credentialsSelect',
			// 	required: true,
			// 	default: 'httpHeaderAuth',
			// 	credentialTypes: ['has:genericAuth'],
			// 	displayOptions: {
			// 		show: {
			// 			authentication: ['genericCredentialType'],
			// 		},
			// 	},
			// },

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
						displayName: 'Timeout',
						name: 'timeout',
						type: 'number',
						default: 30000,
						description: 'Browser Timeout (ms)',
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
						description: 'CSS selector of elements to wait for',
					},
					{
						displayName: 'Clip to Element?',
						name: 'clipToElement',
						type: 'boolean',
						default: true,
						description: 'Whether to clip screenshot to Element?',
					},
					{
						displayName: 'Full Page?',
						name: 'fullPage',
						type: 'boolean',
						default: false,
						description: 'Whether to take entire page or only visible part?',
					},
					{
						displayName: 'Disable Javascript?',
						name: 'disableJavascript',
						type: 'boolean',
						default: false,
						description: 'Whether to disable JS code execution?',
					},
					{
						displayName: 'Scroll To',
						name: 'scroll',
						type: 'string',
						default: '',
						description: 'CSS selector of an element to scroll to',
					},
					{
						displayName: 'Javascript Code',
						name: 'code',
						type: 'string',
						default: '',
						typeOptions: {
							rows: 5,
						},
					},

					// TODO: Support injection of styles and scripts
					// {
					// 	displayName: 'Styles',
					// 	name: 'styles',
					// 	type: 'fixedCollection',
					// 	default: [],
					// 	description: 'CSS Styles to inject in the page (URL or inline)',
					// 	typeOptions: {
					// 		multipleValues: true,
					// 	},
					// 	options: [
					// 		{
					// 			displayName: 'Style',
					// 			name: 'style',
					// 			type: 'string',
					// 			default: '',
					// 			placeholder: 'Use a URL or inline CSS',
					// 		},
					// 	],
					// },
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

					{
						displayName: 'Styles',
						name: 'styles',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
						},
						default: {
							parameters: [
								{
									type: 'url',
									value: '',
								},
							],
						},
						description: 'List of style tags to inject',
						options: [
							{
								name: 'styles',
								displayName: 'Style',
								values: [
									{
										displayName: 'Type',
										name: 'type',
										type: 'options',
										default: 'url',
										options: [
											{
												name: 'URL',
												value: 'url',
											},
											{
												name: 'Content',
												value: 'content',
											},
										],
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

					{
						displayName: 'Scripts',
						name: 'scripts',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
						},
						default: {
							parameters: [
								{
									type: 'url',
									value: '',
								},
							],
						},
						description: 'List of script tags to inject before rendering',
						options: [
							{
								name: 'scripts',
								displayName: 'Scripts',
								values: [
									{
										displayName: 'Type',
										name: 'type',
										type: 'options',
										default: 'url',
										options: [
											{
												name: 'URL',
												value: 'url',
											},
											{
												name: 'Content',
												value: 'content',
											},
										],
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

			{
				displayName: 'Viewport',
				name: 'viewport',
				type: 'collection',
				default: {},
				displayOptions: {
					show: {
						resource: ['page'],
					},
				},
				options: [
					{
						displayName: 'Width',
						name: 'width',
						type: 'number',
						default: 1440,
					},
					{
						displayName: 'Height',
						name: 'height',
						type: 'number',
						default: 900,
						required: true,
					},
					{
						displayName: 'Scale Factor',
						name: 'deviceScaleFactor',
						type: 'number',
						default: 2,
					},
					{
						displayName: 'Is Mobile',
						name: 'isMobile',
						type: 'boolean',
						default: false,
					},
					{
						displayName: 'Is Touchscreen',
						name: 'hasTouch',
						type: 'boolean',
						default: false,
					},
					{
						displayName: 'Is Lansdcape',
						name: 'isLandScape',
						type: 'boolean',
						default: false,
					},
				],
			},

			{
				displayName: 'PDF Options',
				name: 'pdfOptions',
				type: 'collection',
				default: {},
				displayOptions: {
					show: {
						resource: ['page'],
						operation: ['pdf'],
					},
				},
				options: [
					{
						displayName: 'Display Header and Footer?',
						name: 'displayHeaderFooter',
						type: 'boolean',
						default: false,
					},
					{
						displayName: 'Paper Format',
						name: 'PaperFormat',
						type: 'options',
						default: 'Letter',
						options: [
							{
								name: 'A0',
								value: 'A0',
							},
							{
								name: 'A1',
								value: 'A1',
							},
							{
								name: 'A2',
								value: 'A2',
							},
							{
								name: 'A3',
								value: 'A3',
							},
							{
								name: 'A4',
								value: 'A4',
							},
							{
								name: 'A5',
								value: 'A5',
							},
							{
								name: 'A6',
								value: 'A6',
							},
							{
								name: 'Ledger',
								value: 'Ledger',
							},
							{
								name: 'Legal',
								value: 'Legal',
							},
							{
								name: 'Letter',
								value: 'Letter',
							},
							{
								name: 'Tabloid',
								value: 'Tabloid',
							},
						],
					},
					{
						displayName: 'Landscape?',
						name: 'landscape',
						type: 'boolean',
						default: false,
					},
					{
						displayName: 'Print Background?',
						name: 'printBackground',
						type: 'boolean',
						default: false,
					},
					{
						displayName: 'Page Range',
						name: 'pageRanges',
						type: 'string',
						description: 'Range format e.g. "1-5, 8, 11-13"',
						default: '',
					},
					{
						displayName: 'Header Template',
						name: 'headerTemplate',
						type: 'string',
						description:
							'Valid HTML using named classes - see [docs](https://pptr.dev/api/puppeteer.pdfoptions.headertemplate)',
						default:
							'<p style="margin: auto;font-size: 13px;"><span class="title"></span> - <span class="url"></span></p>',
					},
					{
						displayName: 'Footer Template',
						name: 'footerTemplate',
						type: 'string',
						description:
							'Valid HTML using named classes - see [docs](https://pptr.dev/api/puppeteer.pdfoptions.headertemplate)',
						default:
							'<p style="margin: auto;font-size: 13px;"><span class="pageNumber"></span> / <span class="totalPages"></span></p>',
					},
					{
						displayName: 'Margins',
						name: 'margin',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: false,
						},
						default: {
							top: '0px',
							bottom: '0px',
							left: '0px',
							right: '0px',
						},
						options: [
							{
								displayName: 'Margins',
								name: 'margins',
								values: [
									{
										displayName: 'Top',
										name: 'top',
										type: 'string',
										default: '0px',
									},
									{
										displayName: 'Bottom',
										name: 'bottom',
										type: 'string',
										default: '0px',
									},
									{
										displayName: 'Left',
										name: 'left',
										type: 'string',
										default: '0px',
									},
									{
										displayName: 'Right',
										name: 'right',
										type: 'string',
										default: '0px',
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

		const binaryItems: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		// const authentication = this.getNodeParameter('authentication', 0) as
		// 	| 'genericCredentialType'
		// 	| 'none';

		const browser = await puppeteer.launch({
			timeout: 25000,
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
			defaultViewport,
		});

		const getBoundingClientRect = (element: any) => {
			const { top, left, height, width, x, y } = element.getBoundingClientRect();
			return { top, left, height, width, x, y };
		};

		for (let i = 0; i < items.length; i++) {
			const binaryItem: INodeExecutionData = {
				json: {},
				binary: {},
			};

			const url = this.getNodeParameter('url', i) as string;
			const options = this.getNodeParameter('options', i) as IDataObject;

			const viewport = Object.assign(
				{},
				defaultViewport,
				this.getNodeParameter('viewport', i),
			) as Viewport;

			const page = await browser.newPage();

			if (viewport && viewport.height && viewport.width) {
				await page.setViewport(viewport);
			}

			if (options.timeout) {
				page.setDefaultTimeout(options.timeout as number);
			}

			if (options.userAgent) {
				page.setUserAgent(options.userAgent as string);
			}

			if (options.disableJavascript) {
				page.setJavaScriptEnabled(false);
			}

			const headers: any = {};
			// if (authentication === 'genericCredentialType') {
			// 	const genericAuthType = this.getNodeParameter('genericAuthType', 0) as string;
			// 	if (genericAuthType === 'httpHeaderAuth') {
			// 		const httpHeaderAuth = await this.getCredentials('httpHeaderAuth');
			// 		headers[httpHeaderAuth.name as string] = httpHeaderAuth.value;
			// 	}
			// }

			if (options.headers && (options.headers as any)['parameters']) {
				for (const header of (options.headers as any)['parameters']) {
					headers[header.name as string] = header.value;
				}
			}
			page.setExtraHTTPHeaders(headers);

			await page.goto(url);
			// wait for some standard signals
			await page.evaluate('document.fonts.ready');
			await page.$$eval('img[src]:not([aria-hidden="true"])', (elements) =>
				Promise.all(
					elements
						.filter(
							(el) => el.getBoundingClientRect().top <= el!.ownerDocument!.defaultView!.innerHeight,
						)
						.map((el) => (el as any).decode()),
				),
			);

			if (options.styles && (options.styles as any).styles) {
				for (const style of (options.styles as any).styles) {
					await page.addStyleTag({
						[style.type]: style.value,
					});
				}
			}

			if (options.scripts && (options.scripts as any).scripts) {
				for (const script of (options.scripts as any).scripts) {
					await page.addScriptTag({
						[script.type]: script.value,
					});
				}
			}

			if (options.element) {
				await page.waitForSelector(options.element as string, { visible: true });
			}

			if (options.scroll) {
				await page.$eval(options.scroll as string, (el) => el.scrollIntoView());
			}

			binaryItem.json = {
				url,
				title: await page.title(),
				metrics: await page.metrics(),
			};

			if (options.code) {
				const func = Function(options.code as string) as EvaluateFunc<[]>;
				const response = await page.evaluate(func);
				binaryItem.json.evaluateResponse = response as any;
			}

			if (resource === 'page') {
				if (operation === 'screenshot') {
					const opt: any = {
						fullPage: !!options.fullPage,
						type: 'png',
						encoding: 'binary',
					};

					if (options.element && options.clipToElement) {
						const clip = await page.$eval(options.element as string, getBoundingClientRect);
						opt.clip = clip;
						opt.fullPage = false;
					}

					binaryItem.binary!['data'] = await this.helpers.prepareBinaryData(
						(await page.screenshot(opt)) as Buffer,
						'screenshot.png',
					);
				}

				if (operation === 'pdf') {
					const pdfOptions = this.getNodeParameter('pdfOptions', i) as IDataObject;
					const opt: any = Object.assign({}, pdfOptions);
					// remap the margins if needed
					if (opt.margin && opt.margin.margins) {
						opt.margin = opt.margin.margins;
					}
					console.dir(opt);

					binaryItem.binary!['data'] = await this.helpers.prepareBinaryData(
						await page.pdf(opt),
						'page.pdf',
					);
				}

				if (operation === 'html') {
					binaryItem.json.content = await page.content();
				}

				binaryItems.push(binaryItem);
			}
		}

		await browser.close();

		return [binaryItems];
	}
}
