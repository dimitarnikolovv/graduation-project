<script lang="ts">
	import type { SuperForm, SuperValidated } from 'sveltekit-superforms';
	import type { GeneralAdminInfoSchema } from './schema';
	import Button from '$lib/components/ui/button/button.svelte';
	import X from '@lucide/svelte/icons/x';
	import Check from '@lucide/svelte/icons/check';
	import * as Form from '$lib/components/ui/form/index';
	import { Input } from '$lib/components/ui/input/index';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { getUserPermissionToDisplay, UserPermissionsEnum } from '$lib/types/enums.js';
	import { tick, type Snippet } from 'svelte';

	type Props<T extends GeneralAdminInfoSchema> = {
		form: SuperForm<T>;
		formData: SuperValidated<T>['data'];
		delayed: boolean;
		passwordFields: Snippet;
	};

	let {
		form,
		formData = $bindable(),
		delayed,
		passwordFields
	}: Props<GeneralAdminInfoSchema> = $props();

	function allowAllPermissions() {
		Object.values(UserPermissionsEnum).forEach((permission) => {
			formData.permissions[permission] = true;
		});
	}

	function disallowAllPermissions() {
		Object.values(UserPermissionsEnum).forEach((permission) => {
			formData.permissions[permission] = false;
		});
	}
</script>

<div class="flex-1">
	<div class="grid grid-cols-2 gap-2">
		<Form.Field {form} name="firstName">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label
						>Име
						<span class="text-destructive text-sm">*</span></Form.Label
					>
					<Input
						{...props}
						disabled={delayed}
						bind:value={formData.firstName}
						type="text"
						required
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="lastName">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label
						>Фамилия
						<span class="text-destructive text-sm">*</span></Form.Label
					>
					<Input
						{...props}
						disabled={delayed}
						bind:value={formData.lastName}
						type="text"
						required
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>
	</div>

	<Form.Field {form} name="email">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Имейл <span class="text-destructive text-sm">*</span></Form.Label>
				<Input
					{...props}
					disabled={delayed}
					bind:value={formData.email}
					type="email"
					placeholder="m@example.com"
					required
				/>
			{/snippet}
		</Form.Control>
		<Form.FieldErrors />
	</Form.Field>

	{@render passwordFields()}
</div>

<div>
	<div class="flex items-center justify-between gap-3">
		<h2 class="mb-4 text-lg font-medium">Права на достъп</h2>

		<div class="flex items-center gap-2">
			<Button size="icon" onclick={allowAllPermissions}><Check /></Button>
			<Button size="icon" variant="destructive" onclick={disallowAllPermissions}><X /></Button>
		</div>
	</div>
	<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
		{#each Object.values(UserPermissionsEnum) as permission}
			<Form.Field {form} name={`permissions.${permission}`}>
				<Form.Control>
					{#snippet children({ props })}
						<div class="flex items-center gap-2">
							<Checkbox
								{...props}
								bind:checked={formData.permissions[permission]}
								disabled={delayed}
							/>
							<Form.Label>{getUserPermissionToDisplay(permission)}</Form.Label>
						</div>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		{/each}
	</div>
</div>
