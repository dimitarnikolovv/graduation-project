<script lang="ts">
	import { navigating } from '$app/state';
	import ProgressLoading from '$lib/components/ProgressLoading.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import TestsSidebar from './Sidebar.svelte';

	let { data, children } = $props();
</script>

<div class="-mx-2 lg:-mx-6">
	<Sidebar.Provider class="min-h-0">
		<TestsSidebar
			countOfTestsInGrade={data.countOfTestsInGrade}
			countOfTestsInSubject={data.countOfTestsInSubject}
			subjects={data.subjects}
			grades={data.classGrades}
			grade_slug={data.grade.slug}
			subject_slug={data.subject.slug}
		/>
		<div class="relative isolate -mt-4 w-full lg:-mt-6">
			{#if navigating.to}
				<ProgressLoading class="absolute top-0 z-10" />
			{/if}
			<header class="bg-background sticky top-0 flex h-14 shrink-0 items-center gap-2">
				<div class="flex flex-1 items-center gap-2 px-3">
					<Sidebar.Trigger />

					<h1 class="flex items-center justify-center gap-2 text-center text-2xl font-bold">
						{data.subject.name} за {data.grade.name}
					</h1>
				</div>
			</header>
			<div class="@container/inset px-2 lg:px-6">
				{@render children?.()}
			</div>
		</div>
	</Sidebar.Provider>
</div>
