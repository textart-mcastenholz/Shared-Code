/**
 * Gemeinsames Debug-Utility für alle GX-Projekte
 */

export type FeatureNames = Record<number, string>;

export class DebugUtil {
	private localStorageKey: string;
	private featureNames: FeatureNames;

	constructor(localStorageKey: string = "debug_level", featureNames: FeatureNames = {}) {
		this.localStorageKey = localStorageKey;
		this.featureNames = featureNames;
	}

	// Prüft, ob ein bestimmtes Debug-Feature aktiviert ist
	isDebugEnabled(featureLevel: number): boolean {
		// Funktioniert nur im Browser
		if (typeof window === "undefined") return false;

		try {
			const debugLevel = localStorage.getItem(this.localStorageKey);

			// Wenn kein Debug-Level gesetzt ist, ist Debug deaktiviert
			if (!debugLevel) return false;

			// Debug-Level als Zahl parsen
			const level = parseInt(debugLevel, 10);

			// Prüfen, ob das angeforderte Feature-Level aktiviert ist
			return level === featureLevel || level === 999; // 999 aktiviert alle Debug-Logs
		} catch (error) {
			// Falls localStorage nicht verfügbar ist oder andere Fehler auftreten
			return false;
		}
	}

	// Generische Debug-Funktion
	debug(featureLevel: number, ...args: any[]): void {
		if (this.isDebugEnabled(featureLevel)) {
			const featureName = this.featureNames[featureLevel] || `Feature-${featureLevel}`;
			console.log(`[${featureName} Debug]`, ...args);
		}
	}

	// Server-seitige Debug-Funktion
	serverDebug(featureLevel: number, ...args: any[]): void {
		if (process.env.NODE_ENV !== "production") {
			const featureName = this.featureNames[featureLevel] || `Feature-${featureLevel}`;
			console.log(`[${featureName} Server Debug]`, ...args);
		}
	}

	// Convenience-Methode um spezifische Debug-Funktionen zu erstellen
	createFeatureDebug(featureLevel: number): (...args: any[]) => void {
		return (...args: any[]) => this.debug(featureLevel, ...args);
	}
}

// Factory-Funktion, um eine konfigurierte Debug-Instanz zu erstellen
export function createDebugUtil(
	localStorageKey: string,
	featureNames: FeatureNames
): {
	isDebugEnabled: (featureLevel: number) => boolean;
	debug: (featureLevel: number, ...args: any[]) => void;
	serverDebug: (featureLevel: number, ...args: any[]) => void;
	[key: string]: any;
} {
	const util = new DebugUtil(localStorageKey, featureNames);

	// Basis-Funktionen
	const result = {
		isDebugEnabled: util.isDebugEnabled.bind(util),
		debug: util.debug.bind(util),
		serverDebug: util.serverDebug.bind(util),
	};

	// Für jedes Feature eine spezifische Debug-Funktion erstellen
	Object.entries(featureNames).forEach(([level, name]) => {
		const functionName = `debug${name.replace(/\s+/g, "")}`;
		result[functionName] = (...args: any[]) => util.debug(Number(level), ...args);
	});

	return result;
}

// Standard-Debug-Konfiguration für allgemeine Verwendung
const standardFeatureNames = {
	1: "Auth",
	2: "Profile",
	3: "MongoDB",
	4: "Email",
	// Weitere allgemeine Features...
};

// Standard-Debug-Instanz erstellen
const standardDebug = createDebugUtil("shared_debug_level", standardFeatureNames);

// Standard-Debug-Funktionen exportieren, insbesondere für serverDebug
export const { isDebugEnabled, debug, serverDebug, debugAuth, debugProfile, debugMongoDB, debugEmail } = standardDebug;
