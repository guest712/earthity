/** Replace `{key}` placeholders in a template string. */
export function formatTemplate(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(values[key] ?? '')
  );
}
