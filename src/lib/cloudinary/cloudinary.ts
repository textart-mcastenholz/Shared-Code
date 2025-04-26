import { v2 as cloudinary } from "cloudinary";
import { serverDebug } from "../../utils/debug";

// Cloudinary Konfiguration
export function configureCloudinary() {
	cloudinary.config({
		cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
		api_key: process.env.CLOUDINARY_API_KEY || "",
		api_secret: process.env.CLOUDINARY_API_SECRET || "",
		secure: true,
	});
}

// Initialisierung beim Import
configureCloudinary();

// Definiere den Debug-Level für Cloudinary-Operationen
export const CLOUDINARY_DEBUG_LEVEL = 5; // Gleicher Level wie Menü-System

// Typ-Definition für Bild-Upload-Response
export interface CloudinaryUploadResult {
	publicId: string;
	url: string;
	secureUrl: string;
	width: number;
	height: number;
	format: string;
	resourceType: string;
	createdAt: Date;
}

// Bild in Cloudinary hochladen
export async function uploadImage(
	file: Buffer | string,
	options: {
		folder?: string;
		publicId?: string;
		tags?: string[];
		transformation?: any[];
	} = {}
): Promise<CloudinaryUploadResult> {
	try {
		serverDebug(CLOUDINARY_DEBUG_LEVEL, "Bild wird zu Cloudinary hochgeladen", options);

		// Standardoptionen setzen
		const uploadOptions = {
			folder: options.folder || "menu-items",
			public_id: options.publicId,
			tags: options.tags || [],
			transformation: options.transformation || [{ width: 800, height: 800, crop: "limit" }],
			resource_type: "auto" as "auto",
		};

		const result = await new Promise((resolve, reject) => {
			// Bei Base64-String oder Buffer-Upload
			cloudinary.uploader.upload(
				typeof file === "string" && file.startsWith("data:")
					? file
					: typeof file === "string"
					? file // URL
					: `data:image/png;base64,${file.toString("base64")}`, // Buffer zu Base64
				uploadOptions,
				(error, result) => {
					if (error) reject(error);
					else resolve(result);
				}
			);
		});

		// Result auf TypeScript-Interface mappen
		const typedResult = result as any;

		serverDebug(CLOUDINARY_DEBUG_LEVEL, "Bild erfolgreich hochgeladen", {
			publicId: typedResult.public_id,
			url: typedResult.url,
		});

		return {
			publicId: typedResult.public_id,
			url: typedResult.url,
			secureUrl: typedResult.secure_url,
			width: typedResult.width,
			height: typedResult.height,
			format: typedResult.format,
			resourceType: typedResult.resource_type,
			createdAt: new Date(typedResult.created_at),
		};
	} catch (error) {
		serverDebug(CLOUDINARY_DEBUG_LEVEL, "Fehler beim Hochladen des Bildes:", error);
		throw error;
	}
}

// Bild aus Cloudinary löschen
export async function deleteImage(publicId: string): Promise<boolean> {
	try {
		serverDebug(CLOUDINARY_DEBUG_LEVEL, "Bild wird aus Cloudinary gelöscht", { publicId });

		const result = await new Promise<any>((resolve, reject) => {
			cloudinary.uploader.destroy(publicId, (error, result) => {
				if (error) reject(error);
				else resolve(result);
			});
		});

		const success = result.result === "ok";
		serverDebug(CLOUDINARY_DEBUG_LEVEL, `Bild ${success ? "erfolgreich" : "nicht"} gelöscht`);

		return success;
	} catch (error) {
		serverDebug(CLOUDINARY_DEBUG_LEVEL, "Fehler beim Löschen des Bildes:", error);
		throw error;
	}
}

// Generiere eine signierte URL für ein Bild
export function getImageUrl(
	publicId: string,
	options: {
		width?: number;
		height?: number;
		crop?: string;
		quality?: number;
		format?: string;
	} = {}
): string {
	const transformations: Array<Record<string, any>> = [];

	if (options.width || options.height) {
		transformations.push({
			width: options.width,
			height: options.height,
			crop: options.crop || "fill",
		});
	}

	if (options.quality) {
		transformations.push({ quality: options.quality });
	}

	if (options.format) {
		transformations.push({ fetch_format: options.format });
	}

	return cloudinary.url(publicId, {
		secure: true,
		transformation: transformations,
	});
}

// Hilfsfunktion zum Formatieren von Namen für public_id
export function formatNameForPublicId(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

// Allgemeine Menüspezifische Image-Upload-Funktion
export async function uploadMenuItemImage(file: Buffer | string, itemName: string): Promise<CloudinaryUploadResult> {
	const formattedName = formatNameForPublicId(itemName);

	return uploadImage(file, {
		folder: "menu-items",
		publicId: `menu-item-${formattedName}-${Date.now()}`,
		tags: ["menu", "food"],
		transformation: [{ width: 800, height: 800, crop: "limit", quality: "auto" }],
	});
}

// Allgemeine Menükategorie-Image-Upload-Funktion
export async function uploadMenuCategoryImage(file: Buffer | string, categoryName: string): Promise<CloudinaryUploadResult> {
	const formattedName = formatNameForPublicId(categoryName);

	return uploadImage(file, {
		folder: "menu-categories",
		publicId: `category-${formattedName}-${Date.now()}`,
		tags: ["menu", "category"],
		transformation: [{ width: 600, height: 400, crop: "fill", quality: "auto" }],
	});
}
