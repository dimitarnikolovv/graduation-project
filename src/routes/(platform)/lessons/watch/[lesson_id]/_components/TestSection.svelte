<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import type { SessionValidationResult } from '$lib/server/auth';
	import type { FetchExpandedLessonResult } from '$lib/server/db-querying/lessons';

	type Props = {
		test: Exclude<Exclude<FetchExpandedLessonResult, undefined>['test'], null>;
		user: SessionValidationResult['user'] | null;
	};

	let { test, user }: Props = $props();
</script>

<div class="space-y-4">
	<h2 class="text-foreground flex items-center gap-3 text-2xl font-bold">
		<div class="bg-primary h-8 w-1 rounded-full"></div>
		Тест към урока
	</h2>

	<p class="text-muted-foreground">
		Този урок съдържа тест, който можете да направите, за да проверите знанията си.
	</p>

	{#if user}
		<a
			class="block w-full mx-auto text-center bg-blue-600 text-white px-6 py-3 rounded-full sm:w-fit transition-colors hover:bg-blue-700"
			href="/tests/{test.id}/start"
		>
			Започни теста
		</a>
	{:else}
		<div class="mb-4 rounded-md border border-dashed bg-secondary/50 p-4 flex flex-col gap-3">
			<p class="text-center text-sm text-muted-foreground">
				Моля, влезте в профила си, за да направите теста.
			</p>

			<Button class="mx-auto" size="sm" href="/login">Вход</Button>
		</div>
	{/if}
</div>
