<script lang="ts">
	import * as Alert from '$lib/components/ui/alert/index';
	import Button from '$lib/components/ui/button/button.svelte';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
</script>

<div class="my-6 grid place-items-center">
	<h1 class="text-3xl font-bold">Успешна регистрация на администратор</h1>
	<Alert.Root class="mx-2 my-6 w-auto border-green-600">
		<CircleCheck class="size-4" />
		<div class="flex flex-col items-center gap-2">
			<div>
				<Alert.Title>Успешна регистрация</Alert.Title>
				<Alert.Description>
					<div>На посочения имейл са изпратени данните за вход в системата.</div>
				</Alert.Description>
			</div>
			<Button size={'sm'} class="w-full" href="/control-centre-v1/staff">Назад</Button>
		</div>
	</Alert.Root>
</div>
