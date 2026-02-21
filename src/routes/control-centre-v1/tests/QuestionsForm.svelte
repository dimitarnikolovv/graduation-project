<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import Check from '@lucide/svelte/icons/check';
	import CirclePlus from '@lucide/svelte/icons/circle-plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Form from '$lib/components/ui/form';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Input } from '$lib/components/ui/input';
	import { displayQuestionType, QuestionTypeEnum } from '$lib/types/enums';
	import type { SuperForm, SuperValidated } from 'sveltekit-superforms';
	import type { CreateTestSchema, UpdateTestSchema } from './schema';
	import { cn } from '$lib/utils';
	import { TipTap } from '$lib/components/tiptap';

	type Props = {
		form: SuperForm<CreateTestSchema | UpdateTestSchema>;
		formData: SuperValidated<CreateTestSchema | UpdateTestSchema>['data'];
		delayed: boolean;
		allowQuestionRemoval?: boolean;
	};

	let { form, formData = $bindable(), delayed, allowQuestionRemoval = false }: Props = $props();

	function setQuestionConfigByType(questionIndex: number, type: QuestionTypeEnum) {
		const question = formData.questions[questionIndex];
		if (!question) return;

		const oldType = question.type;

		question.type = type;

		// Reset config based on type
		if (type === QuestionTypeEnum.SingleChoice || type === QuestionTypeEnum.MultipleChoice) {
			// If changing from single to multiple or vice versa,
			// keep existing options if they exist, reset only correct answers
			if (
				(oldType === QuestionTypeEnum.SingleChoice ||
					oldType === QuestionTypeEnum.MultipleChoice) &&
				'options' in question.config
			) {
				question.config = {
					options: question.config.options || [{ id: 0, text: '' }],
					// shuffle: false,
					correct: []
				};
			} else {
				// If changing from a different type, reset options and correct answers
				question.config = {
					options: [{ id: 0, text: '' }],
					// shuffle: false,
					correct: []
				};
			}
		} else if (type === QuestionTypeEnum.Text) {
			question.config = {
				sampleAnswer: '',
				maxLength: 255
			};
		} else if (type === QuestionTypeEnum.FileUpload) {
			question.config = {
				allowedTypes: ['image/*'],
				maxFileSizeMB: 10,
				maxFiles: 1,
				instructions: ''
			};
		}

		formData.questions[questionIndex] = question;
	}

	// Available file types for file upload questions
	const FILE_TYPE_OPTIONS = [
		{ value: 'image/*', label: 'Изображения (всички)' },
		{ value: 'image/jpeg', label: 'JPEG изображения' },
		{ value: 'image/png', label: 'PNG изображения' },
		{ value: 'application/pdf', label: 'PDF документи' },
		{ value: 'application/msword', label: 'Word документи (.doc)' },
		{
			value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			label: 'Word документи (.docx)'
		},
		{ value: 'text/plain', label: 'Текстови файлове (.txt)' }
	];

	function toggleFileType(questionIndex: number, fileType: string) {
		const question = formData.questions[questionIndex];
		if (!question.config || !('allowedTypes' in question.config)) return;

		const currentTypes = question.config.allowedTypes;
		if (currentTypes.includes(fileType)) {
			// Don't allow removing the last type
			if (currentTypes.length > 1) {
				question.config.allowedTypes = currentTypes.filter((t) => t !== fileType);
			}
		} else {
			question.config.allowedTypes = [...currentTypes, fileType];
		}

		formData.questions[questionIndex] = question;
	}

	function addQuestion() {
		formData.questions = [
			...formData.questions,
			{
				order: formData.questions.length + 1,
				stem: '',
				type: QuestionTypeEnum.SingleChoice,
				points: 1,
				config: {
					options: [{ id: 0, text: '' }],
					// shuffle: false,
					correct: []
				}
			}
		];
	}

	function removeQuestion(questionIndex: number) {
		if (questionIndex < 0 || questionIndex >= formData.questions.length) return;

		if (!allowQuestionRemoval) return;

		formData.questions = formData.questions.slice(0, questionIndex).concat(
			formData.questions
				.slice(questionIndex + 1)
				.map((q, idx) => ({ ...q, order: questionIndex + 1 + idx })) // Reorder remaining questions
		);
	}

	function addAnswer(questionIndex: number) {
		const question = formData.questions[questionIndex];
		// Find the question by its index
		if (!question.config || !('options' in question.config)) return;

		const newOptionId =
			question.config.options.length > 0
				? Math.max(...question.config.options.map((opt) => opt.id)) + 1
				: 0;

		question.config.options = [...question.config.options, { id: newOptionId, text: '' }];

		formData.questions[questionIndex] = question;
	}

	function removeAnswer(questionIndex: number, optionId: number) {
		const question = formData.questions[questionIndex];
		// Find the question by its index
		if (!question.config || !('options' in question.config)) return;

		question.config.options = question.config.options.filter((opt) => opt.id !== optionId);

		// Also remove from correct answers if present
		if (question.config.correct.includes(optionId)) {
			question.config.correct = question.config.correct.filter((id) => id !== optionId);
		}

		formData.questions[questionIndex] = question;
	}

	function toggleCorrectAnswer(questionIndex: number, optionId: number) {
		const question = formData.questions[questionIndex];
		if (!question.config || !('correct' in question.config)) return;

		if (question.type === QuestionTypeEnum.SingleChoice) {
			// For single choice, set the correct answer to the selected option
			question.config.correct = [optionId];
		} else if (question.type === QuestionTypeEnum.MultipleChoice) {
			// For multiple choice, toggle the presence of the optionId in correct answers
			if (question.config.correct.includes(optionId)) {
				question.config.correct = question.config.correct.filter((id) => id !== optionId);
			} else {
				question.config.correct = [...question.config.correct, optionId];
			}
		}

		formData.questions[questionIndex] = question;
	}
</script>

<div>
	<h3 class="text-lg font-medium">Въпроси</h3>

	<div class="grid items-end gap-3 sm:gap-6">
		{#each formData.questions as question, i (i)}
			{@const isSingleOrMultipleChoice =
				question.type === QuestionTypeEnum.SingleChoice ||
				question.type === QuestionTypeEnum.MultipleChoice}
			<div>
				<div
					class="bg-accent ignore-main-margin sticky top-11 z-10 my-2 border-y border-dashed py-1.5"
				>
					<div class="flex items-center justify-between">
						<h3 class="flex items-center gap-2 text-lg font-medium">
							<ArrowDown class="size-4" /> Въпрос {i + 1}
						</h3>

						{#if allowQuestionRemoval}
							<Button
								variant="destructive"
								size="icon"
								disabled={delayed}
								onclick={() => {
									removeQuestion(i);
								}}
							>
								<Trash2 class="h-4 w-4" />
							</Button>
						{/if}
					</div>
				</div>
				<Form.Field {form} name="questions[{i}].stem">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>
								Въпрос <span class="text-destructive text-sm">*</span>
							</Form.Label>
							<!-- 49px is the height of the editors tool bar, 2px is the border -->
							<div class="min-h-[calc(6rem+49px+2px)]">
								<TipTap
									{...props}
									minimal={true}
									disabled={delayed}
									required
									bind:value={formData.questions[i].stem}
									class="min-h-24! [&>.tiptap]:min-h-24! [&>.tiptap]:max-w-none!"
								></TipTap>
							</div>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<div class="grid grid-cols-2 gap-2 sm:gap-6">
					<Form.Field {form} name="questions[{i}].order">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>
									Пореден ред <span class="text-destructive text-sm">*</span>
								</Form.Label>
								<Input
									{...props}
									disabled={delayed}
									bind:value={formData.questions[i].order}
									type="number"
									min="0"
									step="1"
									required
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field {form} name="questions[{i}].points">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>
									Брой точки <span class="text-destructive text-sm">*</span>
								</Form.Label>
								<Input
									{...props}
									disabled={delayed}
									bind:value={formData.questions[i].points}
									type="number"
									min="0"
									step="0.01"
									required
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>
				</div>

				<Form.Field {form} name="questions[{i}].type">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>
								Тип на въпроса
								<span class="text-destructive text-sm">*</span>
							</Form.Label>
							<Select.Root
								type="single"
								disabled={delayed}
								{...props}
								allowDeselect={false}
								onValueChange={(v) => setQuestionConfigByType(i, v as QuestionTypeEnum)}
								bind:value={formData.questions[i].type}
							>
								<Select.Trigger class="w-full" disabled={delayed}>
									{displayQuestionType(question.type)}
								</Select.Trigger>
								<Select.Content>
									{#each Object.values(QuestionTypeEnum) as qt}
										<Select.Item value={qt} label={displayQuestionType(qt)} />
									{/each}
								</Select.Content>
							</Select.Root>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Card.Root class="bg-background mt-4 pb-0">
					<Card.Header class="px-2 sm:px-6">
						<Card.Title>Отговори</Card.Title>
					</Card.Header>
					<Card.Content
						class={cn('grid items-end gap-3 px-2 sm:px-6', !isSingleOrMultipleChoice && 'pb-4')}
					>
						{#if isSingleOrMultipleChoice && 'options' in question.config}
							{#each question.config.options as option, j (j)}
								<Form.Field {form} class="flex-1" name="questions[{i}].config.options[{j}].text">
									<Form.Control>
										{#snippet children({ props })}
											<!-- Sanity check to keep ts happy -->
											{#if 'options' in formData.questions[i].config && 'options' in question.config}
												<div class="flex items-center gap-2">
													<Button
														variant="outline"
														size="icon"
														class={cn(
															'',
															question.config.correct.includes(option.id) &&
																'border-green-600! text-green-600 hover:text-green-600'
														)}
														disabled={delayed}
														onclick={() => {
															toggleCorrectAnswer(i, option.id);
														}}
														title={question.config.correct.includes(option.id)
															? 'Маркиран като верен отговор'
															: 'Маркирай като верен отговор'}
													>
														<Check class="h-4 w-4" />
													</Button>
													<Form.Label class="mr-auto">
														Отговор {j + 1} <span class="text-destructive text-sm">*</span>
													</Form.Label>

													<Button
														variant="destructive"
														size="icon"
														disabled={delayed}
														onclick={() => {
															removeAnswer(i, option.id);
														}}
													>
														<Trash2 class="h-4 w-4" />
													</Button>
												</div>

												<!-- 49px is the height of the editors tool bar, 2px is the border -->
												<div class="min-h-[calc(3.5rem+49px+2px)]">
													<TipTap
														bind:value={formData.questions[i].config.options[j].text}
														{...props}
														minimal={true}
														disabled={delayed}
														required
														class="h-14 min-h-12! [&>.tiptap]:min-h-14! [&>.tiptap]:max-w-none!"
													></TipTap>
												</div>
											{/if}
										{/snippet}
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>
							{/each}
						{:else if question.type === QuestionTypeEnum.Text && 'sampleAnswer' in question.config}
							<Form.Field {form} name="questions[{i}].config.maxLength">
								<Form.Control>
									{#snippet children({ props })}
										<!-- Sanity check to keep ts happy -->
										{#if 'maxLength' in formData.questions[i].config}
											<Form.Label>
												Максимална дължина на отговора
												<span class="text-destructive text-sm">*</span>
											</Form.Label>
											<Input
												{...props}
												disabled={delayed}
												bind:value={formData.questions[i].config.maxLength}
												type="number"
												min="0"
												step="1"
												required
											/>
										{/if}
									{/snippet}
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>

							<Form.Field {form} name="questions[{i}].config.sampleAnswer">
								<Form.Control>
									{#snippet children({ props })}
										<!-- Sanity check to keep ts happy -->
										{#if 'sampleAnswer' in formData.questions[i].config}
											<Form.Label>Примерен отговор</Form.Label>
											<Textarea
												{...props}
												disabled={delayed}
												bind:value={formData.questions[i].config.sampleAnswer}
												placeholder="..."
											/>
										{/if}
									{/snippet}
								</Form.Control>
								<Form.FieldErrors />
							</Form.Field>
						{:else if question.type === QuestionTypeEnum.FileUpload && 'allowedTypes' in question.config}
							<!-- File Upload Configuration -->
							<div class="space-y-4">
								<!-- Allowed File Types (custom control, not a standard form field) -->
								<div>
									<div class="text-sm font-medium leading-none">
										Позволени типове файлове
										<span class="text-destructive text-sm">*</span>
									</div>
									<div class="mt-2 flex flex-wrap gap-2">
										{#each FILE_TYPE_OPTIONS as fileType}
											{@const isSelected =
												'allowedTypes' in formData.questions[i].config &&
												formData.questions[i].config.allowedTypes.includes(fileType.value)}
											<Button
												type="button"
												variant={isSelected ? 'default' : 'outline'}
												size="sm"
												disabled={delayed}
												onclick={() => toggleFileType(i, fileType.value)}
												class={cn('text-xs')}
											>
												{fileType.label}
											</Button>
										{/each}
									</div>
									<p class="text-muted-foreground mt-1 text-xs">
										Изберете един или повече типове файлове
									</p>
								</div>

								<div class="grid grid-cols-2 gap-4">
									<!-- Max File Size -->
									<Form.Field {form} name="questions[{i}].config.maxFileSizeMB">
										<Form.Control>
											{#snippet children({ props })}
												{#if 'maxFileSizeMB' in formData.questions[i].config}
													<Form.Label>
														Макс. размер (MB)
														<span class="text-destructive text-sm">*</span>
													</Form.Label>
													<Input
														{...props}
														disabled={delayed}
														bind:value={formData.questions[i].config.maxFileSizeMB}
														type="number"
														min="0.1"
														max="100"
														step="0.1"
														required
													/>
												{/if}
											{/snippet}
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>

									<!-- Max Files -->
									<Form.Field {form} name="questions[{i}].config.maxFiles">
										<Form.Control>
											{#snippet children({ props })}
												{#if 'maxFiles' in formData.questions[i].config}
													<Form.Label>
														Макс. брой файлове
														<span class="text-destructive text-sm">*</span>
													</Form.Label>
													<Input
														{...props}
														disabled={delayed}
														bind:value={formData.questions[i].config.maxFiles}
														type="number"
														min="1"
														max="10"
														step="1"
														required
													/>
												{/if}
											{/snippet}
										</Form.Control>
										<Form.FieldErrors />
									</Form.Field>
								</div>

								<!-- Instructions -->
								<Form.Field {form} name="questions[{i}].config.instructions">
									<Form.Control>
										{#snippet children({ props })}
											{#if 'instructions' in formData.questions[i].config}
												<Form.Label>Инструкции за ученика (незадължително)</Form.Label>
												<Textarea
													{...props}
													disabled={delayed}
													bind:value={formData.questions[i].config.instructions}
													placeholder="Напр. 'Качете снимка на вашата работа' или 'Прикачете PDF файл с решението'"
													class="min-h-20"
												/>
											{/if}
										{/snippet}
									</Form.Control>
									<Form.FieldErrors />
								</Form.Field>
							</div>
						{:else}
							<p class="text-destructive text-sm">Неподдържан тип въпрос.</p>
						{/if}
					</Card.Content>
					{#if isSingleOrMultipleChoice}
						<Card.Footer class="flex items-center justify-center border-t  py-2!">
							<Button variant="ghost" size="sm" onclick={() => addAnswer(i)} disabled={delayed}>
								<CirclePlus class="h-3.5 w-3.5" />
								Добави отговор
							</Button>
						</Card.Footer>
					{/if}
				</Card.Root>
			</div>
		{/each}
	</div>

	<Button class="mt-4 w-full" onclick={addQuestion} disabled={delayed}>
		<CirclePlus class="h-3.5 w-3.5" />
		Добави въпрос
	</Button>
</div>
