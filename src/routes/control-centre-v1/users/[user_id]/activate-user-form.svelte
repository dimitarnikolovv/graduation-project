<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms';
	import { activateUserSchema, type ActivateUserSchema } from './schema';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { getContext } from 'svelte';
	import type { User } from '$lib/server/db/schema/auth';

	type Props = {
		user: Omit<User, 'passwordHash'>;
	};

	let { user }: Props = $props();

	const activateUserFormData = getContext('activateUserForm') as SuperValidated<ActivateUserSchema>;

	const activateUserForm = superForm(activateUserFormData, {
		validators: zod4Client(activateUserSchema),
		dataType: 'json',
		resetForm: false,
		id: `activateUserForm-${user.id}`
	});

	const {
		form: activateFormData,
		enhance: activateEnhance,
		delayed: activateDelayed
	} = activateUserForm;

	$activateFormData.userId = user.id;
</script>

<form action="/control-centre-v1/users/{user.id}?/activateUser" method="POST" use:activateEnhance>
	<Button type="submit" disabled={$activateDelayed} variant="destructive">Възстанови профила</Button
	>
</form>
