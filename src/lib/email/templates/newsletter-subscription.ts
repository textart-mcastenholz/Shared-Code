/**
 * E-Mail-Template für Newsletter-Anmeldung-Bestätigung
 */
import { TemplateVariables, createHtmlEmail, createTextEmail } from "./base";
import { getBaseUrl } from "../client/email";

export interface NewsletterSubscriptionVariables extends TemplateVariables {
	email: string;
	unsubscribeToken?: string;
	userName?: string;
	customUnsubscribePath?: string;
}

export function generateNewsletterSubscriptionTemplate(variables: NewsletterSubscriptionVariables): { html: string; text: string; subject: string } {
	// Standard-Werte setzen
	const userName = variables.userName || "";
	const baseUrl = getBaseUrl();

	// Abmelde-Link generieren (falls Token vorhanden)
	const unsubscribePath = variables.customUnsubscribePath || "/newsletter/unsubscribe";
	const unsubscribeLink = variables.unsubscribeToken ? `${baseUrl}${unsubscribePath}?token=${variables.unsubscribeToken}&email=${encodeURIComponent(variables.email)}` : "";

	// Betreff generieren
	const subject = `Newsletter-Anmeldung bei ${variables.siteName}`;
	variables.headerTitle = `Newsletter von ${variables.siteName}`;

	// HTML-Content generieren
	const htmlContent = `
        <p>Hallo${userName ? ` ${userName}` : ""},</p>
        
        <p>vielen Dank für deine Anmeldung zum Newsletter von ${variables.siteName}!</p>
        
        <p>Du erhältst ab jetzt regelmäßig Informationen zu unseren neuesten Angeboten, Produkten und Events.</p>
        
        ${
					unsubscribeLink
						? `
        <p>Falls du den Newsletter wieder abbestellen möchtest, klicke bitte auf den folgenden Link:</p>
        
        <p><a href="${unsubscribeLink}">Newsletter abbestellen</a></p>
        `
						: ""
				}
        
        <p>Viele Grüße,<br>
        Dein ${variables.siteName}-Team</p>
    `;

	// Text-Content generieren
	const textContent = `Hallo${userName ? ` ${userName}` : ""},

vielen Dank für deine Anmeldung zum Newsletter von ${variables.siteName}!

Du erhältst ab jetzt regelmäßig Informationen zu unseren neuesten Angeboten, Produkten und Events.
${
	unsubscribeLink
		? `
Falls du den Newsletter wieder abbestellen möchtest, besuche bitte den folgenden Link:

${unsubscribeLink}
`
		: ""
}
Viele Grüße,
Dein ${variables.siteName}-Team`;

	return {
		html: createHtmlEmail(htmlContent, variables),
		text: createTextEmail(textContent, variables),
		subject: subject,
	};
}

// Konstante für den Template-Namen
export const templateName = "newsletter-subscription";
