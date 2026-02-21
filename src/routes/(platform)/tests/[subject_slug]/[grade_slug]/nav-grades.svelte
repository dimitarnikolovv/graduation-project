<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { CountOfPublishedTestsInGradeBySubjectResult } from '$lib/server/db-querying/tests';
	import type { ClassGrade } from '$lib/server/db/schema/subjects';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
	import { formatLargeNumber } from '$lib/utils/general';

	type Props = {
		grades: ClassGrade[];
		subject_slug: string;
		grade_slug: string;
		countOfTestsInGrade: CountOfPublishedTestsInGradeBySubjectResult;
	};

	let { grades, subject_slug, grade_slug, countOfTestsInGrade }: Props = $props();
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel>Класове</Sidebar.GroupLabel>
	<Sidebar.Menu>
		{#each grades as item (item.id)}
			{@const count =
				countOfTestsInGrade.find((grade) => grade.grade_id === item.id)?.count_of_tests ?? 0}

			{#if count > 0}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton tooltipContent={item.name} isActive={item.slug === grade_slug}>
						{#snippet child({ props })}
							<a href="/tests/{subject_slug}/{item.slug}" {...props}>
								<GraduationCap class="size-4" />
								<span>{item.name}</span>
								<Sidebar.MenuBadge>{formatLargeNumber(count)}</Sidebar.MenuBadge>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/if}
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
