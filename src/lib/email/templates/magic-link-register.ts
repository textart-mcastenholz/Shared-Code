/**
 * E-Mail-Template für Magic Link zur Registrierung
 */
import { TemplateVariables, createHtmlEmail, createTextEmail } from "./base";
import { getBaseUrl } from "../client/email";

export interface MagicLinkRegisterVariables extends TemplateVariables {
	email: string;
	token: string;
	userName?: string;
	validityMinutes?: number;
	customLinkPath?: string;
	buttonText?: string;
}

export function generateMagicLinkRegisterTemplate(variables: MagicLinkRegisterVariables): { html: string; text: string; subject: string } {
	// Standard-Werte setzen
	const userName = variables.userName || "";
	const validityMinutes = variables.validityMinutes || 15;
	const buttonText = variables.buttonText || `Bei ${variables.siteName} registrieren`;
	const baseUrl = getBaseUrl();

	// Link generieren
	const linkPath = variables.customLinkPath || "/auth/verify";
	const magicLink = `${baseUrl}${linkPath}?token=${variables.token}&type=register`;

	// Betreff generieren
	const subject = `Registrierung bei ${variables.siteName}`;
	variables.headerTitle = `Willkommen bei ${variables.siteName}`;

	// HTML-Content generieren
	const htmlContent = `
        <p>Hallo${userName ? ` ${userName}` : ""},</p>
        
        <p>vielen Dank für deine Registrierung bei ${variables.siteName}! Um deinen Account zu aktivieren, 
        klicke bitte auf den folgenden Button:</p>
        
        <p style="text-align: center;">
            <a href="${magicLink}" class="button">${buttonText}</a>
        </p>
        
        <p>Falls der Button nicht funktioniert, kopiere bitte diesen Link in deinen Browser:</p>
        
        <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
            ${magicLink}
        </p>
        
        <p>Der Link ist ${validityMinutes} Minuten gültig und kann nur einmal verwendet werden.</p>
        
        <p>Falls du keine Registrierung angefordert hast, kannst du diese E-Mail ignorieren.</p>
        
        <p>Viele Grüße,<br>
        Dein ${variables.siteName}-Team</p>
    `;

	// Text-Content generieren
	const textContent = `Hallo${userName ? ` ${userName}` : ""},

vielen Dank für deine Registrierung bei ${variables.siteName}! Um deinen Account zu aktivieren, 
klicke bitte auf den folgenden Link:

${magicLink}

Der Link ist ${validityMinutes} Minuten gültig und kann nur einmal verwendet werden.

Falls du keine Registrierung angefordert hast, kannst du diese E-Mail ignorieren.

Viele Grüße,
Dein ${variables.siteName}-Team`;

	return {
		html: createHtmlEmail(htmlContent, variables),
		text: createTextEmail(textContent, variables),
		subject: subject,
	};
}

// Standard-Export für einfache Verwendung in den Projekten
export const template = generateMagicLinkRegisterTemplate;

// Konstante für den Template-Namen
export const templateName = "magic-link-register";
