/**
 * E-Mail-Template für Newsletter-Abmeldung-Bestätigung
 */
import { TemplateVariables, createHtmlEmail, createTextEmail } from "./base";
import { getBaseUrl } from "../client/email";

export interface NewsletterUnsubscriptionVariables extends TemplateVariables {
	email: string;
	subscribeToken?: string;
	userName?: string;
	customSubscribePath?: string;
}

export function generateNewsletterUnsubscriptionTemplate(variables: NewsletterUnsubscriptionVariables): { html: string; text: string; subject: string } {
	// Standard-Werte setzen
	const userName = variables.userName || "";
	const baseUrl = getBaseUrl();

	// Anmelde-Link generieren (falls Token vorhanden)
	const subscribePath = variables.customSubscribePath || "/newsletter/subscribe";
	const subscribeLink = variables.subscribeToken ? `${baseUrl}${subscribePath}?token=${variables.subscribeToken}&email=${encodeURIComponent(variables.email)}` : `${baseUrl}${subscribePath}`;

	// Betreff generieren
	const subject = `Newsletter-Abmeldung bei ${variables.siteName}`;
	variables.headerTitle = `Abmeldung vom ${variables.siteName} Newsletter`;

	// HTML-Content generieren
	const htmlContent = `
        <p>Hallo${userName ? ` ${userName}` : ""},</p>
        
        <p>wir haben deine Abmeldung vom Newsletter von ${variables.siteName} erhalten und bestätigt.</p>
        
        <p>Du wirst keine weiteren Newsletter-E-Mails von uns erhalten.</p>
        
        <p>Falls du deine Meinung änderst, kannst du dich jederzeit wieder anmelden:</p>
        
        <p style="text-align: center;">
            <a href="${subscribeLink}" class="button">Newsletter wieder abonnieren</a>
        </p>
        
        <p>Wir danken dir für dein Interesse an ${variables.siteName}.</p>
        
        <p>Viele Grüße,<br>
        Dein ${variables.siteName}-Team</p>
    `;

	// Text-Content generieren
	const textContent = `Hallo${userName ? ` ${userName}` : ""},

wir haben deine Abmeldung vom Newsletter von ${variables.siteName} erhalten und bestätigt.

Du wirst keine weiteren Newsletter-E-Mails von uns erhalten.

Falls du deine Meinung änderst, kannst du dich jederzeit wieder anmelden:
${subscribeLink}

Wir danken dir für dein Interesse an ${variables.siteName}.

Viele Grüße,
Dein ${variables.siteName}-Team`;

	return {
		html: createHtmlEmail(htmlContent, variables),
		text: createTextEmail(textContent, variables),
		subject: subject,
	};
}

// Konstante für den Template-Namen
export const templateName = "newsletter-unsubscription";

// Standard-Export für einfache Verwendung in den Projekten
export const template = generateNewsletterUnsubscriptionTemplate;
