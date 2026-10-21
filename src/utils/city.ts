// City names are free text, so compare them ignoring case and surrounding spaces.
export function sameCity(a: string, b: string) {
    return a.trim().toLowerCase() === b.trim().toLowerCase();
}
