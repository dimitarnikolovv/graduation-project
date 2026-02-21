<script lang="ts">
	/**
	 * MobileUploadModal Component
	 *
	 * Displays a modal with:
	 * - QR code for scanning with mobile device
	 * - Short URL for manual entry
	 * - Real-time upload status
	 */
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { PUBLIC_HOST } from '$env/static/public';
	import QRCode from 'qrcode';
	import Copy from '@lucide/svelte/icons/copy';
	import Check from '@lucide/svelte/icons/check';
	import Smartphone from '@lucide/svelte/icons/smartphone';
	import { toast } from 'svelte-sonner';

	// ============================================================================
	// PROPS
	// ============================================================================

	type Props = {
		/** The upload token */
		token: string;
		/** Callback when modal is closed */
		onClose: () => void;
	};

	let { token, onClose }: Props = $props();

	// ============================================================================
	// STATE
	// ============================================================================

	/** Generated QR code data URL */
	let qrCodeDataUrl = $state<string | null>(null);

	/** Whether the URL was copied */
	let isCopied = $state(false);

	// ============================================================================
	// DERIVED VALUES
	// ============================================================================

	/** The short URL for mobile upload */
	let uploadUrl = $derived(`${PUBLIC_HOST}/u/${token}`);

	// ============================================================================
	// INITIALIZATION
	// ============================================================================

	$effect(() => {
		generateQrCode();
	});

	async function generateQrCode() {
		try {
			qrCodeDataUrl = await QRCode.toDataURL(uploadUrl, {
				errorCorrectionLevel: 'H',
				scale: 6,
				margin: 2,
				color: {
					dark: '#000000',
					light: '#ffffff'
				}
			});
		} catch (error) {
			console.error('Failed to generate QR code', error);
		}
	}

	// ============================================================================
	// HANDLERS
	// ============================================================================

	async function copyUrl() {
		try {
			await navigator.clipboard.writeText(uploadUrl);
			isCopied = true;
			toast.success('Линкът е копиран');

			// Reset after 2 seconds
			setTimeout(() => {
				isCopied = false;
			}, 2000);
		} catch (error) {
			console.error('Failed to copy URL', error);
			toast.error('Неуспешно копиране');
		}
	}
</script>

<Dialog.Root open={true} onOpenChange={(open) => !open && onClose()}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Smartphone class="h-5 w-5" />
				Качване от телефон
			</Dialog.Title>
			<Dialog.Description>
				Сканирайте QR кода с телефона си или въведете адреса ръчно, за да качите файлове
				директно от камерата или галерията.
			</Dialog.Description>
		</Dialog.Header>

		<div class="flex flex-col items-center gap-6 py-4">
			<!-- QR Code -->
			{#if qrCodeDataUrl}
				<div class="rounded-lg bg-white p-4">
					<img src={qrCodeDataUrl} alt="QR код за качване" class="h-48 w-48" />
				</div>
			{:else}
				<div class="flex h-48 w-48 items-center justify-center rounded-lg bg-gray-100">
					<div class="text-sm text-muted-foreground">Генериране...</div>
				</div>
			{/if}

			<!-- URL with copy button -->
			<div class="flex w-full items-center gap-2">
				<div
					class="flex-1 truncate rounded-md border bg-gray-50 px-3 py-2 text-sm font-mono dark:bg-gray-800"
				>
					{uploadUrl}
				</div>
				<Button variant="outline" size="icon" onclick={copyUrl}>
					{#if isCopied}
						<Check class="h-4 w-4 text-green-500" />
					{:else}
						<Copy class="h-4 w-4" />
					{/if}
				</Button>
			</div>

			<!-- Instructions -->
			<div class="text-center text-sm text-muted-foreground">
				<p class="mb-2 font-medium">Инструкции:</p>
				<ol class="list-inside list-decimal text-left">
					<li>Сканирайте QR кода с телефона</li>
					<li>Изберете файл от камерата или галерията</li>
					<li>Качените файлове ще се появят автоматично тук</li>
				</ol>
			</div>
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={onClose}>Затвори</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
