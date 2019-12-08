export function fixedPointString(value: bigint, scalar: bigint): string {
	const integerPart = value / 10n**scalar
	const fractionalPart = value % 10n**scalar
	if (fractionalPart === 0n) {
		return integerPart.toString(10)
	} else {
		return `${integerPart.toString(10)}.${fractionalPart.toString(10).padStart(Number(scalar), '0')}`
	}
}
export function attoString(value: bigint): string {
	return fixedPointString(value, 18n)
}
export function rontoString(value: bigint): string {
	return fixedPointString(value, 27n)
}
export function attorontoString(value: bigint): string {
	return fixedPointString(value, 45n)
}
