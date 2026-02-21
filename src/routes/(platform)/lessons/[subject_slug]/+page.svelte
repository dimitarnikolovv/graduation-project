<script lang="ts">
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
	import Smile from '@lucide/svelte/icons/smile';
	import FooterPlatform from '$lib/components/FooterPlatform.svelte';

	let { data } = $props();
</script>

<div class="container mx-auto max-w-7xl px-4 py-6 md:py-10">
	<!-- Header Section -->
	<div class="mb-8 text-center md:mb-12">
		<h1 class="mb-3 text-3xl font-bold md:text-4xl lg:text-5xl">Избери своя клас</h1>
		<p class="text-muted-foreground text-lg md:text-xl">
			Уроци по {data.subject.name}
		</p>
	</div>

	{#if !data.gradesForSubject || data.gradesForSubject.length === 0}
		<div
			class="mt-10 flex items-center justify-center rounded-lg border border-dashed px-4 py-24 shadow-sm md:py-32"
		>
			<div class="flex flex-col items-center gap-4 text-center">
				<Smile class="text-muted-foreground h-16 w-16" />
				<h3 class="text-2xl font-bold tracking-tight">Не намерихме уроци</h3>
				<p class="text-muted-foreground max-w-md">
					За съжаление, все още няма налични уроци по {data.subject.name}. Това скоро ще се промени,
					така че заповядайте отново.
				</p>
			</div>
		</div>
	{:else}
		<!-- Grid of Classes -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
			{#each data.gradesForSubject as grade}
				<a
					href="/lessons/{data.subject.slug}/{grade.slug}"
					class="group bg-card hover:border-primary hover:bg-primary/5 relative flex flex-col items-center justify-center rounded-lg border p-8 shadow-sm transition-all hover:shadow-lg md:p-10"
				>
					<!-- Icon -->
					<div
						class="bg-muted text-primary group-hover:bg-primary group-hover:text-primary-foreground mb-4 rounded-full p-4 transition-colors"
					>
						<GraduationCap class="h-8 w-8 md:h-10 md:w-10" />
					</div>

					<!-- Grade Name -->
					<h2 class="text-center text-xl font-semibold md:text-2xl">
						{grade.name}
					</h2>
				</a>
			{/each}
		</div>
	{/if}
</div>

<FooterPlatform />
