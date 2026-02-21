<script lang="ts">
	import Calendar from '@lucide/svelte/icons/calendar';
	import Mail from '@lucide/svelte/icons/mail';
	import Check from '@lucide/svelte/icons/check';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Form from '$lib/components/ui/form';
	import { DateFormatter } from '@internationalized/date';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';
	import { registerForEventSchema } from './schema.js';
	import RenderStyledHtml from '$lib/components/RenderStyledHtml.svelte';

	let { data, form } = $props();

	const df = new DateFormatter('bg', {
		dateStyle: 'full',
		timeStyle: 'short',
		hour12: false
	});

	const registerForm = superForm(data.registerForm, {
		resetForm: true,
		validators: zod4Client(registerForEventSchema),
		dataType: 'json'
	});

	const { form: formData, delayed, enhance } = registerForm;

	$formData.eventId = data.event.id;

	if (data.user) {
		$formData.email = data.user.email;
		$formData.name = data.user.firstName + ' ' + data.user.lastName;
	}

	function isEventUpcoming(eventDate: Date): boolean {
		return new Date(eventDate) > new Date();
	}

	let registered = $state(data.isUserRegistered);

	$effect(() => {
		if (form?.message) {
			if (form.form.valid) {
				toast.success(form.message);
				registered = true;
			} else {
				toast.error(form.message);
			}
		}
	});
</script>

<svelte:head>
	<title>{data.event.name} | BRAAND</title>
	<meta name="description" content={data.event.description || 'Образователно събитие'} />
</svelte:head>

<div class="mx-auto max-w-4xl">
	<Button href="/events/public" variant="outline" class="mb-6">
		<ArrowLeft /> Назад към всички събития</Button
	>

	{#if data.event.posterFile}
		<div class="mb-8 aspect-video w-full overflow-hidden rounded-lg">
			<img
				src="/api/file/{data.event.posterFile.fileKey}"
				alt={data.event.name}
				class="h-full w-full object-cover"
			/>
		</div>
	{/if}

	<div class="mb-6">
		<Badge variant={isEventUpcoming(data.event.date) ? 'default' : 'secondary'} class="mb-4">
			{isEventUpcoming(data.event.date) ? 'Предстоящо събитие' : 'Приключило събитие'}
		</Badge>
		<h1 class="heading-font text-titles mb-4 text-3xl font-bold md:text-4xl">
			{data.event.name}
		</h1>
	</div>

	<div class="grid gap-6 lg:grid-cols-3">
		<Card.Root class="lg:col-span-2">
			<Card.Header>
				<Card.Title>Детайли за събитието</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="flex items-start">
					<Calendar class="text-muted-foreground mt-1 mr-3 h-5 w-5 shrink-0" />
					<div>
						<p class="font-medium">Дата и час</p>
						<p class="text-muted-foreground">{df.format(new Date(data.event.date))}</p>
					</div>
				</div>

				{#if data.event.description}
					<div class="border-t pt-4">
						<h3 class="mb-2 font-medium">Описание</h3>
						<RenderStyledHtml class="max-sm:[&_a]:break-all">
							{@html data.event.description}
						</RenderStyledHtml>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root class="lg:col-span-1">
			<Card.Header>
				<Card.Title>Запиши се</Card.Title>
				<Card.Description>
					{#if isEventUpcoming(data.event.date)}
						Въведете вашия имейл, за да се запишете за събитието
					{:else}
						Това събитие не приема нови регистрации
					{/if}
				</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if registered}
					<div
						class="bg-muted flex items-center gap-3 rounded-lg border p-4 text-center text-green-700 dark:text-green-500"
					>
						<Check class="h-5 w-5 shrink-0" />
						<p class="text-sm">Успешно сте записани за това събитие!</p>
					</div>
				{:else if isEventUpcoming(data.event.date)}
					<form action="?/register" method="POST" use:enhance class="space-y-4">
						<Form.Field form={registerForm} name="email">
							<Form.Control>
								{#snippet children({ props })}
									<Label for="email">Имейл адрес</Label>
									{#if data.user}
										<div
											class="border-input bg-background selection:bg-primary dark:bg-input/30 selection:text-primary-foreground ring-offset-background placeholder:text-muted-foreground flex h-9 w-full min-w-0 cursor-not-allowed items-center rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
										>
											{data.user.email}
										</div>
									{:else}
										<Input
											{...props}
											id="email"
											type="email"
											placeholder="your@email.com"
											bind:value={$formData.email}
											disabled={$delayed}
											required
										/>
									{/if}
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field form={registerForm} name="name">
							<Form.Control>
								{#snippet children({ props })}
									<Label for="name">Име на участника</Label>

									<Input
										{...props}
										id="name"
										type="text"
										bind:value={$formData.name}
										disabled={$delayed}
										required
									/>
								{/snippet}
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Button type="submit" class="w-full" disabled={$delayed}>
							<Mail class="mr-2 h-4 w-4" />
							Запиши се
						</Button>

						<p class="text-muted-foreground text-xs">
							На посочения имейл ще получите покана за събитието.
						</p>
					</form>
				{:else}
					<p class="text-muted-foreground text-center text-sm">
						Записването за това събитие вече не е възможно
					</p>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>
