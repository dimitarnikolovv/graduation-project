<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { SessionValidationResult } from '$lib/server/auth';
	import type { Lesson } from '$lib/server/db/schema/lessons';
	import { getLessonCommentsRemote, postCommentRemote } from '$lib/remote-functions/lessons.remote';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import * as Pagination from '$lib/components/ui/pagination/index.js';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { page } from '$app/state';
	import Comment from './Comment.svelte';
	import PaginationResultsInfo from '$lib/components/PaginationResultsInfo.svelte';
	import { fade } from 'svelte/transition';

	type Props = {
		user: SessionValidationResult['user'] | null;
		lessonId: Lesson['id'];
	};

	const { lessonId, user }: Props = $props();
	const limit = 20;

	let commentsPage = $state(1);

	let commentsPromise = $derived(getLessonCommentsRemote({ lessonId, page: commentsPage, limit }));

	let { comments, totalItems, totalPages } = $derived(await commentsPromise);
</script>

<div>
	<h2 class="text-foreground mb-6 flex items-center gap-3 text-2xl font-bold">
		<div class="bg-primary h-8 w-1 rounded-full"></div>
		Коментари
	</h2>

	{#if user}
		<form
			{...postCommentRemote.enhance(({ submit }) => {
				postCommentRemote.fields.lessonId.set(lessonId);
				submit();
				postCommentRemote.fields.content.set('');
			})}
			class="space-y-2"
		>
			<div class="space-y-1">
				<Textarea {...postCommentRemote.fields.content.as('text')} placeholder="Напиши коментар..."
				></Textarea>
				{#each postCommentRemote.fields.content.issues() ?? [] as issue}
					<p class="text-sm text-destructive">{issue.message}</p>
				{/each}
			</div>

			<Input {...postCommentRemote.fields.lessonId.as('hidden', lessonId)} />

			<Button
				type="submit"
				class="w-full sm:w-auto"
				disabled={!!postCommentRemote.pending}
				aria-busy={!!postCommentRemote.pending}>Публикувай</Button
			>
		</form>
	{:else}
		<div class="mb-4 rounded-md border border-dashed bg-secondary/50 p-4 flex flex-col gap-3">
			<p class="text-center text-sm text-muted-foreground">
				Моля, влезте в профила си, за да оставите коментар.
			</p>

			<Button class="mx-auto" size="sm" href="/login">Вход</Button>
		</div>
	{/if}

	<div class="mt-6">
		{#if comments.length > 0}
			<div class="mb-4 flex justify-end">
				<PaginationResultsInfo {totalItems} page={commentsPage} {totalPages} {limit} />
			</div>

			<div class="space-y-4">
				{#each comments as comment (comment.id)}
					<div transition:fade>
						<Comment {comment} {user} />
					</div>
				{/each}
			</div>

			<!-- Pagination Controls -->
			<Pagination.Root
				count={totalItems}
				page={commentsPage}
				perPage={limit}
				onPageChange={async (p) => {
					commentsPage = p;
				}}
				class="mt-6"
			>
				{#snippet children({ pages, currentPage })}
					<Pagination.Content>
						<Pagination.Item>
							<Pagination.PrevButton
								onclick={() => (commentsPage = currentPage ? currentPage - 1 : 1)}
							>
								<ChevronLeft class="w-4"></ChevronLeft>
								<span class="hidden sm:inline">Назад</span>
							</Pagination.PrevButton>
						</Pagination.Item>
						{#each pages as page (page.key)}
							{#if page.type === 'ellipsis'}
								<Pagination.Item>
									<Pagination.Ellipsis />
								</Pagination.Item>
							{:else}
								<Pagination.Item>
									<Pagination.Link {page} isActive={currentPage === page.value}>
										{page.value}
									</Pagination.Link>
								</Pagination.Item>
							{/if}
						{/each}
						<Pagination.Item>
							<Pagination.NextButton
								onclick={() => (commentsPage = currentPage ? currentPage + 1 : 1)}
							>
								<span class="hidden sm:inline">Напред</span>
								<ChevronRight class="w-4"></ChevronRight>
							</Pagination.NextButton>
						</Pagination.Item>
					</Pagination.Content>
				{/snippet}
			</Pagination.Root>
		{:else}
			<div
				class="mt-4 flex h-48 w-full items-center justify-center rounded-lg border border-dashed px-2 py-10 shadow-sm"
			>
				<div class="flex flex-col items-center gap-4 text-center">
					<h3 class="text-2xl font-bold tracking-tight">Все още няма коментари</h3>
					<p class="text-muted-foreground">Бъди първият, който ще остави такъв!</p>
				</div>
			</div>
		{/if}
	</div>
</div>
