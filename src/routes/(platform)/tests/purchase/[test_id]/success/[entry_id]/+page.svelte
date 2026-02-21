<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	import { priceInCentsToRealPrice } from '$lib/utils/prices.js';
	import CheckCircle from '@lucide/svelte/icons/check-circle';

	let { data } = $props();
</script>

<svelte:head>
	<title>Успешно плащане | {data.test?.title ?? 'Тест'}</title>
	<meta name="description" content="Успешна покупка на тест: {data.test.title}" />
</svelte:head>

<div class="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
	<CheckCircle class="text-primary mb-4 h-16 w-16" />
	<h1 class="heading-font text-titles mb-4 text-3xl font-bold">Благодарим Ви за покупката!</h1>
	<p class="text-muted-foreground mb-2">
		Успешно закупихте достъп до теста "<strong>{data.test.title}</strong>".
	</p>
	<p class="text-muted-foreground mb-6">Ще получите имейл с разписка за плащането.</p>
	<div class="flex flex-wrap items-center justify-center gap-3">
		<Button href="/tests/{data.test.id}/start">Започни теста</Button>
	</div>
</div>
