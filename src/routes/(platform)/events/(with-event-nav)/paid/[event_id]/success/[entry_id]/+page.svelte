<!-- payment success page -->

<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { DateFormatter } from '@internationalized/date';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import CheckCircle from '@lucide/svelte/icons/check-circle';

	let { data } = $props();

	const df = new DateFormatter('bg', {
		dateStyle: 'full',
		timeStyle: 'short',
		hour12: false
	});
</script>

<svelte:head>
	<title>Успешно плащане | {data.paidEvent.name} | BRAAND</title>
	<meta name="description" content="Успешно плащане за събитие {data.paidEvent.name}" />
</svelte:head>

<div class="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
	<CheckCircle class="text-primary mb-4 h-16 w-16" />
	<h1 class="heading-font text-titles mb-4 text-3xl font-bold">Благодарим Ви за записването!</h1>

	<p class="text-muted-foreground mb-2">
		Вашата регистрация за събитието <strong>{data.paidEvent.name}</strong> е успешна.
	</p>
	<p class="text-muted-foreground mb-2">
		Дата и час на събитието: {df.format(new Date(data.paidEvent.date))}
	</p>
	<p class="text-muted-foreground mb-6">
		Ще получите имейл с потвърждение и допълнителна информация.
	</p>
	<div class="flex flex-wrap items-center justify-center gap-3">
		<Button href="/events/paid">
			<ArrowLeft />
			Върни се към предстоящите събития
		</Button>
	</div>
</div>
