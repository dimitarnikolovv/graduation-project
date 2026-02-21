<script lang="ts">
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';
	import * as Table from '$lib/components/ui/table/index';
	import SubjectActions from './subject-actions.svelte';
	import MassActions from './mass-actions.svelte';
	import type { Subject } from '$lib/server/db/schema/subjects';
	import type { PermissionsObject } from '$lib/types/permissions';
	import PaginationResultsInfo from '$lib/components/PaginationResultsInfo.svelte';
	import { page } from '$app/state';

	type Props = {
		subjects: Subject[];
		userPermissions?: PermissionsObject;
	};
	let { subjects, userPermissions }: Props = $props();

	let checked: number[] = $state([]);
	let checkedAll = $derived(checked.length === subjects.length);
</script>

{#snippet subjectRow(subject: Subject)}
	<Table.Row>
		<Table.Cell class="">
			<Checkbox
				value={subject.id.toString()}
				checked={checked.includes(subject.id) || checkedAll}
				onCheckedChange={() => {
					if (checked.includes(subject.id)) checked = checked.filter((e) => e !== subject.id);
					else checked.push(subject.id);
				}}
			/>
		</Table.Cell>

		<Table.Cell class="">
			<span>
				{subject.name}
			</span>
		</Table.Cell>

		<Table.Cell class="">
			<span class="text-muted-foreground text-sm">
				/{subject.slug}
			</span>
		</Table.Cell>

		<Table.Cell class="text-center">
			<SubjectActions {subject} {userPermissions}></SubjectActions>
		</Table.Cell>
	</Table.Row>
{/snippet}

<div class="mb-3 flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between">
	<MassActions {checked} {subjects} {userPermissions}></MassActions>

	<PaginationResultsInfo
		page={page.data.page}
		limit={page.data.limit}
		totalItems={page.data.totalItems}
		totalPages={page.data.totalPages}
	/>
</div>

<ScrollArea orientation="horizontal" class="mx-auto max-w-[94dvw] rounded-xl border p-2">
	<Table.Root class="">
		<Table.Header>
			<Table.Row class="!bg-background hover:bg-background">
				<Table.Head class="w-[30px]">
					<Checkbox
						checked={checkedAll}
						onCheckedChange={(isChecked) => {
							if (isChecked) {
								checked = subjects.map((e) => e.id);
							} else {
								checked = [];
							}
						}}
					/>
				</Table.Head>
				<Table.Head class="min-w-[10ch]">Наименование</Table.Head>

				<Table.Head class="min-w-[10ch]">URL Slug</Table.Head>

				<Table.Head class="w-[40px]"></Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body class="hover:[tr:has(table)]:bg-background">
			{#each subjects as subject (subject.id)}
				{@render subjectRow(subject)}
			{/each}
		</Table.Body>
	</Table.Root>
</ScrollArea>
