<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import Bell from '@lucide/svelte/icons/bell';
	import Lock from '@lucide/svelte/icons/lock';
	import User from '@lucide/svelte/icons/user';
	import Mail from '@lucide/svelte/icons/mail';
</script>

<div class="space-y-6">
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<User class="h-5 w-5" />
				Профилни настройки
			</Card.Title>
			<Card.Description>Управлявайте информацията за вашия профил</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-muted-foreground">
				Профилните настройки ще бъдат налични скоро. Тук ще можете да редактирате името си и друга
				лична информация.
			</p>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Lock class="h-5 w-5" />
				Сигурност
			</Card.Title>
			<Card.Description>Променете паролата и настройките за сигурност</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-muted-foreground">
				Функциите за сигурност ще бъдат налични скоро. Тук ще можете да промените паролата си.
			</p>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Bell class="h-5 w-5" />
				Известия
			</Card.Title>
			<Card.Description>Управлявайте вашите предпочитания за известия</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-muted-foreground">
				Настройките за известия ще бъдат налични скоро. Тук ще можете да управлявате как и кога да
				получавате известия.
			</p>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Mail class="h-5 w-5" />
				Имейл настройки
			</Card.Title>
			<Card.Description>Управлявайте вашите имейл предпочитания</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-muted-foreground">
				Имейл настройките ще бъдат налични скоро. Тук ще можете да управлявате вашите предпочитания
				за имейл комуникация.
			</p>
		</Card.Content>
	</Card.Root>
</div>
