// Normalize legacy math without altering code, existing delimiters or currency.
export function normalizeEducationalText(value) {
  const text = String(value || '').replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math}$`).replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `$$${math}$$`);
  const protectedParts = /(```[\s\S]*?```|`[^`\n]*`|\$\$[\s\S]*?\$\$|(?<!\\)\$[^$\n]+\$)/g;
  return text.split(protectedParts).map((part, index) => {
    if (index % 2) return part;
    // Balanced nested arguments cover roots/fractions from older generated cards.
    let group = String.raw`\{[^{}]*\}`;
    for (let i = 0; i < 4; i++) group = String.raw`\{(?:[^{}]|${group})*\}`;
    const command = new RegExp(String.raw`\\(?:sqrt(?:\[[^\]]+\])?\s*${group}|(?:dfrac|tfrac|frac)\s*${group}\s*${group}|(?:text|mathrm|mathbf)\s*${group}|times\b|cdot\b|div\b|leq?\b|geq?\b|neq\b|pi\b|infty\b|pm\b)`, 'g');
    return part.replace(command, math => `$${math}$`);
  }).join('');
}
