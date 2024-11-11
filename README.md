# Bun Telegram worker

This project is to provide Telegram worker for me to do some command using Telegram bot message web service.

## Prerequirement

- [Bun](bun.sh) installed.
- [LibreOffice](https://www.libreoffice.org) installed.
- [Ghostscript](https://ghostscript.readthedocs.io/en/latest/Install.html) installed
- Printer connected. Either physically connected or network printer. You may use `lpstat -p` command to list available devices.
- Valid domain name to access web service.
- A Telegram account.

## Usage

1. [Register Telegram bot](https://core.telegram.org/bots/tutorial).
2. Copy [`sample.env`](./sample.env) to `.env` and fill in your Telegram bot token and other info.
3. Run `bun start` to start worker.
4. Send message to your bot:

  ```txt
  จดหมาย A4
  สำนักกฎหมาย กรมที่ดิน
  ศูนย์ราชการเฉลิมพระเกียรติ ๘๐ พรรษาฯ
  ถ.แจ้งวัฒนะ แขวงทุ่งสองห้อง
  เขตหลักสี่ กรุงเทพมหานคร
  10210
  ```

  if correct, you will get PDF file.

5. If you want, you might setup [daemon with systemd](https://bun.sh/guides/ecosystem/systemd).

## License

MIT © [ITPCC](https://github.com/itpcc).
