/**
 * Basisstruktur für alle E-Mail-Templates
 *
 * Dieses Template bietet eine gemeinsame Struktur, die von allen E-Mail-Templates verwendet werden kann.
 * Projekte können dieses Template erweitern und eigene Header, Logos und Footer definieren.
 */

export interface TemplateVariables {
	siteName: string;
	year?: number;
	color?: {
		primary: string;
		secondary: string;
		background: string;
		text: string;
	};
	[key: string]: any;
}

export interface TemplateData {
	html: string;
	text: string;
	subject: string;
}

// Standard-Farben für alle Templates
export const defaultColors = {
	primary: "#007bff",
	secondary: "#6c757d",
	background: "#f8f9fa",
	text: "#212529",
};

// Erzeugt den Standard-HTML-Header für eine E-Mail
export function getBaseHtmlHeader(variables: TemplateVariables): string {
	const colors = variables.color || defaultColors;

	return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${variables.subject || variables.siteName}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: ${colors.text};
            background-color: ${colors.background};
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border: 1px solid #e4e4e4;
            border-radius: 5px;
        }
        .header {
            background-color: ${colors.primary};
            padding: 20px;
            text-align: center;
            color: white;
            border-radius: 5px 5px 0 0;
        }
        .content {
            padding: 20px;
        }
        .button {
            display: inline-block;
            background-color: ${colors.primary};
            color: white !important;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 4px;
            margin: 20px 0;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: ${colors.secondary};
            border-top: 1px solid #e4e4e4;
            padding-top: 20px;
        }
        a {
            color: ${colors.primary};
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{headerTitle}}</h1>
        </div>
        <div class="content">
`;
}

// Erzeugt den Standard-HTML-Footer für eine E-Mail
export function getBaseHtmlFooter(variables: TemplateVariables): string {
	const year = variables.year || new Date().getFullYear();

	return `
        </div>
        <div class="footer">
            <p>&copy; ${year} ${variables.siteName}. Alle Rechte vorbehalten.</p>
            <p>Dies ist eine automatisch generierte E-Mail, bitte antworten Sie nicht darauf.</p>
        </div>
    </div>
</body>
</html>
`;
}

// Erzeugt den Standard-Plaintext-Header für eine E-Mail
export function getBaseTextHeader(variables: TemplateVariables): string {
	return `${variables.siteName}
${"-".repeat(variables.siteName.length)}

`;
}

// Erzeugt den Standard-Plaintext-Footer für eine E-Mail
export function getBaseTextFooter(variables: TemplateVariables): string {
	const year = variables.year || new Date().getFullYear();

	return `

--
© ${year} ${variables.siteName}. Alle Rechte vorbehalten.
Dies ist eine automatisch generierte E-Mail, bitte antworten Sie nicht darauf.`;
}

// Kombiniert HTML-Header, Inhalt und Footer
export function createHtmlEmail(content: string, variables: TemplateVariables, customHeader?: string, customFooter?: string): string {
	const header = customHeader || getBaseHtmlHeader(variables);
	const footer = customFooter || getBaseHtmlFooter(variables);

	// Ersetze den Platzhalter für den Header-Titel
	let processedHeader = header.replace("{{headerTitle}}", variables.headerTitle || variables.siteName);

	return processedHeader + content + footer;
}

// Kombiniert Text-Header, Inhalt und Footer
export function createTextEmail(content: string, variables: TemplateVariables, customHeader?: string, customFooter?: string): string {
	const header = customHeader || getBaseTextHeader(variables);
	const footer = customFooter || getBaseTextFooter(variables);

	return header + content + footer;
}
