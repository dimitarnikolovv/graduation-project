<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Badge } from '$lib/components/ui/badge';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import type { ExpandedLesson } from '$lib/types/lessons';
	import { type GetLessonGroupsToDisplayByGradeAndSubjectResult } from '$lib/server/db-querying/lessonGroups';

	type Props = ComponentProps<typeof Sidebar.Root> & {
		currentLesson: ExpandedLesson;
		groups: GetLessonGroupsToDisplayByGradeAndSubjectResult['results'];
		groupsCount: number;
		lessonsCount: number;
	};

	let {
		currentLesson,
		groups,
		groupsCount,
		lessonsCount,
		ref = $bindable(null),
		...restProps
	}: Props = $props();
</script>

<Sidebar.Root {...restProps} class="fixed top-14 h-[calc(100dvh-70px)] lg:top-17">
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg">
					{#snippet child({ props })}
						<div class="flex gap-2 p-2">
							<div
								class="text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-700"
							>
								<BookOpen class="size-4" />
							</div>
							<div class="flex flex-col gap-0.5 leading-none">
								<span class="font-medium">
									{currentLesson.subject.name} за {currentLesson.classGrade.name}
								</span>
								<span class="text-muted-foreground text-xs"
									>Общо: {groupsCount}
									{groupsCount === 1 ? 'раздел' : 'раздела'}, {lessonsCount}
									{lessonsCount === 1 ? 'урок' : 'урока'}</span
								>
							</div>
						</div>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>

	<Sidebar.Content class="thin-scrollbar">
		{#each groups as group (group.id)}
			<Sidebar.Group>
				<Sidebar.GroupLabel>{group.order}. {group.name}</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each group.lessons as lesson (lesson.id)}
							<Sidebar.MenuItem class="flex flex-row-reverse">
								<Sidebar.MenuButton
									class="font-medium h-auto min-h-8"
									isActive={currentLesson.id === lesson.id}
								>
									{#snippet child({ props })}
										<a href="/lessons/watch/{lesson.id}" {...props}>
											<Badge class="px-1.5 py-0 font-medium">{lesson.order}</Badge>

											{lesson.title}
										</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{/each}
	</Sidebar.Content>

	<Sidebar.Rail />
</Sidebar.Root>
