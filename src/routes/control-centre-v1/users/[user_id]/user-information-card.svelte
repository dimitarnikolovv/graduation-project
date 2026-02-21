<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import type { User } from '$lib/server/db/schema/auth';
	import { DateFormatter } from '@internationalized/date';

	type Props = {
		user: Omit<User, 'passwordHash'>;
	};
	let { user }: Props = $props();

	const df = new DateFormatter('bg', {
		dateStyle: 'long',
		timeStyle: 'short'
	});
</script>

<Card.Root>
	<Card.Header class="max-sm:px-4">
		<Card.Title>Данни на потребителя</Card.Title>
	</Card.Header>

	<Card.Content class="max-sm:px-4">
		<div class="grid gap-2 text-sm sm:grid-cols-2">
			<div>
				<span>ID на потребителя:</span>
				<span class="font-medium">
					{user.id}
				</span>
			</div>

			<div>
				<span>Регистриран на:</span>
				<span class="font-medium">
					{df.format(new Date(user.createdAt))}
				</span>
			</div>
			<div>
				<span>Последно променен на:</span>
				<span class="font-medium">
					{df.format(new Date(user.updatedAt))}
				</span>
			</div>
		</div>
	</Card.Content>
</Card.Root>
