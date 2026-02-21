<script lang="ts">
	import { CircleUser } from '@lucide/svelte/icons';
	import { Button, buttonVariants } from '$lib/components/ui/button/index';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { Separator } from '$lib/components/ui/separator';
	import AdminSidebar from '$lib/components/admin-sidebar.svelte';
	import ThemeModeSwitch from '$lib/components/ThemeModeSwitch.svelte';
	import FooterPanels from '$lib/components/FooterPanels.svelte';

	import './panels.css';

	const { children, data } = $props();
</script>

<svelte:head>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<Sidebar.Provider style="--sidebar-width: 18rem;">
	<AdminSidebar
		userPermissions={data.userPermissions}
		testAttemptsForGradingCount={data.testAttemptsForGradingCount}
	/>
	<Sidebar.Inset class="relative">
		<header class="bg-background flex h-16 shrink-0 items-center gap-2 border-b px-4">
			<div class="flex items-center justify-center">
				<Sidebar.Trigger class="-ml-1" />
				<kbd
					class="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium select-none max-sm:hidden"
				>
					<span class="text-sm">⌘</span>B
				</kbd>
			</div>
			<Separator orientation="vertical" class="mr-2 h-4" />
			<div class="flex-1"></div>

			<div>
				<ThemeModeSwitch />
			</div>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger
					class="rounded-full {buttonVariants({ variant: 'secondary', size: 'icon' })}"
				>
					<CircleUser class="h-5 w-5" />
					<span class="sr-only">Покажи/скрий менюто</span>
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="end">
					<DropdownMenu.Label>
						<div>
							<div>
								{data.user?.firstName}
								{data.user?.lastName}
							</div>
							<div class="text-muted-foreground text-xs">
								{data.user?.email}
							</div>
						</div>
					</DropdownMenu.Label>
					<DropdownMenu.Separator />
					<DropdownMenu.Item
						><a data-sveltekit-preload-data="off" data-sveltekit-reload href="/">
							Към основния сайт
						</a></DropdownMenu.Item
					>
					<DropdownMenu.Item>Настройки на профила</DropdownMenu.Item>

					<DropdownMenu.Item>Помощ</DropdownMenu.Item>
					<DropdownMenu.Separator />

					<Button size="sm" class="w-full" href="/logout">Изход</Button>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</header>

		<div class="@container/main flex flex-1 flex-col gap-4 px-2 py-4 md:px-4 lg:gap-6 lg:p-6">
			{@render children?.()}
			<FooterPanels></FooterPanels>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
