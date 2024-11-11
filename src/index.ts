import { Elysia } from 'elysia';
import { staticPlugin } from '@elysiajs/static';
import 'dotenv/config';

// * Project modules
import { onStart as TGOnStart } from './telegram';
import { tgHeaderVld, tgBodyVld, TGBody } from './types.d';
import {
	onTelegramMsg as PostOnTelegramMsg
} from "./handlers/post";

// * Global vars
import {
	tgBotToken,
	tgSecretToken,
	tgWebhookHost,
} from './globals';

const app = new Elysia({
	websocket: {
        idleTimeout: 30
    }
})
	.use(staticPlugin())
	.derive((ctx) => ({
		remoteAddress: () => app.server!.requestIP(ctx.request)
	}))
	.on('start', async () => {
		console.log('ON start | Starting', tgSecretToken);
		await Promise.all([
			TGOnStart(tgBotToken, tgSecretToken, tgWebhookHost),
		]);
	})
	.on('stop', async () => {
		console.log('ON stop | Triggered.');
		await Promise.all([
		]);
	})
	.get("/", () => "Hello Elysia")
	.post("/telegram", async (ctx) => {
		console.log('POST /telegram | ctx.body', ctx.body);
		if (! tgHeaderVld(ctx.headers)){
			ctx.set.status = 403;
			return {
				"msg": "Access Denied",
				"err_cde": 4030,
				"error": tgHeaderVld.errors
			};
		}

		if (! tgBodyVld(ctx.body)){
			console.log('POST /telegram | ctx.body Invalid', ctx.body, tgBodyVld.errors);
			ctx.set.status = 400;
			return {
				"msg": "Body validation error",
				"err_cde": 4000,
				"error": tgBodyVld.errors
			};
		}

		const body = ctx.body as TGBody;

		const moduleResList = await Promise.all([
			PostOnTelegramMsg(app, tgBotToken, body)
		]) as Boolean[];
		console.log('POST /telegram | moduleResList', moduleResList);

		return { ok: moduleResList.indexOf(true) !== -1 };
	})
	.listen(Number(process.env.PORT ?? '8080'));

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
