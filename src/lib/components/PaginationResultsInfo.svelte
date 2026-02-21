<script lang="ts">
	type Props = {
		page: number;
		limit: number;
		totalItems: number;
		totalPages: number;
	};

	let { page, limit, totalItems, totalPages }: Props = $props();
</script>

<div class="flex justify-end gap-6 text-sm">
	<span>
		<!-- Display current results count. Example: 
		     Page 1, Limit 40 -> 1 ... 40
		     Page 2, Limit 40 -> 41 ... 80 -->
		Резултати:
		{(page - 1) * limit + 1}
		-
		{Math.min(page * limit, totalItems)}
		/ {totalItems}
	</span>

	<span>
		Страница: {page} / {totalPages}
	</span>
</div>
