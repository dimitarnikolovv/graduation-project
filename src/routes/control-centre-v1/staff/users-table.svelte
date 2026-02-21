<script lang="ts">
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';
	import * as Table from '$lib/components/ui/table/index';
	import type { User } from '$lib/server/db/schema/auth';
	import type { PermissionsObject } from '$lib/types/permissions';
	import UserActions from './user-actions.svelte';

	type Props = {
		users: User[];
		userPermissions?: PermissionsObject;
	};
	let { users, userPermissions }: Props = $props();
</script>

{#snippet userRow(user: User)}
	<Table.Row>
		<Table.Cell class="">
			<span>
				{user.firstName}
				{user.lastName}
			</span>
		</Table.Cell>

		<Table.Cell class="">
			<a href="mailto:{user.email}" class="hover:underline">
				{user.email}
			</a>
		</Table.Cell>

		<Table.Cell class="text-center">
			<UserActions {user} {userPermissions}></UserActions>
		</Table.Cell>
	</Table.Row>
{/snippet}

<ScrollArea orientation="horizontal" class="mx-auto max-w-[94dvw] rounded-xl border p-2">
	<Table.Root class="">
		<Table.Header>
			<Table.Row class="!bg-background hover:bg-background">
				<Table.Head class="min-w-[10ch]">Име</Table.Head>
				<Table.Head class="min-w-[25ch]">Имейл</Table.Head>

				<Table.Head class="w-[40px]"></Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body class="hover:[tr:has(table)]:bg-background">
			{#each users as user (user.id)}
				{@render userRow(user)}
			{/each}
		</Table.Body>
	</Table.Root>
</ScrollArea>
