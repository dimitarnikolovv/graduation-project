<script lang="ts">
	import { navigating, page } from '$app/state';
	import { onMount, untrack } from 'svelte';
	import Player from '$lib/components/player/Player.svelte';
	import ProgressLoading from '$lib/components/ProgressLoading.svelte';
	import RenderStyledHtml from '$lib/components/RenderStyledHtml.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import LessonSidebar from './Sidebar.svelte';
	import {
		enrollStudentInLessonRemote,
		increaseLessonViewCountRemote,
		setStudentLessonProgressRemote
	} from '$lib/remote-functions/lessons.remote';
	import { Button } from '$lib/components/ui/button';
	import Lock from '@lucide/svelte/icons/lock';
	import type { MediaPlayerElement } from 'vidstack/elements';
	import CommentsSection from './_components/CommentsSection.svelte';
	import StatsAndActions from './_components/StatsAndActions.svelte';
	import TestSection from './_components/TestSection.svelte';

	let { data } = $props();

	// Video player state
	let currentTime = $state(0);
	let duration = $state(0);
	let isPlaying = $state(false);

	// Free preview limit (5 minutes = 300 seconds)
	const FREE_PREVIEW_LIMIT = 300;
	let showLoginOverlay = $state(false);
	let playerElement: MediaPlayerElement | null = $state(null);

	// Progress tracking
	const PROGRESS_UPDATE_INTERVAL = 30_000; // 30 seconds
	const MIN_TIME_DIFF = 15; // Minimum 5 seconds difference before saving

	let expandDescription = $state(false);

	// Function to save progress
	async function saveProgress() {
		if (!data.user || currentTime <= 0 || duration <= 0) return;

		let progress = (currentTime / duration) * 100;

		// if the lesson is more than 95% complete, mark it as 100%
		// or if there is less than 1 minute left
		if (progress >= 95 || duration - currentTime <= 60) {
			progress = 100;
		}

		try {
			await setStudentLessonProgressRemote({
				userId: data.user.id,
				lessonId: data.lesson.id,
				progress: Math.min(progress, 100),
				videoProgress: currentTime
			});
		} catch (error) {
			console.error('Failed to update lesson progress:', error);
		}
	}

	// Track view count and enrollment whenever the lesson changes
	$effect(() => {
		const lessonId = data.lesson.id;

		// Use untrack to prevent infinite loops from side effects
		untrack(() => {
			// Increase view count for the current lesson
			void increaseLessonViewCountRemote({ lessonId });

			// Enroll student asynchronously (fire and forget)
			if (data.user) {
				void enrollStudentInLessonRemote({ userId: data.user.id, lessonId });
			}
		});
	});

	// Monitor video time and block playback for non-logged-in users
	$effect(() => {
		if (!data.user && currentTime >= FREE_PREVIEW_LIMIT) {
			if (!showLoginOverlay) {
				showLoginOverlay = true;
			}

			// Block the video completely
			if (playerElement) {
				playerElement.pause();
				playerElement.currentTime = FREE_PREVIEW_LIMIT;
			}
		}
	});

	// Prevent video from playing when overlay is shown
	$effect(() => {
		if (showLoginOverlay && isPlaying && playerElement) {
			playerElement.pause();
		}
	});

	// Add event listener to block play attempts
	$effect(() => {
		const player = playerElement;
		if (!player) return;

		const handlePlay = (event: Event) => {
			if (!data.user && currentTime >= FREE_PREVIEW_LIMIT) {
				event.preventDefault();
				player.pause();
				showLoginOverlay = true;
			}
		};

		const handleSeeking = () => {
			if (!data.user && player.currentTime > FREE_PREVIEW_LIMIT) {
				player.currentTime = FREE_PREVIEW_LIMIT;
			}
		};

		player.addEventListener('play', handlePlay);
		player.addEventListener('seeking', handleSeeking);

		return () => {
			player.removeEventListener('play', handlePlay);
			player.removeEventListener('seeking', handleSeeking);
		};
	});

	onMount(() => {
		// Set up interval for periodic progress updates
		const progressInterval = setInterval(() => {
			// Only save if video is actually playing and has meaningful progress
			if (isPlaying && currentTime > MIN_TIME_DIFF) {
				void saveProgress();
			}
		}, PROGRESS_UPDATE_INTERVAL);

		// Save progress when user leaves the page (close tab, navigate away, etc.)
		const handleBeforeUnload = () => {
			// Only save if there's actual progress
			if (currentTime > MIN_TIME_DIFF && duration > 0) {
				void saveProgress();
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		// Cleanup function - returns a function that will be called on unmount
		return () => {
			clearInterval(progressInterval);
			window.removeEventListener('beforeunload', handleBeforeUnload);
			// Save final progress on component unmount (fire and forget)
			void saveProgress();
		};
	});
</script>

<div class="-mx-2 lg:-mx-6">
	<Sidebar.Provider class="min-h-0 [--sidebar-width:20rem]!">
		<LessonSidebar
			currentLesson={data.lesson}
			groups={data.groupsInSeries}
			groupsCount={data.groupsCount}
			lessonsCount={data.lessonsCount}
		/>
		<div class="relative isolate -mt-4 w-full lg:-mt-6">
			{#if navigating.to}
				<ProgressLoading class="absolute top-0 z-10" />
			{/if}
			<header class="bg-background sticky top-0 flex h-14 shrink-0 items-center gap-2">
				<div class="flex flex-1 items-center gap-2 px-3">
					<Sidebar.Trigger />

					<h1 class="flex items-center justify-center gap-2 text-center text-2xl font-bold">
						{data.lesson.title}
					</h1>
				</div>
			</header>
			<div class="@container mt-4 px-2 mx-auto lg:px-6 max-w-7xl">
				<div class="aspect-video relative">
					<Player
						storageKey="lessons-player"
						video={data.lesson.video}
						title={data.lesson.title}
						bind:currentTime
						bind:duration
						bind:isPlaying
						initialTime={data.studentProgress?.videoProgress ?? 0}
						bind:player={playerElement}
					/>

					<!-- Login overlay for non-authenticated users -->
					{#if showLoginOverlay}
						<div
							class="absolute inset-0 bg-black/80 flex items-center justify-center z-50 rounded-lg"
						>
							<div
								class="bg-card border border-border rounded-lg p-4 sm:p-6 sm:mx-4 text-center shadow"
							>
								<div class="mb-4 flex justify-center">
									<Lock class="w-9 h-9 text-primary" />
								</div>
								<h2 class="text-lg sm:text-2xl font-bold mb-3">Моля, влезте в профила си</h2>
								<p class="text-muted-foreground mb-6 text-sm sm:text-base">
									Достигнахте лимита от 5 минути за преглед на урока. За да продължите да гледате,
									моля, влезте в профила си.
								</p>
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
									<Button href="/login" size="sm">Вход</Button>
									<Button href="/register" variant="outline" size="sm">Регистрация</Button>
								</div>
							</div>
						</div>
					{/if}
				</div>

				<!-- Stats / actions row -->
				<StatsAndActions
					viewCount={data.lesson.viewCount}
					commentsCount={data.commentsCount}
					likesCount={data.likesCount}
					user={data.user}
					lessonId={data.lesson.id}
					isLikedByUser={data.likedByUser}
				/>

				<!-- Lesson Content Section -->
				{#if data.lesson.content}
					<section class="mt-10 space-y-4">
						<div class="mb-6">
							<h2 class="text-foreground mb-3 flex items-center gap-3 text-2xl font-bold">
								<div class="bg-primary h-8 w-1 rounded-full"></div>
								Съдържание на урока
							</h2>
							<p class="text-muted-foreground text-sm">
								{data.lesson.resume}
							</p>
						</div>

						<!-- EXPANDED / NOT EXPANDED DESCRIPTION -->
						{#if data.lesson.content.length > 1000}
							{#if !expandDescription}
								<div class="relative">
									<RenderStyledHtml class="max-w-7xl!">
										{@html data.lesson.content.slice(0, 1000)}
									</RenderStyledHtml>

									<div
										class="w-full flex bg-linear-to-t from-background items-end to-transparent absolute inset-0 justify-center py-4"
									>
										<Button variant="default" onclick={() => (expandDescription = true)}>
											Покажи повече
										</Button>
									</div>
								</div>
							{:else}
								<RenderStyledHtml class="max-w-7xl!">
									{@html data.lesson.content}
								</RenderStyledHtml>

								<div class="mt-4 flex justify-center">
									<Button variant="default" onclick={() => (expandDescription = false)}>
										Покажи по-малко
									</Button>
								</div>
							{/if}
						{/if}
					</section>
				{/if}

				{#if data.lesson.testId && data.lesson.test}
					<section class="mt-10">
						<!-- Associated Test Section -->
						<TestSection user={data.user} test={data.lesson.test} />
					</section>
				{/if}

				<section class="mt-10">
					<!-- Comments Section -->
					<CommentsSection user={data.user} lessonId={data.lesson.id} />
				</section>
			</div>
		</div>
	</Sidebar.Provider>
</div>
