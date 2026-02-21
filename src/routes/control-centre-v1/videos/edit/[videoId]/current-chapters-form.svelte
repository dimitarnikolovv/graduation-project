<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { UploadedFile } from '$lib/server/db/schema/files';
	import { DateFormatter } from '@internationalized/date';
	import File from '@lucide/svelte/icons/file';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { deleteFileSchema, type DeleteFileSchema } from './schema';
	import { bytesToHumanReadable } from '$lib/utils/videos';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	type Props = {
		file: UploadedFile;
		data: SuperValidated<DeleteFileSchema>;
	};

	const { file, data }: Props = $props();

	const {
		form: formData,
		delayed,
		enhance
	} = superForm(data, {
		validators: zod4Client(deleteFileSchema),
		id: `delete-chapters-form-${file.id}`,
		dataType: 'json'
	});

	$formData.id = file.id;

	const df = new DateFormatter('bg', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	});
</script>

<div>
	<p class="text-muted-foreground mb-2 text-sm">Текущ файл с глави:</p>
	<div class="bg-muted mb-4 flex flex-col gap-4 rounded-md border p-2">
		<div class="flex flex-wrap gap-2">
			<File class="h-24 w-24 stroke-1"></File>

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

		<form action="?/deleteChapters" method="post" use:enhance>
			<Button class="w-full" variant="destructive" type="submit" disabled={$delayed}>
				<Trash2></Trash2>
			</Button>
		</form>
	</div>
</div>
