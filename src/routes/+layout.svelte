<script lang="ts">
	import { PUBLIC_HOST } from '$env/static/public';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { ModeWatcher } from 'mode-watcher';
	import { page } from '$app/state';
	import { DEFAULT_SEO_DESCRIPTION, DEFAULT_SEO_TITLE } from '$lib/utils/constants';
	import '../app.css';
	import DefaultSeoImage from '$lib/assets/images/team.png';
	// import LogoSeo from '$lib/assets/images/logo-seo.png';

	let { children, data } = $props();

	$effect(() => {
		console.log(
			`%c###########################################################\n#%c Здравей,                                                %c#\n#%c Търсим си Web разработчик. Ако ти харесва, това, което  %c#\n#%c виждаш и искаш да работиш в екип с тези технологии,     %c#\n#%c можеш да се свържеш с нас на office@webdevlimited.bg    %c#\n###########################################################`,
			'color: #3F73ED; background-color: #BBDBFD',
			'color: white; background-color: #2A2A2A;',
			'color: #3F73ED; background-color: #BBDBFD',
			'color: white; background-color: #2A2A2A',
			'color: #3F73ED; background-color: #BBDBFD',
			'color: white; background-color: #2A2A2A',
			'color: #3F73ED; background-color: #BBDBFD',
			'color: white; background-color: #2A2A2A',
			'color: #3F73ED; background-color: #BBDBFD'
		);

		console.log(
			`%c УЕБ ДЕВ ЛИМИТЕД / WEB DEV LIMITED `,
			'color: white; background-color: #2A2A2A; font-weight: 900; font-size: 3rem; text-align: center; padding: 20px 10px 20px 10px'
		);
	});
</script>

<svelte:head>
	<link rel="alternate" hreflang="x-default" href={PUBLIC_HOST} />

	<title>{page.data.title ?? DEFAULT_SEO_TITLE}</title>

	<meta name="description" content={page.data.description ?? DEFAULT_SEO_DESCRIPTION} />

	<!-- Twitter -->

	<meta name="twitter:card" content="summary_large_image" />

	<!-- OG -->
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={DEFAULT_SEO_TITLE} />
	<meta property="og:locale" content="bg" />
	<meta property="og:url" content={page.url.toString()} />

	<meta property="og:title" content={page.data.title ?? DEFAULT_SEO_TITLE} />
	<meta property="og:description" content={page.data.description ?? DEFAULT_SEO_DESCRIPTION} />
	<meta property="og:image" content={page.data.ogImage ?? DefaultSeoImage} />
</svelte:head>

<ModeWatcher defaultMode="dark"></ModeWatcher>

<Toaster richColors closeButton />

<Tooltip.Provider>
	{@render children?.()}
</Tooltip.Provider>
