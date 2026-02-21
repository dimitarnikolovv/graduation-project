<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { CountOfLessonsInSubjectsResult } from '$lib/server/db-querying/lessons';
	import type { Subject } from '$lib/server/db/schema/subjects';
	import { formatLargeNumber } from '$lib/utils/general';
	import LibraryBig from '@lucide/svelte/icons/library-big';

	type Props = {
		subjects: Subject[];
		subject_slug: string;
		grade_slug: string;
		countOfLessonsInSubject: CountOfLessonsInSubjectsResult;
	};

	let { subjects, subject_slug, grade_slug, countOfLessonsInSubject }: Props = $props();

	// filter out subjects with zero lessons
	subjects = subjects.filter((subject) => {
		const count =
			countOfLessonsInSubject.find((s) => s.subject_id === subject.id)?.count_of_lessons ?? 0;
		return count > 0;
	});
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel>Предмети</Sidebar.GroupLabel>
	<Sidebar.Menu>
		{#each subjects as item (item.id)}
			{@const count =
				countOfLessonsInSubject.find((subject) => subject.subject_id === item.id)
					?.count_of_lessons ?? 0}

			<Sidebar.MenuItem>
				<Sidebar.MenuButton tooltipContent={item.name} isActive={item.slug === subject_slug}>
					{#snippet child({ props })}
						<a href="/lessons/{item.slug}/{grade_slug}" {...props}>
							<LibraryBig class="size-4" />
							<span>{item.name}</span>

							<Sidebar.MenuBadge>{formatLargeNumber(count)}</Sidebar.MenuBadge>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
