export function toDatetimeLocal(iso: string) {
	const date = new Date(iso);

	const offset = date.getTimezoneOffset();
	const localDate = new Date(date.getTime() - offset * 60_000);

	return localDate.toISOString().slice(0, 16);
}