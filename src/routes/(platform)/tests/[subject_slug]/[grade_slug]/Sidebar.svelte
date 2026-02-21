<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import NavSubjects from './nav-subjects.svelte';
	import NavGrades from './nav-grades.svelte';
	import type { ClassGrade, Subject } from '$lib/server/db/schema/subjects';
	import type {
		CountOfPublishedTestsInGradeBySubjectResult,
		CountOfPublishedTestsInSubjectsResult
	} from '$lib/server/db-querying/tests';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	type Props = ComponentProps<typeof Sidebar.Root> & {
		subjects: Subject[];
		grades: ClassGrade[];
		subject_slug: string;
		grade_slug: string;
		countOfTestsInGrade: CountOfPublishedTestsInGradeBySubjectResult;
		countOfTestsInSubject: CountOfPublishedTestsInSubjectsResult;
	};

	let {
		subject_slug,
		subjects,
		grade_slug,
		grades,
		countOfTestsInGrade,
		countOfTestsInSubject,
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
							<a
								href="/tests"
								class="group/backlink flex items-center justify-center gap-2 rounded-lg"
							>
								<div
									class="text-sidebar-primary-foreground flex size-8 items-center justify-center rounded-lg bg-blue-700 group-hover/backlink:bg-blue-800"
								>
									<ArrowLeft class="size-4" />
								</div>

								<div
									class="bg-muted group-hover/backlink:bg-muted/80 flex flex-col gap-0.5 rounded-lg px-4 py-1.5 leading-none"
								>
									<span class="text-sm font-medium text-nowrap"> Назад към предметите </span>
								</div>
							</a>
						</div>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>

	<Sidebar.Content class="thin-scrollbar">
		<NavSubjects {subjects} {grade_slug} {subject_slug} {countOfTestsInSubject} />

		<NavGrades {grades} {grade_slug} {subject_slug} {countOfTestsInGrade} />
	</Sidebar.Content>

	<Sidebar.Rail />
</Sidebar.Root>
