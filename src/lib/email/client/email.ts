import { createTransport } from "nodemailer";
import { serverDebug } from "../../../utils/debug";

// Brevo (früher Sendinblue) SDK
import * as SibApiV3Sdk from "@sendinblue/client";
import type { SendSmtpEmail } from "@sendinblue/client";

// Debug-Level für E-Mail-Operationen
export const EMAIL_DEBUG_LEVEL = 4;

// Typen für E-Mail-Daten
export interface EmailData {
	to: string | string[];
	subject: string;
	html: string;
	text: string;
	from?: { email: string; name?: string } | string; // Hinzugefügt: Optional benutzerdefinierter Absender
	cc?: string | string[];
	bcc?: string | string[];
	replyTo?: string;
	attachment?: Array<{
		name: string;
		content: string; // Base64 encoded content
		type?: string;
	}>;
}

// Helfer-Funktion, um E-Mail-Arrays zu standardisieren
export function formatEmailRecipients(emails: string | string[]): Array<{ email: string }> {
	if (typeof emails === "string") {
		return [{ email: emails }];
	}
	return emails.map((email) => ({ email }));
}

// Basis-URL aus Umgebungsvariablen abrufen (wichtig für die korrekten Links)
export function getBaseUrl(): string {
	// Wenn NEXTAUTH_URL explizit gesetzt ist, hat dies immer Vorrang
	if (process.env.NEXTAUTH_URL) {
		return process.env.NEXTAUTH_URL;
	}

	// Für lokale Entwicklung
	if (!process.env.VERCEL_URL) {
		const localPort = process.env.PORT || "3000";
		return `http://localhost:${localPort}`;
	}

	// Auf Vercel:
	// Für die Hauptproduktion (wenn VERCEL_ENV=production)
	if (process.env.VERCEL_ENV === "production") {
		return `https://${process.env.VERCEL_URL}`;
	}

	// Für Preview/Staging/Development Umgebungen auf Vercel
	// Verwende die VERCEL_URL mit https
	return `https://${process.env.VERCEL_URL}`;
}

// Abstrakte E-Mail-Client-Klasse
export abstract class BaseEmailClient {
	protected senderEmail: string;
	protected senderName: string;

	constructor(senderEmail: string, senderName: string) {
		this.senderEmail = senderEmail;
		this.senderName = senderName;
	}

	abstract sendEmail(emailData: EmailData): Promise<void>;
}

// Brevo-spezifischer E-Mail-Client
export class BrevoEmailClient extends BaseEmailClient {
	private apiInstance: SibApiV3Sdk.TransactionalEmailsApi | null = null;
	private apiKey: string;

	constructor(apiKey: string, senderEmail: string, senderName: string) {
		super(senderEmail, senderName);
		this.apiKey = apiKey;
	}

	private initBrevoApi(): SibApiV3Sdk.TransactionalEmailsApi {
		if (!this.apiInstance) {
			if (!this.apiKey) {
				throw new Error("BREVO_API_KEY nicht konfiguriert");
			}

			serverDebug(EMAIL_DEBUG_LEVEL, "Initialisiere Brevo API Client");
			this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
			this.apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, this.apiKey);
		}
		return this.apiInstance;
	}

	async sendEmail(emailData: EmailData): Promise<void> {
		try {
			serverDebug(EMAIL_DEBUG_LEVEL, `Sende E-Mail via Brevo an: ${emailData.to}`);
			serverDebug(EMAIL_DEBUG_LEVEL, "------- EMAIL DETAILS -------");
			serverDebug(EMAIL_DEBUG_LEVEL, `To: ${emailData.to}`);
			serverDebug(EMAIL_DEBUG_LEVEL, `Subject: ${emailData.subject}`);
			serverDebug(EMAIL_DEBUG_LEVEL, emailData.text);
			serverDebug(EMAIL_DEBUG_LEVEL, "------- END EMAIL DETAILS -------");

			// Brevo API Client initialisieren
			const apiInstance = this.initBrevoApi();

			// Sender-Objekt bestimmen (benutzerdefinierten Absender oder Standard verwenden)
			let sender: { email: string; name?: string } = { email: this.senderEmail, name: this.senderName };

			if (emailData.from) {
				if (typeof emailData.from === "string") {
					sender = { email: emailData.from };
				} else {
					sender = emailData.from;
				}
				serverDebug(EMAIL_DEBUG_LEVEL, `Verwende benutzerdefinierten Absender: ${JSON.stringify(sender)}`);
			}

			// E-Mail erstellen für Brevo
			const sendSmtpEmail: SendSmtpEmail = {
				to: formatEmailRecipients(emailData.to),
				sender: sender,
				subject: emailData.subject,
				htmlContent: emailData.html,
				textContent: emailData.text,
			};

			// Optionale Felder hinzufügen
			if (emailData.cc) {
				sendSmtpEmail.cc = formatEmailRecipients(emailData.cc);
			}

			if (emailData.bcc) {
				sendSmtpEmail.bcc = formatEmailRecipients(emailData.bcc);
			}

			if (emailData.replyTo) {
				sendSmtpEmail.replyTo = { email: emailData.replyTo };
			}

			if (emailData.attachment && emailData.attachment.length > 0) {
				sendSmtpEmail.attachment = emailData.attachment;
			}

			// E-Mail über Brevo senden
			const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
			serverDebug(EMAIL_DEBUG_LEVEL, `E-Mail erfolgreich gesendet. Message ID: ${result.body.messageId}`);
		} catch (error) {
			serverDebug(EMAIL_DEBUG_LEVEL, "Brevo Fehler:", error);
			if (error instanceof Error) {
				serverDebug(EMAIL_DEBUG_LEVEL, "Email Fehler:", error.message);
				serverDebug(EMAIL_DEBUG_LEVEL, "Stack:", error.stack);
			}
			throw error;
		}
	}
}

// Nodemailer-basierter E-Mail-Client für Entwicklungsumgebungen
export class NodemailerEmailClient extends BaseEmailClient {
	private transporter: any;

	constructor(senderEmail: string, senderName: string, smtpConfig?: any) {
		super(senderEmail, senderName);

		// Standard-SMTP-Konfiguration für Entwicklung (z.B. mit MailHog)
		const config = smtpConfig || {
			host: "localhost",
			port: 1025,
			ignoreTLS: true,
		};

		this.transporter = createTransport(config);
	}

	async sendEmail(emailData: EmailData): Promise<void> {
		try {
			serverDebug(EMAIL_DEBUG_LEVEL, `Sende E-Mail via Nodemailer an: ${emailData.to}`);

			// From-Feld bestimmen (benutzerdefinierten Absender oder Standard verwenden)
			let from = `"${this.senderName}" <${this.senderEmail}>`;

			if (emailData.from) {
				if (typeof emailData.from === "string") {
					from = emailData.from;
				} else {
					from = emailData.from.name ? `"${emailData.from.name}" <${emailData.from.email}>` : emailData.from.email;
				}
				serverDebug(EMAIL_DEBUG_LEVEL, `Verwende benutzerdefinierten Absender: ${from}`);
			}

			// E-Mail-Daten für Nodemailer formatieren
			const mailOptions = {
				from: from,
				to: Array.isArray(emailData.to) ? emailData.to.join(",") : emailData.to,
				subject: emailData.subject,
				text: emailData.text,
				html: emailData.html,
				cc: emailData.cc ? (Array.isArray(emailData.cc) ? emailData.cc.join(",") : emailData.cc) : undefined,
				bcc: emailData.bcc ? (Array.isArray(emailData.bcc) ? emailData.bcc.join(",") : emailData.bcc) : undefined,
				replyTo: emailData.replyTo,
				attachments: emailData.attachment
					? emailData.attachment.map((att) => ({
							filename: att.name,
							content: Buffer.from(att.content, "base64"),
							contentType: att.type,
					  }))
					: [],
			};

			// E-Mail senden
			const info = await this.transporter.sendMail(mailOptions);
			serverDebug(EMAIL_DEBUG_LEVEL, `E-Mail erfolgreich gesendet. Message ID: ${info.messageId}`);
		} catch (error) {
			serverDebug(EMAIL_DEBUG_LEVEL, "Nodemailer Fehler:", error);
			throw error;
		}
	}
}

// Erstellt den passenden E-Mail-Client basierend auf der Umgebung
export function createEmailClient(options?: { forceNodemailer?: boolean; smtpConfig?: any; senderEmail?: string; senderName?: string }): BaseEmailClient {
	const senderEmail = options?.senderEmail || process.env.EMAIL_FROM || "no-reply@example.com";
	const senderName = options?.senderName || process.env.SITE_NAME || "Website";
	const brevoApiKey = process.env.BREVO_API_KEY;

	// Verwende Nodemailer in Entwicklungsumgebungen oder wenn explizit angefordert
	if (options?.forceNodemailer || (process.env.NODE_ENV !== "production" && !brevoApiKey)) {
		serverDebug(EMAIL_DEBUG_LEVEL, "Verwende Nodemailer für E-Mail-Versand");
		return new NodemailerEmailClient(senderEmail, senderName, options?.smtpConfig);
	}

	// Ansonsten Brevo verwenden, wenn API-Key vorhanden
	if (brevoApiKey) {
		serverDebug(EMAIL_DEBUG_LEVEL, "Verwende Brevo API für E-Mail-Versand");
		return new BrevoEmailClient(brevoApiKey, senderEmail, senderName);
	}

	throw new Error("Keine E-Mail-Konfiguration gefunden: Entweder BREVO_API_KEY oder ein SMTP-Server muss konfiguriert sein.");
}

// Standardmäßiger E-Mail-Client
let defaultEmailClient: BaseEmailClient | null = null;

// Gibt den Standard-E-Mail-Client zurück (initialisiert ihn, falls nötig)
export function getEmailClient(): BaseEmailClient {
	if (!defaultEmailClient) {
		defaultEmailClient = createEmailClient();
	}
	return defaultEmailClient;
}

// Hilfsfunktion zum Senden einer E-Mail mit dem Standard-Client
export async function sendEmail(emailData: EmailData): Promise<void> {
	const client = getEmailClient();
	await client.sendEmail(emailData);
}

// Template-Rendering-Funktion mit Platzhalterersetzung
export function renderTemplate(template: string, data: Record<string, any>): string {
	return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
		return data[key.trim()] !== undefined ? data[key.trim()] : `{{${key}}}`;
	});
}

// Login-E-Mail generieren (allgemeine Implementierung)
export function generateLoginEmail(email: string, token: string, siteName: string = process.env.SITE_NAME || "Website"): EmailData {
	const baseUrl = getBaseUrl();
	const magicLink = `${baseUrl}/auth/verify?token=${token}&type=login`;

	serverDebug(EMAIL_DEBUG_LEVEL, `Login-Link: ${magicLink}`);

	const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <h2>${siteName} - Login</h2>
      <p>Hallo,</p>
      <p>Klicke bitte auf den folgenden Link, um dich bei ${siteName} anzumelden:</p>
      <p style="margin: 20px 0;">
        <a 
          href="${magicLink}" 
          style="background: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;"
        >
          Bei ${siteName} anmelden
        </a>
      </p>
      <p>Dieser Link ist 15 Minuten gültig und kann nur einmal verwendet werden.</p>
      <p>Falls du keinen Login angefordert hast, kannst du diese E-Mail ignorieren.</p>
      <hr style="border: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #666; font-size: 14px;">
        ${siteName} - Dein Account, Dein Spiel
      </p>
    </div>
  `;

	const text = `
    ${siteName} - Login
    
    Hallo,
    
    Klicke bitte auf den folgenden Link, um dich bei ${siteName} anzumelden:
    
    ${magicLink}
    
    Dieser Link ist 15 Minuten gültig und kann nur einmal verwendet werden.
    
    Falls du keinen Login angefordert hast, kannst du diese E-Mail ignorieren.
    
    ${siteName} - Dein Account, Dein Spiel
  `;

	return {
		to: email,
		subject: `Your ${siteName} Login Link`,
		html,
		text,
	};
}
