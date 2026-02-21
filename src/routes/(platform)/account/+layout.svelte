<script lang="ts">
	import { page } from '$app/state';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import User from '@lucide/svelte/icons/user';
	import ChartColumn from '@lucide/svelte/icons/chart-column';
	import Settings from '@lucide/svelte/icons/settings';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import { cn } from '$lib/utils';
	import { crossfade } from 'svelte/transition';
	import { cubicInOut } from 'svelte/easing';

	let { data, children } = $props();

	const tabs = [
		{
			href: '/account',
			label: 'Профил',
			Icon: User,
			isActiveFn: () => page.url.pathname === '/account'
		},
		{
			href: '/account/my-lessons',
			label: 'Моите уроци',
			Icon: BookOpen,
			isActiveFn: () => page.url.pathname.includes('/account/my-lessons')
		},
		{
			href: '/account/my-tests',
			label: 'Моите тестове',
			Icon: ClipboardList,
			isActiveFn: () => page.url.pathname.includes('/account/my-tests')
		},
		{
			href: '/account/progress',
			label: 'Напредък',
			Icon: ChartColumn,
			isActiveFn: () => page.url.pathname.includes('/account/progress')
		},
		{
			href: '/account/settings',
			label: 'Настройки',
			Icon: Settings,
			isActiveFn: () => page.url.pathname.includes('/account/settings')
		}
	];

	const [send, receive] = crossfade({
		duration: 250,
		easing: cubicInOut
	});
</script>

<div class="container mx-auto max-w-7xl py-6">
	<div class="mb-6">
		<h1 class="text-3xl font-bold">
			Здравей, {data.user.firstName}
		</h1>
		<p class="text-muted-foreground mt-1">Управлявай профила и уроците се</p>
	</div>

	<!-- Tab Navigation -->
	<div class="border-b">
		<nav class="-mb-px flex gap-2 overflow-x-auto">
			{#each tabs as tab}
				{@const isActive = tab.isActiveFn()}
				<a
					href={tab.href}
					class={cn(
						'group relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
						isActive
							? 'border-primary text-primary'
							: 'text-muted-foreground hover:border-border hover:text-foreground border-transparent'
					)}
				>
					{#if isActive}
						<div
							in:send={{ key: 'active-tab' }}
							out:receive={{ key: 'active-tab' }}
							class="border-primary absolute inset-0 border-b-2 transition-colors"
						></div>
					{/if}
					<tab.Icon class="h-4 w-4" />
					<span class="hidden sm:inline">{tab.label}</span>
				</a>
			{/each}
		</nav>
	</div>

	<div class="mt-6">
		{@render children()}
	</div>
</div>
