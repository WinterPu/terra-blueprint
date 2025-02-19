export function convertTypeNameToNodeName(input: string): string {
  if (!input) return input; // handle undefined
  return removeNamespace(input);
}

export function removeNamespace(input: string): string {
  if (!input) return input; // handle undefined
  // use regular expression to remove namespace
  return input.replace(/.*::/, '');
}

export function isNullOrEmpty(str: string | null | undefined): boolean {
  // including whitespace
  return str === null || str === undefined || str.trim() === '';
}
