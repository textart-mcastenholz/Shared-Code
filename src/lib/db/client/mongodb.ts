import { MongoClient, Collection, Db, Document } from "mongodb";
import { serverDebug } from "../../../utils/debug";

// Die MongoDB-Verbindungs-URI
const uri = process.env.MONGODB_URI || "";
if (!uri) {
	throw new Error("Bitte MONGODB_URI in der Umgebungsvariablen festlegen");
}

// Logging der URI ohne Passwort zur Fehlersuche
const uriWithoutPassword = uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:********@");
serverDebug(3, "MongoDB URI (ohne Passwort):", uriWithoutPassword);

// MongoDB-Client-Konfiguration
const options = {
	// Diese Einstellungen könnten je nach Umgebung angepasst werden
	connectTimeoutMS: 10000, // 10 Sekunden Timeout
	serverSelectionTimeoutMS: 10000, // 10 Sekunden Server-Auswahlzeit
	maxPoolSize: 10, // Maximale Anzahl von Verbindungen im Pool
	tls: true, // Aktiviere TLS/SSL
	tlsAllowInvalidCertificates: process.env.NODE_ENV !== "production", // Im Dev-Modus erlauben wir ungültige Zertifikate
};

// Client als einzelne Instanz exportieren
export let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

// Verbindung zur Datenbank herstellen
export async function connectToDatabase(): Promise<Db> {
	try {
		serverDebug(3, "Verbindung zur MongoDB wird hergestellt...", { options });

		if (client) {
			serverDebug(3, "Verwende bestehende MongoDB-Verbindung");
			return client.db();
		}

		if (!clientPromise) {
			serverDebug(3, "Erstelle neue MongoDB-Verbindung");
			client = new MongoClient(uri, options);
			clientPromise = client.connect();
		}

		client = await clientPromise;
		serverDebug(3, "MongoDB-Verbindung erfolgreich hergestellt");

		// Teste die Verbindung mit einem Ping
		const db = client.db();
		await db.command({ ping: 1 });
		serverDebug(3, "MongoDB-Ping erfolgreich");

		return db;
	} catch (error) {
		serverDebug(3, "Fehler beim Verbinden zur MongoDB:", error);

		// Mehr Details zum Fehler loggen
		if (error instanceof Error) {
			serverDebug(3, "Fehlertyp:", error.name);
			serverDebug(3, "Fehlermeldung:", error.message);
			serverDebug(3, "Stack Trace:", error.stack);

			// Spezifische SSL-Fehler erkennen
			if (error.message.includes("SSL") || error.message.includes("TLS")) {
				serverDebug(3, "SSL/TLS-Fehler erkannt. Möglicherweise ein Problem mit der Zertifikatvalidierung oder TLS-Version.");

				// Versuche es erneut mit anderen SSL-Optionen, wenn wir im Development-Modus sind
				if (process.env.NODE_ENV !== "production" && client) {
					try {
						serverDebug(3, "Versuche erneut mit angepassten SSL-Optionen...");

						// Client zurücksetzen
						await client.close();
						client = null;
						clientPromise = null;

						// Neue Optionen mit deaktivierter SSL-Validierung
						const fallbackOptions = {
							...options,
							tlsAllowInvalidCertificates: true,
							tlsAllowInvalidHostnames: true,
							ssl: true,
						};

						serverDebug(3, "Neue Verbindungsoptionen:", fallbackOptions);

						client = new MongoClient(uri, fallbackOptions);
						clientPromise = client.connect();
						client = await clientPromise;

						const db = client.db();
						await db.command({ ping: 1 });

						serverDebug(3, "MongoDB-Verbindung mit Fallback-Optionen erfolgreich hergestellt");
						return db;
					} catch (fallbackError) {
						serverDebug(3, "Auch Fallback-Verbindungsversuch fehlgeschlagen:", fallbackError);
					}
				}
			}
		}

		throw error;
	}
}

// Testverbindung zur Datenbank
export async function testConnection(): Promise<boolean> {
	try {
		const db = await connectToDatabase();
		// Einfache Ping-Operation zur Überprüfung der Verbindung
		await db.command({ ping: 1 });
		serverDebug(3, "MongoDB-Verbindung erfolgreich getestet");
		return true;
	} catch (error) {
		serverDebug(3, "MongoDB-Verbindungstest fehlgeschlagen:", error);
		return false;
	}
}

// Eine Collection abrufen oder erstellen
export function getCollection<T extends Document = Document>(dbName: string, collectionName: string): Collection<T> {
	if (!client) {
		throw new Error("Keine Verbindung zur Datenbank. Bitte zuerst connectToDatabase() aufrufen.");
	}

	return client.db(dbName).collection<T>(collectionName);
}

// Client schließen (nützlich für Tests oder Serverabschaltung)
export async function closeConnection(): Promise<void> {
	if (client) {
		await client.close();
		client = null;
		clientPromise = null;
		serverDebug(3, "MongoDB-Verbindung geschlossen");
	}
}
