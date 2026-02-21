import type { FetchExpandedTestResult } from '$lib/server/db-querying/tests';

export type QuestionOption = {
	id: number;
	text: string;
};

export type ChoiceConfig = {
	options: QuestionOption[];
	correct: number[]; // array of option IDs
	// shuffle: boolean;
};

export type TextConfig = {
	maxLength: number;
	sampleAnswer: string;
};

/**
 * Configuration for file upload questions.
 */
export type FileUploadConfig = {
	/** Allowed MIME types, e.g., ['image/*', 'application/pdf'] */
	allowedTypes: string[];
	/** Maximum file size in MB */
	maxFileSizeMB: number;
	/** Maximum number of files allowed */
	maxFiles: number;
	/** Optional instructions for the student */
	instructions?: string;
};

export type QuestionConfig = ChoiceConfig | TextConfig | FileUploadConfig;

export type ChoiceAnswerResponse = {
	selected: string[]; // array of option IDs
};

export type TextAnswerResponse = {
	text: string;
};

/**
 * Response type for file upload answers.
 * Contains array of file IDs from the files table.
 */
export type FileUploadAnswerResponse = {
	fileIds: string[];
};

export type AnswerResponse = ChoiceAnswerResponse | TextAnswerResponse | FileUploadAnswerResponse;

// Type guards for question configs
export function isChoiceConfig(config: QuestionConfig): config is ChoiceConfig {
	return 'options' in config && 'correct' in config;
}

export function isTextConfig(config: QuestionConfig): config is TextConfig {
	return 'maxLength' in config && 'sampleAnswer' in config;
}

export function isFileUploadConfig(config: QuestionConfig): config is FileUploadConfig {
	return 'allowedTypes' in config && 'maxFileSizeMB' in config && 'maxFiles' in config;
}

// Type guards for answer responses
export function isChoiceAnswerResponse(response: AnswerResponse): response is ChoiceAnswerResponse {
	return 'selected' in response;
}

export function isTextAnswerResponse(response: AnswerResponse): response is TextAnswerResponse {
	return 'text' in response;
}

export function isFileUploadAnswerResponse(
	response: AnswerResponse
): response is FileUploadAnswerResponse {
	return 'fileIds' in response;
}

export type ExpandedTest = Exclude<FetchExpandedTestResult, undefined>;
