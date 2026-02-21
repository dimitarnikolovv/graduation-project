<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import Dropzone from '$lib/components/ui-extras/dropzone';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import Label from '$lib/components/ui/label/label.svelte';
	import Progress from '$lib/components/ui/progress/progress.svelte';
	import ScrollArea from '$lib/components/ui/scroll-area/scroll-area.svelte';
	import { uploadHLSViaPresigned, createUploadProgressStore, cancelHLSUpload } from '$lib/s3';
	import { bytesToHumanReadable } from '$lib/utils/videos.js';
	import CircleCheckBig from '@lucide/svelte/icons/circle-check-big';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import CircleOff from '@lucide/svelte/icons/circle-off';
	import Upload from '@lucide/svelte/icons/upload';
	import CircleX from '@lucide/svelte/icons/circle-x';
	import { onDestroy } from 'svelte';
	import { toast } from 'svelte-sonner';

	let files: FileList | null = $state(null);

	let displayName = $state('');

	let wakeLock: WakeLockSentinel | null = null;

	let uploadResult: Awaited<ReturnType<typeof uploadHLSViaPresigned>> = $state([]);

	const uploadProgress = createUploadProgressStore();

	let isUploading = $derived($uploadProgress.status === 'uploading');

	let videoId = $derived($uploadProgress.videoId);

	const handleDrop = async (event: any) => {
		const { acceptedFiles }: { acceptedFiles: FileList } = event.detail;

		files = acceptedFiles;
	};

	async function requestWakeLock() {
		try {
			// Safari fallback: API may not exist
			if (!('wakeLock' in navigator)) return;

			// If already held, do nothing
			if (wakeLock && !wakeLock.released) return;

			wakeLock = await (navigator as any).wakeLock.request('screen');

			// If the lock is released (e.g., system or tab hidden), you’ll get this event
			wakeLock?.addEventListener('release', () => {
				// If still uploading and page is visible, try to re-acquire
				if (isUploading && document.visibilityState === 'visible') {
					void requestWakeLock();
				}
			});
		} catch (err) {
			// Can fail if OS denies it, low battery mode, etc.
			console.warn('Wake lock request failed:', err);
		}
	}

	async function releaseWakeLock() {
		try {
			if (wakeLock) {
				await wakeLock.release();
				wakeLock = null;
			}
		} catch (err) {
			console.warn('Wake lock release failed:', err);
		}
	}

	async function handleBeforeUnload(event: BeforeUnloadEvent) {
		await releaseWakeLock();

		if (isUploading) {
			// Show native confirmation dialog
			event.preventDefault();

			event.returnValue = '';
		}
	}

	beforeNavigate(async ({ from, to, cancel }) => {
		if (!isUploading) return;

		if (
			!confirm(
				'В момента се качва видео. Ако напуснете страницата, качването ще бъде прекратено. Сигурни ли сте, че искате да напуснете?'
			)
		) {
			cancel();
		} else {
			await cancelHLSUpload({
				videoId,
				uploadProgress
			});

			await releaseWakeLock();
		}
	});

	// Re-acquire when the tab becomes visible again
	async function handleVisibilityChange() {
		if (document.visibilityState === 'visible' && isUploading) {
			await requestWakeLock();
		}
	}

	$effect(() => {
		(async () => {
			if (isUploading) {
				await requestWakeLock();
			} else {
				await releaseWakeLock();
			}
		})();
	});

	async function startUpload() {
		if (!files) {
			toast.error('Моля изберете папка с HLS файлове.');
			return;
		}

		if (!displayName) {
			toast.error('Моля въведете име на видеото.');
			return;
		}

		try {
			uploadResult = await uploadHLSViaPresigned({
				folder: files,
				uploadProgress,
				displayName
			});
		} catch (err) {
			console.error('Upload failed:', err);
			uploadProgress.update((p) => ({
				...p,
				status: 'error'
			}));
		}
	}

	async function cancelUpload() {
		await cancelHLSUpload({
			videoId,
			uploadProgress
		});
	}

	onDestroy(async () => {
		if (isUploading) {
			await cancelHLSUpload({
				videoId,
				uploadProgress
			});
		}

		await releaseWakeLock();
	});
</script>

<svelte:window
	onbeforeunload={handleBeforeUnload}
	onpagehide={releaseWakeLock}
	onvisibilitychange={handleVisibilityChange}
/>

<div
	class="bg-background ignore-main-margin sticky top-0 z-50 flex items-center justify-between gap-4 py-1.5"
>
	<div class="flex items-center justify-between gap-4">
		<Button variant="outline" size="icon" class="h-7 w-7 shrink-0" href="/control-centre-v1/videos">
			<ChevronLeft class="h-4 w-4" />
			<span class="sr-only">Назад</span>
		</Button>
		<h1 class="text-lg font-semibold md:text-2xl">Качване на видео</h1>
	</div>
</div>

<div class="space-y-3">
	<Label>Име на видеото <span class="text-destructive font-bold">*</span></Label>
	<Input required placeholder="Въведете име на видеото" bind:value={displayName} />
</div>

<div class="grid gap-y-4">
	<Dropzone
		on:click={handleDrop}
		on:drop={handleDrop}
		disabled={$uploadProgress.status === 'uploading'}
		multiple
		webkitdirectory
		class="aspect-auto! min-h-48"
	>
		{#if !files || files?.length === 0}
			<div class="pointer-events-none flex flex-col items-center gap-1">
				<Upload class="text-muted-foreground pointer-events-none h-5 w-5" />
				<span>Качи папка с HLS файлове</span>
			</div>
		{/if}

		{#if files && files?.length > 0}
			<div class="bg-muted pointer-events-none m-4 rounded-md p-2 max-sm:mb-10">
				Избрани <span class="font-mono">{files.length}</span> файла.
			</div>
		{/if}
	</Dropzone>

	<Button onclick={startUpload} disabled={!files || files.length === 0}>
		<Upload class="h-5 w-5" /> Качи
	</Button>
</div>

{#if $uploadProgress.status === 'uploading'}
	<div class="upload-status space-y-4">
		<p>
			Качване на файл {$uploadProgress.currentPart} от {$uploadProgress.totalParts}... ({bytesToHumanReadable(
				$uploadProgress.uploadedBytes
			)} от {bytesToHumanReadable($uploadProgress.totalBytes)}) ({$uploadProgress.percentComplete}%)
		</p>
		<Progress class="h-3" max={100} value={$uploadProgress.percentComplete}></Progress>

		<Button variant="outline" onclick={cancelUpload}>Отмени</Button>
	</div>
{:else if $uploadProgress.status === 'done'}
	<div>
		<div class="flex items-center gap-2">
			<CircleCheckBig class="h-5 w-5 stroke-green-600" /> Качването е завършено! Качени файлове: {uploadResult.length}
		</div>

		<ScrollArea orientation="vertical" class="bg-accent mt-2 h-80 rounded-md p-2">
			<ul>
				{#each uploadResult as file}
					<li class="text-sm">
						{file.originalName} ({file.webkitRelativePath}) ->
						<code class="text-sm">{file.key}</code>
					</li>
				{/each}
			</ul>
		</ScrollArea>
	</div>
{:else if $uploadProgress.status === 'canceled'}
	<div class="flex items-center gap-2"><CircleOff class="h-5 w-5" /> Качването е отменено.</div>
{:else if $uploadProgress.status === 'error'}
	<div class="flex items-center gap-2">
		<CircleX class="stroke-destructive h-5 w-5" /> Възникна грешка при качването на папката с HLS файлове.
	</div>
{/if}
