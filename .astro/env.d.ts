declare module 'astro:env/client' {
	export const PUBLIC_TURNSTILE_SITE_KEY: string;	
	export const PUBLIC_SITE_INDEXING_ENABLED: boolean;	
}declare module 'astro:env/server' {
	export const RESEND_API_KEY: string | undefined;	
	export const QUOTE_FROM_EMAIL: string | undefined;	
	export const QUOTE_TO_EMAIL: string | undefined;	
	export const TURNSTILE_SECRET_KEY: string | undefined;	
}