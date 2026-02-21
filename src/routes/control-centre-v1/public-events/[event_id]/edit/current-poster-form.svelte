<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { UploadedFile } from '$lib/server/db/schema/files';
	import { DateFormatter } from '@internationalized/date';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { bytesToHumanReadable } from '$lib/utils/videos';
	import type { PublicEvent } from '$lib/server/db/schema/publicEvents';
	import { deletePublicEventPosterRemote } from '../../actions.remote';
	import { toast } from 'svelte-sonner';
	import { invalidateAll } from '$app/navigation';

	type Props = {
		eventId: PublicEvent['id'];
		file: UploadedFile;
	};

	const { file, eventId }: Props = $props();

	const df = new DateFormatter('bg', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	});

	let disabled = $state(false);

	async function deleteCurrentPoster() {
		disabled = true;

		try {
			const result = await deletePublicEventPosterRemote({
				eventId
			});

			if (result.success) {
				toast.success(result.message);
				await invalidateAll();
				return;
			}

			toast.error(result.message);
		} catch (err) {
			console.error(err);

			toast.error('Възникна грешка при изтриването на постера.');
		} finally {
			disabled = false;
		}
	}
</script>

<div>
	<div class="bg-muted mb-4 flex flex-col gap-4 rounded-md border p-2">
		<div class="flex flex-wrap gap-2">
			<img
				src="/api/file/{file.fileKey}"
				alt="Текущ постер"
				class="max-h-24 rounded-md object-contain"
			/>

			<div class="space-y-1 text-xs">
				<a
					href="/api/file/{file.fileKey}"
					class="block max-w-55 overflow-hidden text-nowrap text-ellipsis whitespace-nowrap underline"
				>
					{file.displayName}
				</a>

				<div>
					<span class="font-bold">{bytesToHumanReadable(file.size)}</span>
				</div>

				<div class="text-muted-foreground flex flex-wrap gap-x-1">
					ID на файла:
					<span class="font-bold">{file.id}</span>
				</div>

				<div class="text-muted-foreground flex flex-wrap gap-x-1">
					Качен на:
					<span class="font-bold">{df.format(new Date(file.createdAt))}</span>
				</div>

				<div class="text-muted-foreground flex flex-wrap gap-x-1">
					Качен от:
					<a href="/control-centre-v1/staff/{file.uploadedById}/edit" class="font-bold underline"
						>{file.uploadedById}</a
					>
				</div>
			</div>
		</div>

		<Button
			class="w-full"
			variant="destructive"
			type="submit"
			{disabled}
			onclick={async () => await deleteCurrentPoster()}
		>
			<Trash2 /> Изтрий постер
		</Button>
	</div>
</div>
