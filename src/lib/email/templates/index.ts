/**
 * Zentrale Exportdatei für alle E-Mail-Templates
 */
import { TemplateVariables } from "./base";
import * as loginTemplate from "./magic-link-login";
import * as registerTemplate from "./magic-link-register";
import * as newsletterSubscriptionTemplate from "./newsletter-subscription";
import * as newsletterUnsubscriptionTemplate from "./newsletter-unsubscription";

export * from "./base";
// Exportiere nur die Typen und Interfaces, nicht die Funktionen mit gleichem Namen
export type { MagicLinkLoginVariables } from "./magic-link-login";
export type { MagicLinkRegisterVariables } from "./magic-link-register";
export type { NewsletterSubscriptionVariables } from "./newsletter-subscription";
export type { NewsletterUnsubscriptionVariables } from "./newsletter-unsubscription";

// Map mit allen verfügbaren Templates und ihrer Generierungsfunktionen
export const templates: Record<
	string,
	{
		generate: (variables: any) => { html: string; text: string; subject: string };
		name: string;
	}
> = {
	"magic-link-login": {
		generate: loginTemplate.generateMagicLinkLoginTemplate,
		name: loginTemplate.templateName,
	},
	"magic-link-register": {
		generate: registerTemplate.generateMagicLinkRegisterTemplate,
		name: registerTemplate.templateName,
	},
	"newsletter-subscription": {
		generate: newsletterSubscriptionTemplate.generateNewsletterSubscriptionTemplate,
		name: newsletterSubscriptionTemplate.templateName,
	},
	"newsletter-unsubscription": {
		generate: newsletterUnsubscriptionTemplate.generateNewsletterUnsubscriptionTemplate,
		name: newsletterUnsubscriptionTemplate.templateName,
	},
};

// Hilfsfunktion zum Laden eines Templates
export function getTemplate(name: string) {
	if (!templates[name]) {
		throw new Error(`Template '${name}' nicht gefunden`);
	}
	return templates[name];
}

// Hilfsfunktion zum Erstellen einer E-Mail aus einem Template
export function createEmailFromTemplate<T extends TemplateVariables>(templateName: string, variables: T): { html: string; text: string; subject: string } {
	const template = getTemplate(templateName);
	return template.generate(variables);
}
