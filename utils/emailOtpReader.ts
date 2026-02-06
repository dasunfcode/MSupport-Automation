// utils/emailOtpReader.ts
const MailListener = require("mail-listener2");

export function getOtpFromEmail(): Promise<string> {
  return new Promise((resolve, reject) => {
    const mailListener = new MailListener({
      username: "dasuntest5@gmail.com",
      password: "gwjg qkav pzim nmwr",
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      mailbox: "INBOX",
      searchFilter: ["UNSEEN"],
      markSeen: true,
      fetchUnreadOnStart: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    mailListener.start();

    mailListener.on("mail", (mail: any) => {
      const body = mail.text || "";
      const otpMatch = body.match(/\b\d{6}\b/);

      if (otpMatch) {
        mailListener.stop();
        resolve(otpMatch[0]);
      }
    });

    setTimeout(() => {
      mailListener.stop();
      reject("OTP email not received within timeout");
    }, 60000);
  });
}
