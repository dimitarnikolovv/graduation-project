<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
	import { MediaQuery } from 'svelte/reactivity';
	import type { Snippet } from 'svelte';

	const isDesktop = new MediaQuery('(min-width: 768px)');

	type Props = {
		open?: boolean;
		trigger?: Snippet;
		title: Snippet;
		description?: Snippet;
		content?: Snippet;
		closeButtonText?: string;
		actionButton?: Snippet;
		disabled?: boolean;
	};

	let {
		open = $bindable(),
		trigger,
		title,
		description,
		content,
		closeButtonText = 'Отказ',
		actionButton,
		disabled = false
	}: Props = $props();
</script>

{#if isDesktop.current}
	<Dialog.Root bind:open>
		{#if trigger}
			<Dialog.Trigger>
				{@render trigger()}
			</Dialog.Trigger>
		{/if}
		<Dialog.Content class="sm:max-w-106.25">
			<Dialog.Header>
				<Dialog.Title>
					{@render title()}
				</Dialog.Title>
				{#if description}
					<Dialog.Description>
						{@render description()}
					</Dialog.Description>
				{/if}
			</Dialog.Header>
			<div class="space-y-6">
				{#if content}
					{@render content()}
				{/if}
				<div class="grid grid-cols-2 gap-2">
					{#if actionButton}
						{@render actionButton()}
					{/if}
					<Button variant="outline" onclick={() => (open = false)} class="w-full" {disabled}>
						{closeButtonText}
					</Button>
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open>
		{#if trigger}
			<Drawer.Trigger>
				{@render trigger()}
			</Drawer.Trigger>
		{/if}
		<Drawer.Content>
			<Drawer.Header class="text-left">
				<Drawer.Title>
					{@render title()}
				</Drawer.Title>
				<Drawer.Description>
					{#if description}
						{@render description()}
					{/if}
				</Drawer.Description>
			</Drawer.Header>
			<div class="space-y-6 px-4">
				{#if content}
					{@render content()}
				{/if}

				{#if actionButton}
					{@render actionButton()}
				{/if}
			</div>
			<Drawer.Footer class="pt-2">
				<Drawer.Close class={buttonVariants({ variant: 'outline' })} {disabled}>
					{closeButtonText}
				</Drawer.Close>
			</Drawer.Footer>
		</Drawer.Content>
	</Drawer.Root>
{/if}
