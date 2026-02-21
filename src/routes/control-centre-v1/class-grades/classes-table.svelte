<script lang="ts">
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';
	import * as Table from '$lib/components/ui/table/index';
	import ClassGradesActions from './class-actions.svelte';
	import MassActions from './mass-actions.svelte';
	import type { ClassGrade } from '$lib/server/db/schema/subjects';
	import type { PermissionsObject } from '$lib/types/permissions';
	import { page } from '$app/state';
	import PaginationResultsInfo from '$lib/components/PaginationResultsInfo.svelte';

	type Props = {
		classGrades: ClassGrade[];
		userPermissions?: PermissionsObject;
	};
	let { classGrades, userPermissions }: Props = $props();

	let checked: number[] = $state([]);
	let checkedAll = $derived(checked.length === classGrades.length);
</script>

{#snippet classGradeRow(classGrade: ClassGrade)}
	<Table.Row>
		<Table.Cell class="">
			<Checkbox
				value={classGrade.id.toString()}
				checked={checked.includes(classGrade.id) || checkedAll}
				onCheckedChange={() => {
					if (checked.includes(classGrade.id)) checked = checked.filter((e) => e !== classGrade.id);
					else checked.push(classGrade.id);
				}}
			/>
		</Table.Cell>

		<Table.Cell class="">
			<span>
				{classGrade.name}
			</span>
		</Table.Cell>

		<Table.Cell class="">
			<span>
				{classGrade.gradeNumber}
			</span>
		</Table.Cell>

		<Table.Cell class="">
			<span class="text-muted-foreground text-sm">
				/{classGrade.slug}
			</span>
		</Table.Cell>

		<Table.Cell class="text-center">
			<ClassGradesActions {classGrade} {userPermissions}></ClassGradesActions>
		</Table.Cell>
	</Table.Row>
{/snippet}

<div class="mb-3 flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between">
	<MassActions {checked} {classGrades} {userPermissions}></MassActions>

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
								checked = classGrades.map((e) => e.id);
							} else {
								checked = [];
							}
						}}
					/>
				</Table.Head>
				<Table.Head class="min-w-[10ch]">Наименование</Table.Head>

				<Table.Head class="min-w-[10ch]">С цифри</Table.Head>

				<Table.Head class="min-w-[10ch]">URL Slug</Table.Head>

				<Table.Head class="w-10"></Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body class="hover:[tr:has(table)]:bg-background">
			{#each classGrades as classGrade (classGrade.id)}
				{@render classGradeRow(classGrade)}
			{/each}
		</Table.Body>
	</Table.Root>
</ScrollArea>
