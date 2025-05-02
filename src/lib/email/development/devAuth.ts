import { serverDebug } from "../../../utils/debug";

interface DevLoginOptions {
	userId?: string;
	email: string;
	isAdmin?: boolean;
	name?: string;
	redirectPath?: string;
}

/**
 * Entwicklungsmodus: Authentifizierung ohne E-Mail-Versand
 * Erstellt eine simulierte Verify-URL, die sofort zur Authentifizierung verwendet werden kann
 */
export function createDevLoginUrl(options: DevLoginOptions): string {
	// Einfache Validierung
	if (!options.email || !options.email.includes("@")) {
		throw new Error("Ungültige E-Mail-Adresse für DevLogin");
	}

	// Erstellt ein simuliertes Token mit vordefinierten Werten
	// Format: DEV_TOKEN-[email]-[isAdmin]-[userId]
	const devToken = `DEV_TOKEN-${options.email}-${options.isAdmin ? "1" : "0"}-${options.userId || "auto"}`;

	// Basis-URL für die Weiterleitung
	const baseUrl = process.env.DOMAIN_URL || process.env.NEXTAUTH_URL || "http://localhost:3002";

	// Standardmäßig zur normalen Verify-Route weiterleiten
	const redirectPath = options.redirectPath || "/api/auth/verify";

	// Parameter für die Weiterleitung erstellen
	const params = new URLSearchParams({
		token: devToken,
		type: "login",
		dev: "true",
	});

	// Wenn ein Name angegeben wurde, diesen hinzufügen
	if (options.name) {
		params.append("name", options.name);
	}

	// URL für Debug-Zwecke ausgeben
	const verifyUrl = `${baseUrl}${redirectPath}?${params.toString()}`;
	serverDebug(1, `[DevAuth] Login-URL für Entwicklung generiert: ${verifyUrl}`);

	return verifyUrl;
}

/**
 * Überprüft, ob es sich um ein Entwicklungs-Token handelt
 */
export function isDevToken(token: string): boolean {
	return token.startsWith("DEV_TOKEN-");
}

/**
 * Parsed ein Entwicklungs-Token und extrahiert die Informationen
 */
export function parseDevToken(token: string): DevLoginOptions | null {
	try {
		if (!isDevToken(token)) return null;

		// DEV_TOKEN-[email]-[isAdmin]-[userId]
		const parts = token.split("-");
		if (parts.length < 4) return null;

		return {
			email: parts[1],
			isAdmin: parts[2] === "1",
			userId: parts[3] !== "auto" ? parts[3] : undefined,
		};
	} catch (error) {
		serverDebug(1, "[DevAuth] Fehler beim Parsen des Dev-Tokens:", error);
		return null;
	}
}
