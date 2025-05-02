"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";

interface DeveloperAccessGuardProps {
	children: React.ReactNode;
	loadingComponent?: React.ReactNode;
	publicPaths?: string[];
	customRedirectPath?: string;
}

/**
 * Guard-Komponente für Developer-Access
 * Prüft ob der Benutzer Zugriff auf die Entwicklungsversion haben soll
 *
 * @param children Komponenten, die geschützt werden sollen
 * @param loadingComponent Komponente, die während der Prüfung angezeigt wird
 * @param publicPaths Array mit Pfaden, die immer zugänglich sind (ohne Prüfung)
 * @param customRedirectPath Pfad, zu dem bei fehlendem Zugriff umgeleitet wird
 */
export const DeveloperAccessGuard = ({ children, loadingComponent, publicPaths = [], customRedirectPath = "/nothing-found" }: DeveloperAccessGuardProps) => {
	const searchParams = useSearchParams();
	const pathname = usePathname();
	const router = useRouter();
	const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

	useEffect(() => {
		// Prüfe, ob es sich um localhost handelt - dann immer zulassen
		const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

		// Prüfe URL-Parameter oder Session-Storage
		const onlyForUs = searchParams.get("only4us") === "1";
		const hasStoredAccess = sessionStorage.getItem("devAccessGranted") === "true";

		// Standard-Pfade, die immer zugänglich sein sollten
		const defaultPublicPaths = ["/api/", "/not-found", "/nothing-found", "/auth/login"];

		// Kombiniere Standard- und benutzerdefinierte öffentliche Pfade
		const allPublicPaths = [...defaultPublicPaths, ...publicPaths];

		// Prüfe, ob der aktuelle Pfad in den öffentlichen Pfaden enthalten ist
		const isPublicPath = allPublicPaths.some((publicPath) => {
			if (publicPath.endsWith("/")) {
				return pathname.startsWith(publicPath);
			}
			return pathname === publicPath || pathname.includes(publicPath);
		});

		if (isLocalhost) {
			// Auf Localhost immer Zugriff gewähren
			sessionStorage.setItem("devAccessGranted", "true");
			setIsAuthorized(true);
		} else if (isPublicPath) {
			// Öffentliche Pfade sind immer zugänglich
			setIsAuthorized(true);
		} else if (onlyForUs) {
			// Parameter gefunden, setze Zugriffsberechtigung
			sessionStorage.setItem("devAccessGranted", "true");
			setIsAuthorized(true);
		} else if (hasStoredAccess) {
			// Zugriff bereits in Session Storage
			setIsAuthorized(true);
		} else {
			// Kein Zugriff, umleiten
			router.push(customRedirectPath);
			setIsAuthorized(false);
		}
	}, [searchParams, pathname, router, publicPaths, customRedirectPath]);

	// Zeige Ladeanimation während wir prüfen
	if (isAuthorized === null) {
		return <>{loadingComponent}</> || null;
	}

	// Wenn autorisiert, zeige den Inhalt
	return isAuthorized ? <>{children}</> : null;
};

/**
 * Client-seitige Wrapper-Komponente für DeveloperAccessGuard
 * Verhindert Hydration Fehler durch Client-seitige Rendering
 */
export const ClientDeveloperGuard = ({ children, loadingComponent, publicPaths, customRedirectPath }: DeveloperAccessGuardProps) => {
	const [isClient, setIsClient] = useState(false);

	// Umgehung für Hydration-Probleme
	useEffect(() => {
		setIsClient(true);
	}, []);

	// Während der serverseitigen Darstellung oder Hydration gebe die Kinder direkt zurück
	if (!isClient) {
		return <>{children}</>;
	}

	return (
		<DeveloperAccessGuard loadingComponent={loadingComponent} publicPaths={publicPaths} customRedirectPath={customRedirectPath}>
			{children}
		</DeveloperAccessGuard>
	);
};

export default ClientDeveloperGuard;
