import { TGBody, HandlePostRes, WSMsg, HandlePostResPaperSize, HandlePostResExportType } from '../types.d';
import { lawAbbrToFull } from './law';
import { replyTG, escapeMD2, replyTGFile } from '../telegram';
import { Elysia } from 'elysia';
import { file, dir } from 'tmp-promise';
import path from 'node:path';

export const handlePost = (msgInfo: TGBody): HandlePostRes|null => {
	const message = msgInfo.message ?? msgInfo.edited_message;
	const postalRegexRes = /^(?:(?<command>post|จม|จ่าหน้า|จดหมาย)(?:\s+(?<paper_size>A4|A5))(?:\s+(?<export_type>PDF|PRINT))?)\s*\n{1}(?:\s*(?<name>\S[^\r\n]*\S)\s*\n)(?<address>[\s\S]*\n){1}(?:\s*(?<postal_code>\d{5}))\s*$/g
		.exec(message?.text ?? '');
	if (postalRegexRes !== null) {
		// Search Deka by number
		return {
			paper_size: ((postalRegexRes.groups?.paper_size ?? 'A4').toUpperCase()) as HandlePostResPaperSize,
			export_type: ((postalRegexRes.groups?.export_type ?? 'PDF').toUpperCase()) as HandlePostResExportType,
			name: postalRegexRes.groups?.name ?? '',
			address: (postalRegexRes.groups?.address ?? '').split(/[\r\n]/),
			postal_code: postalRegexRes.groups?.postal_code ?? ''
		}
	}

	return null;
};

export const onTelegramMsg = async (
	app: Elysia,
	botToken: string,
	msgInfo: TGBody
): Promise<Boolean> => {
	const message = msgInfo.message ?? msgInfo.edited_message;

	if (message && /^(post|จม|จ่าหน้า|จดหมาย)\s/i.test(message.text)) {
		const postPrintRes = await handlePost(msgInfo);
		if (postPrintRes !== null) {
			const postTmplPath = path.join(import.meta.dir, '../../resources/envelope-template.fodt');
			const postTmplFs = Bun.file(postTmplPath);
			const postTmpl = await postTmplFs.text();
			const postTmpFile = await file({ postfix: '.fodt', });
			const postTmpDir = await dir({ unsafeCleanup: true });

			Bun.write(
				postTmpFile.path,
				postTmpl
					.replace('{{name}}', postPrintRes.name)
					.replace(
						'{{address}}',
						postPrintRes.address
							.map(t => t.trim())
							.filter(t => t.length > 0)
							.join('</text:p>\n\t<text:p text:style-name="P10">')
					)
					.replace('{{postal_code}}', postPrintRes.postal_code)
			);

			// Generate PDF using Libre Office
			try {
				const {
					stdout: procLibreTextBuf,
					exitCode: procLibreExitCode
				} = await Bun.$`soffice --headless --convert-to pdf:writer_pdf_Export --outdir ${
					postTmpDir.path
				} ${
					postTmpFile.path
				}`.quiet();

				if (procLibreExitCode !== 0) return false;

				const procLibreText = procLibreTextBuf.toString('utf8');
				const postPdfPath = /->\s+(?<pdf_path>\S+)\s/g.exec(procLibreText)?.groups?.pdf_path;

				if (! postPdfPath) return false;

				let exportPdfFile = postPdfPath;
				// Landscape dimension
				// Reverse of : https://ghostscript.readthedocs.io/en/latest/Use.html#iso-standard
				const [
					paper_width, paper_height
				] = {
					'A5': [ 595, 420 ],
					'A4': [ 595, 842 ],
				}[postPrintRes.paper_size];

				// Scale PDF to other size
				if (postPrintRes.paper_size !== 'A4') {
					exportPdfFile = postPdfPath.replace('.pdf', `-${postPrintRes.paper_size}.pdf`);

					const {
						exitCode: procResizeExitCode
					} = await Bun.$`gs -o ${
						exportPdfFile
					} -sDEVICE=pdfwrite -dDEVICEWIDTHPOINTS=${
						paper_width
					} -dDEVICEHEIGHTPOINTS=${
						paper_height
					} -dFIXEDMEDIA -dEPSFitPage -dAutoRotatePages=/None -c "<</Orientation 3>> setpagedevice" -dCompatibilityLevel=1.4 ${
						postPdfPath
					}`.quiet();

					if (procResizeExitCode !== 0) return false;
				}

				switch (postPrintRes.export_type) {
					case 'PDF':
						await replyTGFile(
							botToken,
							message.from.id,
							message.message_id,
							Bun.file(exportPdfFile),
							'post-label.pdf'
						);
						break;
					case 'PRINT':
						let printPdfFile = exportPdfFile;

						if (postPrintRes.paper_size !== 'A4') {
							// Rescale to A4
							printPdfFile = postPdfPath.replace('.pdf', `-print.pdf`);
							// 842 is A4 height in point unit
							const marginOffsetOption = `<</PageOffset [0 ${ 842 - paper_height }]>> setpagedevice`

							const {
								exitCode: procRescaleExitCode
							} = await Bun.$`gs -o ${
								printPdfFile
							} -sDEVICE=pdfwrite -sPAPER=a4 -dFIXEDMEDIA -dCenterPages=false -dAutoRotatePages=/None -c "${marginOffsetOption}" -dCompatibilityLevel=1.4 ${
								exportPdfFile
							}`.quiet();

							if (procRescaleExitCode !== 0) return false;
						}

						const printExitCode = (await Bun.$`lp -sd ${
							process.env.LRP_PRINTER as string
						} ${printPdfFile}`.quiet()).exitCode;

						if (printExitCode !== 0) return false;

						await replyTG(
							botToken,
							message.from.id,
							message.message_id,
							'__Postal Label__\nPrinting\\.\\.\\.'
						);

						break;
				}
			} catch (e) {
				console.log('catch', e);
				return false;
			}

			await postTmpDir.cleanup();
			return true;
		}

		await replyTG(
			botToken,
			message.from.id,
			message.message_id,
			`__Postal Label format:__\n
			\`[post|จม|จ่าหน้า|จดหมาย] ?[A4|A5]<default: A4> ?[PDF|PRINT]<DEFAULT:PDF>
			ชื่อ
			ที่อยู่(หลายบรรทัดได้)
			รหัส ปณ.\`\n
			`
		);

		return true;
	}

	return false;
};
