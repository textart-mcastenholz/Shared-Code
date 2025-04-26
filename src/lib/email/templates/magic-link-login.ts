/**
 * E-Mail-Template für Magic Link zum Login (für bereits registrierte Nutzer)
 */
import { TemplateVariables, createHtmlEmail, createTextEmail } from "./base";
import { getBaseUrl } from "../client/email";

export interface MagicLinkLoginVariables extends TemplateVariables {
	email: string;
	token: string;
	userName?: string;
	validityMinutes?: number;
	customLinkPath?: string;
	buttonText?: string;
}

export function generateMagicLinkLoginTemplate(variables: MagicLinkLoginVariables): { html: string; text: string; subject: string } {
	// Standard-Werte setzen
	const userName = variables.userName || "";
	const validityMinutes = variables.validityMinutes || 15;
	const buttonText = variables.buttonText || `Bei ${variables.siteName} anmelden`;
	const baseUrl = getBaseUrl();

	// Link generieren
	const linkPath = variables.customLinkPath || "/auth/verify";
	const magicLink = `${baseUrl}${linkPath}?token=${variables.token}&type=login`;

	// Betreff generieren
	const subject = `Dein Login-Link für ${variables.siteName}`;
	variables.headerTitle = `Login bei ${variables.siteName}`;

	// HTML-Content generieren
	const htmlContent = `
        <p>Hallo${userName ? ` ${userName}` : ""},</p>
        
        <p>hier ist dein persönlicher Login-Link für ${variables.siteName}:</p>
        
        <p style="text-align: center;">
            <a href="${magicLink}" class="button">${buttonText}</a>
        </p>
        
        <p>Falls der Button nicht funktioniert, kopiere bitte diesen Link in deinen Browser:</p>
        
        <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
            ${magicLink}
        </p>
        
        <p>Der Link ist ${validityMinutes} Minuten gültig und kann nur einmal verwendet werden.</p>
        
        <p>Falls du keinen Login angefordert hast, kannst du diese E-Mail ignorieren.</p>
        
        <p>Viele Grüße,<br>
        Dein ${variables.siteName}-Team</p>
    `;

	// Text-Content generieren
	const textContent = `Hallo${userName ? ` ${userName}` : ""},

hier ist dein persönlicher Login-Link für ${variables.siteName}:

${magicLink}

Der Link ist ${validityMinutes} Minuten gültig und kann nur einmal verwendet werden.

Falls du keinen Login angefordert hast, kannst du diese E-Mail ignorieren.

Viele Grüße,
Dein ${variables.siteName}-Team`;

	return {
		html: createHtmlEmail(htmlContent, variables),
		text: createTextEmail(textContent, variables),
		subject: subject,
	};
}

// Konstante für den Template-Namen - wir vermeiden hier den export von "template" als Funktion
export const templateName = "magic-link-login";
