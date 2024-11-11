import {JSONSchemaType} from 'ajv';
import * as instanceofDef from 'ajv-keywords/dist/definitions/instanceof';

import { ajv, tgSecretToken, authorizationHeaders } from './globals';

instanceofDef.CONSTRUCTORS.Blob = Blob;

export interface TGHeader {
	'x-telegram-bot-api-secret-token': string
};
export const tgHeaderVld: JSONSchemaType<TGHeader> = ajv.compile({
	type: 'object',
	properties: {
		'x-telegram-bot-api-secret-token': {
			const: tgSecretToken
		},
	},
	required: ['x-telegram-bot-api-secret-token'],
	additionalProperties: {
		type: 'string'
	}
});

interface TGBodyMessage {
	message_id: number,
	from: {
		id: number,
		is_bot: boolean,
		first_name: string,
		username: string,
		language_code: string
	},
	chat: {
		id: number,
		first_name: string,
		username: string,
		type: string
	},
	date: number,
	text: string,
};
export interface TGBody {
	update_id: number,
	message?: TGBodyMessage,
	edited_message?: TGBodyMessage
};

const tgtgBodySchemaMessage = {
	type: 'object',
	properties: {
		message_id: { type: 'number' },
		from: {
			type: 'object',
			properties: {
				id: { type: 'number'},
				is_bot: { type: 'boolean'},
				first_name: { type: 'string'},
				username: { type: 'string'},
				language_code: { type: 'string'}
			},
			required: [
				'id',
				'is_bot',
				'first_name',
				'username',
				'language_code',
			],
			additionalProperties: {
				type: 'string'
			}
		},
		chat: {
			type: 'object',
			properties: {
				id: { type: 'number' },
				first_name: { type: 'string' },
				username: { type: 'string' },
				type: { enum: [
					'private',
					'group',
					'supergroup',
					'channel',
				] }
			},
			required: [
				'id',
				'first_name',
				'username',
				'type',
			],
			additionalProperties: {
				type: 'string'
			}
		},
		date: { type: 'number' },
		text: { type: 'string' },
	},
	required: [
		'message_id',
		'from',
		'chat',
		'date',
		'text',
	]
};

export const tgBodyVld: JSONSchemaType<TGBody> = ajv.compile({
	type: 'object',
	properties: {
		update_id: { type: 'number' }
	},
	patternProperties: {
		'^(edited\_)?message$': tgtgBodySchemaMessage
	},
	additionalProperties: {
		type: 'string'
	},
	oneOf: [
		{ required: ['update_id', 'message'], },
		{ required: ['update_id', 'edited_message'], }
	]
});

export interface UploadHeader {
	'authorization': string
};
export const uploadHeaderVld: JSONSchemaType<UploadHeader> = ajv.compile({
	type: 'object',
	properties: {
		authorization: { enum: [
			authorizationHeaders['doc-gen'],
		] },
	},
	required: ['authorization'],
	additionalProperties: {
		type: 'string'
	}
});
export interface UploadBody {
	file: Blob,
	request_code: string,
	sign_method: string,
	signing_info: string,
	preview_png: Blob
};
export const uploadBodyVld: JSONSchemaType<UploadBody> = ajv.compile({
	type: 'object',
	properties: {
		file: { instanceof: 'Blob' },
		preview_png: { instanceof: 'Blob' },
		request_code: { type: 'string' },
		sign_method: { type: 'string' },
		signing_info: { type: 'string' },
	},
	required: ['file', 'preview_png', 'request_code', 'sign_method'],
	additionalProperties: {
		type: 'string'
	}
});

export interface VerifyBody {
	request_code: string,
	sign_method: string,
	'cf-turnstile-response': string,
};
export const verifyBodyVld: JSONSchemaType<VerifyBody> = ajv.compile({
	type: 'object',
	properties: {
		request_code: { type: 'string' },
		sign_method: { type: 'string' },
		'cf-turnstile-response': { type: 'string' },
	},
	required: ['request_code', 'sign_method', 'cf-turnstile-response'],
	additionalProperties: {
		type: 'string'
	}
});

export type HandlePostResPaperSize = 'A4' | 'A5';
export type HandlePostResExportType = 'PDF' | 'PRINT';
export interface HandlePostRes {
	paper_size: HandlePostResPaperSize,
	export_type: HandlePostResExportType,
	name: string,
	address: string[],
	postal_code: string
};

export interface WSMsgDeka {
	dekaNo: string,
	shortNote: string,
	longNote?: string,
	metadata: {
		law?: string,
		source: string,
	},
};

export interface WSMsg {
	from: string,
	result?: WSMsgDeka[],
	message: TGBody
};