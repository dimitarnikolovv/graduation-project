<script lang="ts">
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';
	import * as Table from '$lib/components/ui/table/index';
	import LessonGroupActions from './lesson-group-actions.svelte';
	import MassActions from './mass-actions.svelte';
	import type { PermissionsObject } from '$lib/types/permissions';
	import PaginationResultsInfo from '$lib/components/PaginationResultsInfo.svelte';
	import { page } from '$app/state';
	import type { PaginatedLessonGroups } from '$lib/server/db-querying/lessonGroups';

	type Props = {
		groups: PaginatedLessonGroups['results'];
		userPermissions?: PermissionsObject;
	};
	let { groups, userPermissions }: Props = $props();

	let checked: number[] = $state([]);
	let checkedAll = $derived(checked.length === groups.length);
</script>

{#snippet groupRow(group: (typeof groups)[number])}
	<Table.Row>
		<Table.Cell class="">
			<Checkbox
				value={group.id.toString()}
				checked={checked.includes(group.id) || checkedAll}
				onCheckedChange={() => {
					if (checked.includes(group.id)) checked = checked.filter((e) => e !== group.id);
					else checked.push(group.id);
				}}
			/>
		</Table.Cell>

		<Table.Cell class="">
			<a href={`/control-centre-v1/lesson-groups/${group.id}/edit`} class="hover:underline">
				{group.name}
			</a>
		</Table.Cell>

		<Table.Cell class="">
			<span class="text-muted-foreground text-sm">
				{group.classGrade.name}
			</span>
		</Table.Cell>

		<Table.Cell class="">
			<span class="text-muted-foreground text-sm">
				{group.subject.name}
			</span>
		</Table.Cell>

		<Table.Cell class="">
			<span class="text-muted-foreground text-sm">
				{group.order}
			</span>
		</Table.Cell>

		<Table.Cell class="">
			<span class="text-destructive animate-pulse font-extrabold"> ПРЕДСТОИ </span>
		</Table.Cell>

		<Table.Cell class="text-center">
			<LessonGroupActions {group} {userPermissions}></LessonGroupActions>
		</Table.Cell>
	</Table.Row>
{/snippet}

<div class="mb-3 flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between">
	<MassActions {checked} {groups} {userPermissions}></MassActions>

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
			<Table.Row class="bg-background! hover:bg-background">
				<Table.Head class="w-7.5">
					<Checkbox
						checked={checkedAll}
						onCheckedChange={(isChecked) => {
							if (isChecked) {
								checked = groups.map((e) => e.id);
							} else {
								checked = [];
							}
						}}
					/>
				</Table.Head>
				<Table.Head class="min-w-[10ch]">Наименование</Table.Head>

				<Table.Head class="min-w-[10ch]">Клас</Table.Head>

				<Table.Head class="min-w-[10ch]">Предмет</Table.Head>

				<Table.Head class="min-w-[10ch]">Пореден №</Table.Head>

				<Table.Head class="min-w-[10ch]">Бр. уроци</Table.Head>

				<Table.Head class="w-10"></Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body class="hover:[tr:has(table)]:bg-background">
			{#each groups as group (group.id)}
				{@render groupRow(group)}
			{/each}
		</Table.Body>
	</Table.Root>
</ScrollArea>
