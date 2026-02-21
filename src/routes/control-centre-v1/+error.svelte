<script lang="ts">
	import { page } from '$app/state';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
</script>

<div class="s">
	<div class="tts">
		<h1 class="large">{page?.status}</h1>

		<h1 class="medium">{page?.error?.message}</h1>

		<button onclick={() => window.history.back()}>
			<ArrowLeft></ArrowLeft>
			Назад
		</button>
	</div>
</div>

<style>
	.s {
		display: grid;
		place-items: center;
		justify-content: center;
		width: 100%;
		height: 90dvh;

		font-family: 'Courier New', Courier, monospace;
	}

	.tts {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
	}

	.large,
	.medium {
		line-height: 1.2;
		text-align: center;
	}

	.large {
		font-size: 3rem;
	}

	.medium {
		font-size: 2rem;
	}

	button {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background-color: #f26849;
		color: white;
		border-radius: 0.5rem;
		padding: 0.6rem 1.2rem;
		font-size: 1rem;
		cursor: pointer;
		border: none;
	}
</style>
