import { Ajv } from 'ajv';
import AjvKeyword from "ajv-keywords";
import 'dotenv/config';

export const tgBotToken = process.env.TG_BOT_TOKEN as string;
export const tgWebhookHost = process.env.TG_WEBHOOK_HOST as string;
export const tgSecretToken = (Math.random() + 1).toString(36).substring(2);
export const ajv = new Ajv({allErrors: true});
AjvKeyword(ajv);

export const authorizationHeaders = {
} as {
	[key: string]: string
};
