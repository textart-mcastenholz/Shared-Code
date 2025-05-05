"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

// UseAuth muss von der App-spezifischen Implementierung importiert werden
// Daher definieren wir hier einen Typ für die erwartete useAuth-Funktion
type UseAuthReturnType = {
	isAuthenticated: boolean;
	isInitialized: boolean;
	user: { isAdmin?: boolean } | null;
	loading: boolean;
	forceInit: () => void;
};

interface AdminGuardProps {
	children: React.ReactNode;
	useAuth: () => UseAuthReturnType;
	loginPath?: string;
	homePath?: string;
}

/**
 * Guard zur Zugriffssteuerung für Admin-Bereiche
 * Leitet Benutzer ohne Admin-Rechte zur Startseite weiter
 */
const AdminGuard = ({ children, useAuth, loginPath = "/auth/login", homePath = "/" }: AdminGuardProps) => {
	const { isAuthenticated, isInitialized, user, loading, forceInit } = useAuth();
	const router = useRouter();
	const [loadingTime, setLoadingTime] = useState(0);
	const isAdmin = user?.isAdmin === true;

	// Debug logging
	useEffect(() => {
		console.log("AdminGuard render state:", { isAuthenticated, isInitialized, isAdmin, loading });
	}, [isAuthenticated, isInitialized, isAdmin, loading]);

	// Redirect if not admin or not authenticated but initialized
	useEffect(() => {
		if (isInitialized && !loading) {
			if (!isAuthenticated) {
				console.log("Not authenticated, redirecting to login");
				router.push(loginPath);
			} else if (!isAdmin) {
				console.log("Not admin, redirecting to home");
				router.push(homePath);
			}
		}
	}, [isAuthenticated, isInitialized, isAdmin, router, loading, loginPath, homePath]);

	// Track loading time
	useEffect(() => {
		if (!isInitialized || loading) {
			const interval = setInterval(() => {
				setLoadingTime((prev) => prev + 1);
			}, 1000);

			return () => clearInterval(interval);
		}
		return () => {};
	}, [isInitialized, loading]);

	// Show enhanced loading state while checking authentication
	if (!isInitialized || loading) {
		return (
			<Box
				sx={{
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "center",
					height: "100vh",
					backgroundColor: "#f5f5f5",
					p: 3,
				}}
			>
				<CircularProgress size={40} sx={{ mb: 2 }} />
				<Typography variant="body1" sx={{ mb: 1 }}>
					Admin-Berechtigung wird geprüft...
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
					{loadingTime > 10 ? "Dies dauert länger als erwartet" : `Bitte warten (${loadingTime}s)...`}
				</Typography>

				{loadingTime > 10 && (
					<Button variant="outlined" color="primary" onClick={() => forceInit()} sx={{ mt: 2 }}>
						Fortfahren ohne Authentifizierung
					</Button>
				)}
			</Box>
		);
	}

	// Wenn nicht authentifiziert oder kein Admin, nichts anzeigen
	// (Die Weiterleitung übernimmt der useEffect oben)
	if (!isAuthenticated || !isAdmin) {
		return null;
	}

	// Wenn authentifiziert und Admin, Inhalt anzeigen
	return <>{children}</>;
};

export default AdminGuard;
