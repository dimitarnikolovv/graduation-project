<script lang="ts">
	import type { SessionValidationResult } from '$lib/server/auth';
	import type { Lesson } from '$lib/server/db/schema/lessons';
	import CommentsBoundary from './_comments-boundary.svelte';
	import CommentsSection from './_comments_section.svelte';

	type Props = {
		user: SessionValidationResult['user'] | null;
		lessonId: Lesson['id'];
	};

	const { lessonId, user }: Props = $props();
</script>

<CommentsBoundary>
	<CommentsSection {lessonId} {user} />
</CommentsBoundary>
