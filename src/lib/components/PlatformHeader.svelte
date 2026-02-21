<script lang="ts">
	import CircleUser from '@lucide/svelte/icons/circle-user';
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import { navigating, page } from '$app/state';
	import { cn } from '$lib/utils';
	import type { User } from '$lib/server/db/schema/auth';
	import ThemeModeSwitch from './ThemeModeSwitch.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { RolesEnum } from '$lib/types/enums';

	type Props = {
		user: Omit<User, 'passwordHash'> | null;
		class?: string;
	};

	let { user, class: className = '' }: Props = $props();

	let navOpen = $state(false);

	$effect(() => {
		if (navigating.to) navOpen = false;
	});
</script>

{#snippet nav(props?: { vertical: boolean })}
	<ul class={cn('flex items-center gap-4', props?.vertical ? 'flex-col items-start gap-2' : '')}>
		<li class={cn(props?.vertical ? 'w-full' : '')}>
			<Button
				variant="ghost"
				class={cn(
					props?.vertical ? 'block w-full items-start' : page.url.pathname === '/' && 'underline'
				)}
				href="/">Начало</Button
			>
		</li>

		<li class={cn(props?.vertical ? 'w-full' : '')}>
			<Button
				variant="ghost"
				class={cn(
					props?.vertical
						? 'block w-full items-start'
						: page.url.pathname.startsWith('/lessons') && 'underline'
				)}
				href="/lessons">Уроци</Button
			>
		</li>
		<li class={cn(props?.vertical ? 'w-full' : '')}>
			<Button
				variant="ghost"
				class={cn(
					props?.vertical
						? 'block w-full items-start'
						: page.url.pathname.startsWith('/tests') && 'underline'
				)}
				href="/tests">Тестове</Button
			>
		</li>
		<li class={cn(props?.vertical ? 'w-full' : '')}>
			<Button
				variant="ghost"
				class={cn(
					props?.vertical
						? 'block w-full items-start'
						: page.url.pathname.startsWith('/events') && 'underline'
				)}
				href="/events">Събития</Button
			>
		</li>
	</ul>
{/snippet}

<div class="sticky top-0 z-50">
	<header class={cn('bg-background/80 border-b backdrop-blur-lg', className)}>
		<nav class="mx-auto flex items-center lg:justify-between px-4 py-4 lg:px-8" aria-label="Global">
			<a href={'/'} class="-m-1.5 flex items-center gap-4 font-black text-2xl p-1.5"> LOOGO </a>

			<div class="flex gap-4 lg:hidden ml-auto">
				{#if !user}
					<Button size="sm" href="/login">Вход</Button>
				{/if}

				<button
					type="button"
					class="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5"
					onclick={() => {
						navOpen = true;
					}}
				>
					<span class="sr-only">Open main menu</span>
					<svg
						class="size-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						aria-hidden="true"
						data-slot="icon"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
						/>
					</svg>
				</button>
			</div>

			<div class="hidden lg:block">
				{@render nav()}
			</div>

			<div class="items-center lg:flex lg:gap-x-12">
				<div class="hidden items-center gap-2 lg:flex">
					<div>
						<ThemeModeSwitch />
					</div>
					{#if user}
						<DropdownMenu.Root>
							<DropdownMenu.Trigger
								class="rounded-full! {buttonVariants({ variant: 'ghost', size: 'icon' })}"
							>
								<CircleUser class="h-8 w-8" />
								<span class="sr-only">Покажи/скрий менюто</span>
							</DropdownMenu.Trigger>
							<DropdownMenu.Content align="end">
								<DropdownMenu.Label>
									<div>
										<div>
											{user.firstName}
											{user.lastName}
										</div>
										<div class="text-muted-foreground text-xs">
											{user.email}
										</div>
									</div>
								</DropdownMenu.Label>
								{#if user.role === RolesEnum.admin || user.role === RolesEnum.teacher}
									<DropdownMenu.Separator />

									<DropdownMenu.Item>
										<a
											data-sveltekit-preload-data="tap"
											href="/control-centre-v1"
											class="block w-full">Панел</a
										>
									</DropdownMenu.Item>
								{/if}
								<DropdownMenu.Separator />
								<DropdownMenu.Item>
									<a href="/account" class="block w-full">Моят профил</a>
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<a href="/account/my-lessons" class="block w-full">Моите уроци</a>
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<a href="/account/my-tests" class="block w-full">Моите тестове</a>
								</DropdownMenu.Item>

								{#if user.role === RolesEnum.parent}
									<DropdownMenu.Item>
										<a href="/account/parenting" class="block w-full">Панел за родители</a>
									</DropdownMenu.Item>
								{/if}

								<DropdownMenu.Item>
									<a href="/support" class="block w-full">Помощ</a>
								</DropdownMenu.Item>

								<DropdownMenu.Separator />

								<Button size="sm" class="w-full" href="/logout">Изход</Button>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					{:else}
						<Button size="sm" variant="outline" class="bg-background" href="/login">Вход</Button>
						<Button size="sm" href="/register" class="btn-site-primary">Регистрация</Button>
					{/if}
				</div>
			</div>
		</nav>
	</header>

	<!-- Mobile menu, show/hide based on menu open state. -->
	<div class="{navOpen ? 'block' : 'hidden'} z-30 lg:hidden" role="dialog" aria-modal="true">
		<!-- Background backdrop, show/hide based on slide-over state. -->
		<button
			aria-label="close mobile menu"
			class="bg-background/60 fixed inset-0 z-10 cursor-pointer backdrop-blur-lg"
			onclick={() => {
				navOpen = false;
			}}
		></button>
		<div
			class="bg-background/80 fixed inset-y-0 right-0 z-20 w-full overflow-y-auto px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10"
		>
			<div class="flex items-center justify-between">
				<a href="/" class="-m-1.5 flex items-center font-black gap-4 text-xl p-1.5"> LOOGO </a>

				<button
					type="button"
					class="-m-2.5 rounded-md p-2.5"
					onclick={() => {
						navOpen = false;
					}}
				>
					<span class="sr-only">Close menu</span>
					<svg
						class="size-6"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						aria-hidden="true"
						data-slot="icon"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div class="mt-6 flow-root">
				<div class="-my-6 divide-y divide-gray-500/10">
					<div class="py-6">
						<div class="flex flex-col gap-2">
							<div class="flex gap-2">
								<div>
									<ThemeModeSwitch />
								</div>
							</div>

							<div>
								{@render nav({ vertical: true })}
							</div>

							{#if user}
								<div class="divide-y">
									<div class="py-2">
										<div>
											{user?.firstName}
											{user?.lastName}
										</div>
										<div class="text-muted-foreground text-xs">
											{user?.email}
										</div>
									</div>

									{#if user.role === RolesEnum.admin || user.role === RolesEnum.teacher}
										<a href="/control-centre-v1" class="block w-full py-2"> Панел </a>
									{/if}

									<a href="/account" class="block w-full py-2">Моят профил</a>

									<a href="/account/my-lessons" class="block w-full py-2">Моите уроци</a>

									<a href="/account/my-tests" class="block w-full py-2">Моите тестове</a>

									{#if user.role === RolesEnum.parent}
										<a href="/account/parenting" class="block w-full py-2">Панел за родители</a>
									{/if}

									<a href="/support" class="block w-full py-2">Помощ</a>
								</div>

								<Button size="sm" class="w-full" href="/logout">Изход</Button>
							{:else}
								<Button size="sm" variant="outline" class="bg-background" href="/login">Вход</Button
								>
								<Button size="sm" href="/register" class="btn-site-primary">Регистрация</Button>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
