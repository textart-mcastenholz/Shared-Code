/**
 * E-Mail-Template für Admin Magic Link zum Login in das Control Center
 */
import { TemplateVariables, createHtmlEmail, createTextEmail } from "./base";
import { getBaseUrl } from "../client/email";

export interface AdminLoginVariables extends TemplateVariables {
	email: string;
	token: string;
	userName?: string;
	validityMinutes?: number;
	customLinkPath?: string;
	buttonText?: string;
}

export function generateAdminLoginTemplate(variables: AdminLoginVariables): { html: string; text: string; subject: string } {
	// Standard-Werte setzen
	const userName = variables.userName || "";
	const validityMinutes = variables.validityMinutes || 15;
	const buttonText = variables.buttonText || `Control Center Login`;
	const baseUrl = getBaseUrl();

	// Link generieren
	const linkPath = variables.customLinkPath || "/cc/auth/verify";
	const magicLink = `${baseUrl}${linkPath}?token=${variables.token}&type=login`;

	// Betreff generieren
	const subject = `Admin-Login für ${variables.siteName} Control Center`;
	variables.headerTitle = `Control Center Login`;

	// HTML-Content generieren - mit Warnung, dass dies ein Admin-Login ist
	const htmlContent = `
        <div style="background-color: #fef8e8; border-left: 4px solid #f0ad4e; padding: 12px; margin-bottom: 20px;">
            <p style="margin: 0; color: #9b6516; font-weight: bold;">⚠️ Admin-Bereich - Sicherheitshinweis</p>
            <p style="margin: 8px 0 0; color: #9b6516;">Mit diesem Link erhalten Sie Administratorrechte. Geben Sie ihn nicht weiter.</p>
        </div>
        
        <p>Hallo${userName ? ` ${userName}` : ""},</p>
        
        <p>hier ist Ihr persönlicher Login-Link für das <strong>${variables.siteName} Control Center</strong>:</p>
        
        <p style="text-align: center;">
            <a href="${magicLink}" class="button" style="background-color: #d9534f !important;">${buttonText}</a>
        </p>
        
        <p>Falls der Button nicht funktioniert, kopieren Sie bitte diesen Link in Ihren Browser:</p>
        
        <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">
            ${magicLink}
        </p>
        
        <p>Der Link ist ${validityMinutes} Minuten gültig und kann nur einmal verwendet werden.</p>
        
        <p>Falls Sie keinen Login angefordert haben, ignorieren Sie diese E-Mail und informieren Sie bitte umgehend den Administrator.</p>
        
        <p>Mit freundlichen Grüßen,<br>
        Ihr ${variables.siteName}-Team</p>
    `;

	// Text-Content generieren
	const textContent = `ADMIN-BEREICH - SICHERHEITSHINWEIS
Mit diesem Link erhalten Sie Administratorrechte. Geben Sie ihn nicht weiter.

Hallo${userName ? ` ${userName}` : ""},

hier ist Ihr persönlicher Login-Link für das ${variables.siteName} Control Center:

${magicLink}

Der Link ist ${validityMinutes} Minuten gültig und kann nur einmal verwendet werden.

Falls Sie keinen Login angefordert haben, ignorieren Sie diese E-Mail und informieren Sie bitte umgehend den Administrator.

Mit freundlichen Grüßen,
Ihr ${variables.siteName}-Team`;

	return {
		html: createHtmlEmail(htmlContent, variables),
		text: createTextEmail(textContent, variables),
		subject: subject,
	};
}

// Konstante für den Template-Namen
export const templateName = "admin-login";
