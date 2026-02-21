<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import Button from '$lib/components/ui/button/button.svelte';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import CirclePlus from '@lucide/svelte/icons/circle-plus';
	import * as Dialog from '$lib/components/ui/dialog';
	import { toast } from 'svelte-sonner';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';
	import * as Pagination from '$lib/components/ui/pagination';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { checkIfUserHasPermission } from '$lib/utils/access-control';
	import { UserPermissionsEnum } from '$lib/types/enums';
	import { setContext } from 'svelte';
	import SubjectsTable from './subjects-table.svelte';
	import { newSubjectSchema } from './schema';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import SubjectsFormFields from './SubjectsFormFields.svelte';

	let { data, form } = $props();

	let openCreate = $state(false);

	const newSubjectForm = superForm(data.newSubjectForm, {
		validators: zod4Client(newSubjectSchema),
		resetForm: true,
		dataType: 'json'
	});

	setContext('updateSubjectForm', data.updateSubjectForm);

	const { form: formData, enhance: createEnhance, delayed } = newSubjectForm;

	const handlePageChange = async (newPage: number | undefined) => {
		if (newPage === undefined) return;
		if (newPage > data.totalPages || newPage < 1) return;

		const searchParams = new URLSearchParams(page.url.search); // Avoid mutating the original URLSearchParams
		searchParams.set('page', newPage.toString());
		searchParams.set('limit', data.limit.toString());

		await goto(`${page.url.pathname}?${searchParams.toString()}`);
	};

	$effect(() => {
		if (form?.message) {
			if (form.form.valid) {
				toast.success(form.message);
			} else {
				toast.error(form.message);
			}
		}
	});
</script>

<div
	class="bg-background ignore-main-margin sticky top-0 z-50 flex items-center justify-between gap-4 py-1.5"
>
	<div class="flex items-center justify-between gap-4">
		<Button variant="outline" size="icon" class="h-7 w-7 shrink-0" href="/control-centre-v1">
			<ChevronLeft class="h-4 w-4" />
			<span class="sr-only">Назад</span>
		</Button>
		<h1 class="text-lg font-semibold md:text-2xl">Предмети</h1>
	</div>

	{#if checkIfUserHasPermission(data.userPermissions, UserPermissionsEnum.CreateSubjects)}
		<Button
			size="sm"
			onclick={() => {
				openCreate = true;
			}}
			class="flex items-center gap-2"
			><CirclePlus class="h-5 w-5 max-md:h-4 max-md:w-4" /> Добави предмет</Button
		>
	{/if}
</div>

{#if !(data.subjects && data.subjects.length > 0)}
	<div class="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
		<div class="flex flex-col items-center gap-1 text-center">
			<h3 class="text-2xl font-bold tracking-tight">Няма намерени предмети</h3>

			{#if checkIfUserHasPermission(data.userPermissions, UserPermissionsEnum.CreateSubjects)}
				<Button
					onclick={() => {
						openCreate = true;
					}}
					class="mt-4">Добави предмет</Button
				>
			{/if}
		</div>
	</div>
{:else}
	<div class="">
		{#key data.subjects}
			<SubjectsTable subjects={data.subjects} userPermissions={data.userPermissions}
			></SubjectsTable>
		{/key}
	</div>

	<Pagination.Root
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
						onclick={() => handlePageChange(currentPage ? currentPage - 1 : 1)}
					>
						<ChevronLeft class="w-4"></ChevronLeft> <span class="hidden sm:inline">Назад</span>
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
						onclick={() => handlePageChange(currentPage ? currentPage + 1 : 1)}
					>
						<span class="hidden sm:inline">Напред</span>
						<ChevronRight class="w-4"></ChevronRight>
					</Pagination.NextButton>
				</Pagination.Item>
			</Pagination.Content>
		{/snippet}
	</Pagination.Root>
{/if}

{#if checkIfUserHasPermission(data.userPermissions, UserPermissionsEnum.CreateSubjects)}
	<Dialog.Root bind:open={openCreate}>
		<Dialog.Content class="">
			<Dialog.Header>
				<Dialog.Title class="text-center leading-6">Нов предмет</Dialog.Title>
			</Dialog.Header>

			<form action="?/createSubject" method="POST" use:createEnhance>
				<div class="grid gap-2">
					<ScrollArea orientation="vertical" class="max-h-[80dvh]">
						<SubjectsFormFields
							form={newSubjectForm}
							bind:formData={$formData}
							delayed={$delayed}
						/>
					</ScrollArea>
				</div>

				<Dialog.Footer>
					<div class="flex w-full justify-center gap-4">
						<Button type="submit" disabled={$delayed}>Запази</Button>

						<Button
							onclick={() => {
								openCreate = false;
							}}
							disabled={$delayed}
							variant="outline"
						>
							Отказ
						</Button>
					</div>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>
{/if}
