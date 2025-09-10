export function autoTrim(html: string): string {
  // Split the HTML into lines, remove leading whitespace on each line,
  // then join the lines back together and collapse multiple consecutive newlines.
  const trimmedLines = html.split("\n").map((line) => line.replace(/^\s+/, ""))
  return trimmedLines.join("\n").replace(/\n{2,}/g, "\n").trim()
}
