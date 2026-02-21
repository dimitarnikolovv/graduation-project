<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import SquarePen from '@lucide/svelte/icons/square-pen';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Info from '@lucide/svelte/icons/info';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import * as Pagination from '$lib/components/ui/pagination/index.js';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import type { ChoiceConfig, TextConfig, FileUploadConfig } from '$lib/types/tests';
	import RenderStyledHtml from '$lib/components/RenderStyledHtml.svelte';
	import { cn } from '$lib/utils';
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { QuestionTypeEnum } from '$lib/types/enums.js';
	import Option from './Option.svelte';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';

	const { data } = $props();

	const handlePageChange = async (newPage: number | undefined, section?: string) => {
		if (newPage === undefined) return;
		if (newPage > data.totalPages || newPage < 1) return;

		const searchParams = new URLSearchParams(page.url.search); // Avoid mutating the original URLSearchParams
		searchParams.set('page', newPage.toString());

		await goto(`${page.url.pathname}?${searchParams.toString()}`);
	};
</script>

{#snippet sidebar()}
	<div
		class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
	>
		<h3 class="mb-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
			Навигация по въпроси
		</h3>
		<div class="flex flex-wrap gap-2">
			{#each Array.from({ length: data.totalItems }, (_, i) => i + 1) as questionNumber}
				{@const isVisible =
					questionNumber > (data.page - 1) * data.limit && questionNumber <= data.page * data.limit}
				<button
					onclick={() => {
						const targetPage = Math.ceil(questionNumber / data.limit);
						handlePageChange(targetPage, `question-${questionNumber}`);
					}}
					class="flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-medium transition-colors
										{isVisible
						? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300'
						: 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'}"
				>
					{questionNumber}
				</button>
			{/each}
		</div>
		<div
			class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600 dark:text-gray-400"
		>
			<div class="flex items-center gap-2">
				<div
					class="size-3 rounded border border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950"
				></div>
				<span>Текуща страница</span>
			</div>
			<div class="flex items-center gap-2">
				<div
					class="size-3 rounded border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700"
				></div>
				<span>Други страници</span>
			</div>
		</div>
	</div>
{/snippet}

<div
	class="bg-background ignore-main-margin sticky top-0 z-50 flex items-center justify-between gap-4 py-1.5 max-sm:flex-col"
>
	<div class="flex items-center justify-between gap-4">
		<Button variant="outline" size="icon" class="h-7 w-7 shrink-0" href="/control-centre-v1/tests">
			<ChevronLeft class="h-4 w-4" />
			<span class="sr-only">Назад</span>
		</Button>
		<h1 class="text-lg font-semibold md:text-2xl">{data.test.title}</h1>
	</div>

	<Button size="sm" href="/control-centre-v1/tests/{data.test.id}/edit" class="max-sm:w-full">
		<SquarePen class="mr-2 h-4 w-4" />
		Редактирай
	</Button>
</div>

<div class="mb-8">
	<div
		class="relative overflow-hidden rounded-2xl border border-blue-200/50 bg-slate-50 p-6 shadow-sm dark:border-blue-800/50 dark:bg-slate-900"
	>
		<div class="relative flex items-center justify-between">
			<div>
				<div class="text-sm font-medium text-gray-700 dark:text-gray-300">Показване на въпроси</div>
				<div class="text-lg font-bold text-gray-900 dark:text-gray-100">
					<span class="text-blue-600 dark:text-blue-400">{(data.page - 1) * data.limit + 1}</span>
					<span class="mx-2 text-gray-400 dark:text-gray-500">-</span>
					<span class="text-blue-600 dark:text-blue-400"
						>{Math.min(data.page * data.limit, data.totalItems)}</span
					>
					<span class="mx-2 text-gray-400 dark:text-gray-500">от</span>
					<span class="text-gray-900 dark:text-gray-100">{data.totalItems}</span>
				</div>
			</div>

			<div class="flex items-center gap-3">
				<div
					class="flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 shadow-sm dark:border-blue-800 dark:bg-slate-800"
				>
					<div class="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400"></div>
					<span class="text-sm font-semibold text-gray-700 dark:text-gray-300">
						Страница {data.page} от {data.totalPages}
					</span>
				</div>
			</div>
		</div>
	</div>
</div>

<div class="flex w-full gap-x-8 2xl:gap-x-14">
	<div class="w-full">
		<div class="@container/wrapper mb-8">
			<div class="mb-6 flex items-start justify-between">
				<div>
					<h2 class="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">Преглед на тест</h2>
					<p class="text-gray-600 dark:text-gray-400">
						Това е преглед на теста. Отговорите не могат да бъдат изпратени.
					</p>
				</div>
				<div
					class="flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-2 dark:bg-yellow-900/30"
				>
					<TriangleAlert class="h-4 w-4 text-yellow-600 dark:text-yellow-400" />

					<span class="text-sm font-medium text-yellow-800 dark:text-yellow-300">Преглед</span>
				</div>
			</div>

			<div
				class="mb-6 grid gap-6 @lg/wrapper:grid-cols-2 @2xl/wrapper:grid-cols-3 @6xl/wrapper:grid-cols-6"
			>
				<div
					class="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center dark:border-blue-800 dark:bg-blue-950"
				>
					<div class="mb-1 text-4xl font-bold text-blue-600 dark:text-blue-400">
						{data.totalItems}
					</div>
					<div class="text-sm font-medium text-blue-700 dark:text-blue-300">Брой въпроси</div>
				</div>

				<div
					class="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-700 dark:bg-gray-800"
				>
					<div class="mb-1 text-4xl font-bold text-gray-900 dark:text-gray-100">
						{data.test.maxScore}
					</div>
					<div class="text-sm font-medium text-gray-700 dark:text-gray-300">Макс. точки</div>
				</div>

				<div
					class="rounded-2xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-950"
				>
					<div class="mb-1 text-4xl font-bold text-green-600 dark:text-green-400">
						{data.test.timeLimitSec > 0 ? Math.floor(data.test.timeLimitSec / 60) : '∞'}
					</div>
					<div class="text-sm font-medium text-green-700 dark:text-green-300">Време (мин)</div>
				</div>

				<div
					class="rounded-2xl border border-purple-200 bg-purple-50 p-6 text-center dark:border-purple-800 dark:bg-purple-950"
				>
					<div class="mb-1 text-4xl font-bold text-purple-600 dark:text-purple-400">
						{data.test.allowedAttempts || '∞'}
					</div>
					<div class="text-sm font-medium text-purple-700 dark:text-purple-300">Опити</div>
				</div>

				<div
					class="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 text-center dark:border-yellow-800 dark:bg-yellow-950"
				>
					<div class="mb-1 text-4xl font-bold text-yellow-800 dark:text-yellow-400">
						{data.limit}
					</div>
					<div class="text-sm font-medium text-yellow-700 dark:text-yellow-300">На страница</div>
				</div>

				<div
					class="rounded-2xl border border-orange-200 bg-orange-50 p-6 text-center dark:border-orange-800 dark:bg-orange-950"
				>
					<div class="mb-1 text-4xl font-bold text-orange-600 dark:text-orange-400">
						{data.page}
					</div>
					<div class="text-sm font-medium text-orange-700 dark:text-orange-300">
						Страница от {data.totalPages}
					</div>
				</div>
			</div>

			<!-- Test Description -->
			{#if data.test.description}
				<div
					class="rounded-2xl border-l-4 border-blue-500 bg-gray-50 p-6 dark:border-blue-400 dark:bg-gray-800"
				>
					<h3 class="mb-3 font-semibold text-gray-900 dark:text-gray-100">Описание на теста:</h3>
					<p class="leading-relaxed text-gray-700 dark:text-gray-300">
						{@html data.test.description}
					</p>
				</div>
			{/if}
		</div>

		{#if data.questions && data.questions.length > 0}
			<!-- Mobile Question Navigation (shown on small screens) -->
			<div class="mb-8 xl:hidden">
				{@render sidebar()}
			</div>

			<!-- Questions Content -->
			<div class="flex-1 space-y-8">
				{#each data.questions as question, index}
					<div
						id="question-{(data.page - 1) * data.limit + index + 1}"
						class="scroll-m-11 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6 dark:border-gray-700 dark:bg-gray-800"
					>
						<!-- Question Header -->
						<div class="mb-6 flex items-center justify-between">
							<div class="flex items-center gap-3">
								<div
									class="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-bold text-white dark:bg-blue-500"
								>
									{(data.page - 1) * data.limit + index + 1}
								</div>
								<div
									class="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
								>
									{question.points}
									{question.points === 1 ? 'точка' : 'точки'}
								</div>
							</div>
							<div class="flex items-center gap-2">
								<span
									class="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300"
								>
									{question.type === QuestionTypeEnum.SingleChoice
										? 'Един верен'
										: question.type === QuestionTypeEnum.MultipleChoice
											? 'Няколко верни'
											: question.type === QuestionTypeEnum.FileUpload
												? 'Прикачен файл'
												: 'Свободен текст'}
								</span>
								{#if question.type === QuestionTypeEnum.SingleChoice || question.type === QuestionTypeEnum.MultipleChoice}
									{@const choiceConfig = question.config as ChoiceConfig}
									{#if choiceConfig.correct && question.type === QuestionTypeEnum.MultipleChoice}
										<span
											class="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
										>
											{choiceConfig.correct.length}
											{choiceConfig.correct.length === 1 ? 'верен' : 'верни'}
										</span>
									{/if}
								{/if}
							</div>
						</div>

						<!-- Question Stem -->
						<div class="mb-6">
							<h3 class="text-lg leading-relaxed font-medium text-gray-900 dark:text-gray-100">
								<RenderStyledHtml renderAsInlineBlock={true}>
									{@html question.stem}
								</RenderStyledHtml>
							</h3>
						</div>

						<!-- Question Content based on type -->
						{#if question.type === QuestionTypeEnum.SingleChoice || question.type === QuestionTypeEnum.MultipleChoice}
							{@const choiceConfig = question.config as ChoiceConfig}
							{#if question.type === QuestionTypeEnum.SingleChoice}
								<RadioGroup.Root
									value={choiceConfig.correct.length > 0 ? `option-${choiceConfig.correct[0]}` : ''}
									disabled
								>
									<div class="space-y-3">
										{#each choiceConfig.options as option}
											{@const isCorrect = choiceConfig.correct.includes(option.id)}
											<Option questionId={question.id} {option} selected={isCorrect}>
												<div class="flex h-5 items-center">
													<RadioGroup.Item
														class={cn(
															isCorrect && '[&_svg]:fill-green-700 [&_svg]:stroke-green-600'
														)}
														disabled
														value="option-{option.id}"
														id="option-{question.id}-{option.id}"
													/>
												</div>
											</Option>
										{/each}
									</div>
								</RadioGroup.Root>
							{:else}
								<div class="space-y-3">
									{#each choiceConfig.options as option}
										{@const isCorrect = choiceConfig.correct.includes(option.id)}
										<Option questionId={question.id} {option} selected={isCorrect}>
											<div class="flex h-5 items-center">
												<Checkbox
													class={cn(isCorrect && 'border-green-600! bg-green-600! text-white!')}
													id="option-{question.id}-{option.id}"
													disabled
													checked={isCorrect}
												/>
											</div>
										</Option>
									{/each}
								</div>
							{/if}
						{:else if question.type === QuestionTypeEnum.Text}
							{@const textConfig = question.config as TextConfig}
							<div class="space-y-4">
								<div class="relative">
									<Textarea
										class="bg-muted min-h-28 w-full resize-none rounded-lg border p-4"
										readonly
										disabled
										placeholder="Въведете вашия отговор тук..."
									></Textarea>

									<div class="text-muted-foreground absolute right-4 bottom-4 text-xs">
										Максимална дължина: {textConfig.maxLength} символа
									</div>
								</div>

								{#if textConfig.sampleAnswer}
									<div
										class="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30"
									>
										<div class="mb-2 flex items-center gap-2">
											<Info class="h-4 w-4 text-blue-600 dark:text-blue-400" />
											<div class="text-sm font-medium text-blue-900 dark:text-blue-300">
												Примерен отговор:
											</div>
										</div>
										<div class="text-sm leading-relaxed text-blue-800 dark:text-blue-200">
											{textConfig.sampleAnswer}
										</div>
									</div>
								{/if}
							</div>
						{:else if question.type === QuestionTypeEnum.FileUpload}
							{@const fileConfig = question.config as FileUploadConfig}
							<div class="space-y-4">
								<!-- File Upload Zone Preview -->
								<div
									class="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-600 dark:bg-gray-800/50"
								>
									<svg
										class="mx-auto h-12 w-12 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
										></path>
									</svg>
									<p class="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
										Плъзнете и пуснете файлове тук или кликнете за избор
									</p>
									<p class="text-muted-foreground mt-1 text-xs">
										(Зона за качване на файлове - недостъпна в преглед)
									</p>
								</div>

								<!-- File Upload Configuration Info -->
								<div
									class="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-950/30"
								>
									<div class="mb-3 flex items-center gap-2">
										<Info class="h-4 w-4 text-purple-600 dark:text-purple-400" />
										<div class="text-sm font-medium text-purple-900 dark:text-purple-300">
											Настройки за качване:
										</div>
									</div>
									<div class="grid gap-2 text-sm text-purple-800 dark:text-purple-200">
										<div class="flex items-center gap-2">
											<span class="font-medium">Позволени типове:</span>
											<span>
												{fileConfig.allowedTypes
													.map((t) => {
														if (t === 'image/*') return 'Изображения';
														if (t === 'application/pdf') return 'PDF';
														if (t.startsWith('image/')) return t.replace('image/', '').toUpperCase();
														return t;
													})
													.join(', ')}
											</span>
										</div>
										<div class="flex items-center gap-2">
											<span class="font-medium">Макс. размер:</span>
											<span>{fileConfig.maxFileSizeMB} MB</span>
										</div>
										<div class="flex items-center gap-2">
											<span class="font-medium">Макс. брой файлове:</span>
											<span>{fileConfig.maxFiles}</span>
										</div>
									</div>
								</div>

								<!-- Instructions if present -->
								{#if fileConfig.instructions}
									<div
										class="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30"
									>
										<div class="mb-2 flex items-center gap-2">
											<Info class="h-4 w-4 text-blue-600 dark:text-blue-400" />
											<div class="text-sm font-medium text-blue-900 dark:text-blue-300">
												Инструкции:
											</div>
										</div>
										<div class="text-sm leading-relaxed text-blue-800 dark:text-blue-200">
											{fileConfig.instructions}
										</div>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<div class="py-16 text-center">
				<div class="mx-auto max-w-md rounded-lg bg-gray-50 p-8 dark:bg-gray-800">
					<svg
						class="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-500"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						></path>
					</svg>
					<h3 class="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">Няма въпроси</h3>
					<p class="text-sm text-gray-500 dark:text-gray-400">
						В този тест няма въпроси за показване.
					</p>
				</div>
			</div>
		{/if}
	</div>
	<!-- Desktop Sticky Sidebar Navigation (shown on large screens) -->
	<div class="hidden w-80 shrink-0 xl:block">
		<div class="sticky top-14">
			{@render sidebar()}
		</div>
	</div>
</div>

<!-- Test Preview Component -->

<Pagination.Root
	class="mt-8"
	count={data.totalItems}
	page={data.page}
	perPage={data.limit}
	onPageChange={async (p) => {
		await handlePageChange(p);
	}}
>
	{#snippet children({ pages, currentPage })}
		<Pagination.Content>
			<Pagination.Item>
				<Pagination.PrevButton
					class="mr-2 rounded-full border"
					onclick={() => handlePageChange(currentPage ? currentPage - 1 : 1)}
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
						<Pagination.Link
							{page}
							class={cn(
								'rounded-full border',
								currentPage === page.value && 'bg-foreground! text-background!'
							)}
							isActive={currentPage === page.value}
						>
							{page.value}
						</Pagination.Link>
					</Pagination.Item>
				{/if}
			{/each}
			<Pagination.Item>
				<Pagination.NextButton
					class="ml-2 rounded-full border"
					disabled={currentPage === data.totalPages}
					onclick={() => handlePageChange(currentPage ? currentPage + 1 : 1)}
				>
					<span class="hidden sm:inline">Напред</span>
					<ChevronRight class="w-4"></ChevronRight>
				</Pagination.NextButton>
			</Pagination.Item>
		</Pagination.Content>
	{/snippet}
</Pagination.Root>
