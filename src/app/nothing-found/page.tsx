"use client";
import { Box, Container, Typography, Button } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NothingFound() {
	const router = useRouter();
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		// Prüfen, ob der Nutzer ein Admin ist (hat bereits Zugriff erhalten)
		const hasDevAccess = sessionStorage.getItem("devAccessGranted") === "true";
		setIsAdmin(hasDevAccess);
	}, []);

	// Funktion, um zur Homepage mit dem speziellen Parameter zurückzukehren
	const handleAdminReturn = () => {
		router.push("/?only4us=1");
	};

	return (
		<Box display="flex" flexDirection="column" height="100vh" textAlign="center" justifyContent="center">
			<Container maxWidth="md">
				<Image src={"/images/backgrounds/errorimg.svg"} alt="404" width={500} height={500} style={{ width: "100%", maxWidth: "500px", maxHeight: "500px" }} />
				<Typography align="center" variant="h1" mb={4}>
					Nothing Found!
				</Typography>
				<Typography align="center" variant="h4" mb={4}>
					The content you are looking for is not available at this time.
				</Typography>

				{isAdmin ? (
					// Zeige diesen Button nur für Admins
					<Button color="primary" variant="contained" onClick={handleAdminReturn} disableElevation sx={{ mr: 2 }}>
						Return to Developer View
					</Button>
				) : null}

				<Button color="primary" variant="outlined" component={Link} href="/" disableElevation>
					Go Back to Home
				</Button>
			</Container>
		</Box>
	);
}
