export function generateRandomPassword(length: number = 12): string {
	const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const lowercase = 'abcdefghijklmnopqrstuvwxyz';
	const digits = '0123456789';
	const symbols = '!@#$%+&*?()<>_-.()[]';
	const all = uppercase + lowercase + digits + symbols;

	if (length < 4) throw new Error('Password length must be at least 4');

	// Ensure the password includes at least one character from each group
	const getRandom = (chars: string) => chars[Math.floor(Math.random() * chars.length)];

	const password = [
		getRandom(uppercase),
		getRandom(lowercase),
		getRandom(digits),
		getRandom(symbols)
	];

	// Fill the rest with random characters
	for (let i = 4; i < length; i++) {
		password.push(getRandom(all));
	}

	// Shuffle the password
	return password.sort(() => 0.5 - Math.random()).join('');
}
