<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index';
	import * as Collapsible from '$lib/components/ui/collapsible/index';

	import type { ComponentProps } from 'svelte';

	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import LucideShieldCheck from '@lucide/svelte/icons/shield-check';
	import ShieldUser from '@lucide/svelte/icons/shield-user';
	import FileVideoCamera from '@lucide/svelte/icons/file-video-camera';
	import GraduationCap from '@lucide/svelte/icons/graduation-cap';
	import NotebookPen from '@lucide/svelte/icons/notebook-pen';
	import LibraryBig from '@lucide/svelte/icons/library-big';
	import Group from '@lucide/svelte/icons/group';
	import CalendarHeart from '@lucide/svelte/icons/calendar-heart';
	import MessageSquareText from '@lucide/svelte/icons/message-square-text';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import Banknote from '@lucide/svelte/icons/banknote';
	import Euro from '@lucide/svelte/icons/euro';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	import { page } from '$app/state';
	import Logo from '$lib/assets/images/logo-icon-128x128.png';
	import type { PermissionsObject } from '$lib/types/permissions';
	import { UserPermissionsEnum } from '$lib/types/enums';
	import { checkIfUserHasPermission } from '$lib/utils/access-control';
	import { Badge } from './ui/badge';
	import { formatLargeNumber } from '$lib/utils/general';

	type Props = ComponentProps<typeof Sidebar.Root> & {
		userPermissions?: PermissionsObject;
		testAttemptsForGradingCount?: number;
	};

	let {
		ref = $bindable(null),
		collapsible = 'icon',

		userPermissions,
		testAttemptsForGradingCount,
		...restProps
	}: Props = $props();
</script>

<Sidebar.Root bind:ref {collapsible} {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<a href="/control-centre-v1">
					<Sidebar.MenuButton size="lg">
						<img class="size-8" src={Logo} alt="BRAAND" />

						<div class="grid flex-1 text-left text-lg leading-tight font-bold">BRAAND LTD</div>
					</Sidebar.MenuButton>
				</a>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>

	<Sidebar.Content class="thin-scrollbar">
		<Sidebar.Group>
			<Sidebar.Menu>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton isActive={page.url.pathname === `/control-centre-v1`}>
						{#snippet child({ props })}
							<a href="/control-centre-v1" {...props}>
								<LayoutDashboard />
								<span>Панел</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>

				{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.ViewVideos)}
					<Sidebar.MenuItem>
						<Sidebar.MenuButton isActive={page.url.pathname.includes('/control-centre-v1/videos')}>
							{#snippet child({ props })}
								<a href="/control-centre-v1/videos" {...props}>
									<FileVideoCamera />
									<span>Видеа</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				{/if}

				{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.ViewLessons)}
					<Sidebar.MenuItem>
						<Sidebar.MenuButton isActive={page.url.pathname.includes('/control-centre-v1/lessons')}>
							{#snippet child({ props })}
								<a href="/control-centre-v1/lessons" {...props}>
									<GraduationCap />
									<span>Уроци</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				{/if}

				{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.ViewTests)}
					<Sidebar.MenuItem>
						<Sidebar.MenuButton isActive={page.url.pathname.includes('/control-centre-v1/tests')}>
							{#snippet child({ props })}
								<a href="/control-centre-v1/tests" {...props}>
									<NotebookPen />
									<span>Тестове</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>

						<Sidebar.MenuBadge class="flex gap-1">
							{#if testAttemptsForGradingCount && testAttemptsForGradingCount > 0}
								<Badge
									variant="outline"
									class="flex h-6 shrink-0 animate-pulse items-center justify-center rounded-full bg-yellow-50 text-yellow-700"
								>
									{formatLargeNumber(testAttemptsForGradingCount)}
								</Badge>
							{/if}
						</Sidebar.MenuBadge>
					</Sidebar.MenuItem>
				{/if}

				{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.ViewSubjects)}
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							isActive={page.url.pathname.includes('/control-centre-v1/subjects')}
						>
							{#snippet child({ props })}
								<a href="/control-centre-v1/subjects" {...props}>
									<LibraryBig />
									<span>Предмети</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				{/if}

				{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.ViewClassGrades)}
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							isActive={page.url.pathname.includes('/control-centre-v1/class-grades')}
						>
							{#snippet child({ props })}
								<a href="/control-centre-v1/class-grades" {...props}>
									<GraduationCap />
									<span>Класове</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				{/if}

				{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.ViewLessonGroups)}
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							isActive={page.url.pathname.includes('/control-centre-v1/lesson-groups')}
						>
							{#snippet child({ props })}
								<a href="/control-centre-v1/lesson-groups" {...props}>
									<Group />
									<span>Раздели с уроци</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				{/if}

				{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.ViewEvents)}
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							isActive={page.url.pathname.includes('/control-centre-v1/public-events')}
						>
							{#snippet child({ props })}
								<a href="/control-centre-v1/public-events" {...props}>
									<CalendarHeart />
									<span>Публични събития</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>

					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							isActive={page.url.pathname.includes('/control-centre-v1/paid-events')}
						>
							{#snippet child({ props })}
								<a href="/control-centre-v1/paid-events" {...props}>
									<CalendarDays />
									<span>Платени събития</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				{/if}

				{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.ViewComments)}
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							isActive={page.url.pathname.includes('/control-centre-v1/latest-comments')}
						>
							{#snippet child({ props })}
								<a href="/control-centre-v1/latest-comments" {...props}>
									<MessageSquareText />
									<span>Коментари</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				{/if}

				<Collapsible.Root
					open={page.url.pathname.startsWith('/control-centre-v1/payments')}
					class="group/collapsible"
				>
					{#snippet child({ props })}
						<Sidebar.MenuItem {...props}>
							<Collapsible.Trigger>
								{#snippet child({ props })}
									<Sidebar.MenuButton {...props}>
										{#snippet tooltipContent()}
											Плащания
										{/snippet}
										<Banknote />
										<span>Плащания</span>
										<ChevronRight
											class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
										/>
									</Sidebar.MenuButton>
								{/snippet}
							</Collapsible.Trigger>
							<Collapsible.Content>
								<Sidebar.MenuSub>
									{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.ViewTransactions)}
										<Sidebar.MenuSubItem>
											<Sidebar.MenuSubButton
												isActive={page.url.pathname === '/control-centre-v1/payments/transactions'}
											>
												{#snippet child({ props })}
													<a href={'/control-centre-v1/payments/transactions'} {...props}>
														<Euro />
														<span>Транзакции</span>
													</a>
												{/snippet}
											</Sidebar.MenuSubButton>
										</Sidebar.MenuSubItem>
									{/if}
								</Sidebar.MenuSub>
							</Collapsible.Content>
						</Sidebar.MenuItem>
					{/snippet}
				</Collapsible.Root>

				{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.ViewAdmins)}
					<Sidebar.MenuItem>
						<Sidebar.MenuButton isActive={page.url.pathname.includes('/control-centre-v1/staff')}>
							{#snippet child({ props })}
								<a href="/control-centre-v1/staff" {...props}>
									<LucideShieldCheck />
									<span>Администратори</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				{/if}

				{#if checkIfUserHasPermission(userPermissions, UserPermissionsEnum.ViewUsers)}
					<Sidebar.MenuItem>
						<Sidebar.MenuButton isActive={page.url.pathname.includes('/control-centre-v1/users')}>
							{#snippet child({ props })}
								<a href="/control-centre-v1/users" {...props}>
									<ShieldUser />
									<span>Потребители</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				{/if}
			</Sidebar.Menu>
		</Sidebar.Group>
	</Sidebar.Content>

	<Sidebar.Rail />
</Sidebar.Root>
