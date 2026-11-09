// Delivery of email (Resend) and SMS (Termii). Each switches on when its API key is set in the
// environment; until then messages are written to the server log so every flow can be tested.

export type SendResult = { result: "sent" | "logged" | "failed"; error?: string };

export async function sendEmail(msg: { to: string; subject: string; html: string; text: string; replyTo?: string }): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email] to ${msg.to}: ${msg.subject}`);
    return { result: "logged" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "Shop Tafara <orders@shoptafara.com>",
        to: [msg.to],
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        reply_to: msg.replyTo,
      }),
    });
    if (!res.ok) return { result: "failed", error: `Resend ${res.status}: ${(await res.text()).slice(0, 200)}` };
    return { result: "sent" };
  } catch (e) {
    return { result: "failed", error: String(e) };
  }
}

/** Nigerian numbers in international format without the plus, as Termii expects: 2348030001483. */
export function toMsisdn(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) return `234${digits.slice(1)}`;
  return digits;
}

export async function sendSms(msg: { to: string; text: string }): Promise<SendResult> {
  const key = process.env.TERMII_API_KEY;
  if (!key) {
    console.info(`[sms] to ${msg.to}: ${msg.text}`);
    return { result: "logged" };
  }
  try {
    const res = await fetch(`${process.env.TERMII_BASE_URL ?? "https://api.ng.termii.com"}/api/sms/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        to: toMsisdn(msg.to),
        from: process.env.TERMII_SENDER_ID ?? "ShopTafara",
        sms: msg.text,
        type: "plain",
        channel: "generic",
      }),
    });
    if (!res.ok) return { result: "failed", error: `Termii ${res.status}: ${(await res.text()).slice(0, 200)}` };
    return { result: "sent" };
  } catch (e) {
    return { result: "failed", error: String(e) };
  }
}
