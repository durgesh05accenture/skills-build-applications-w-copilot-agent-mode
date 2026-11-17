const stopWords = new Set(`a an and are as at be been but by can for from have in is it of on or our that the their this to we will with you your
  about ability all also both candidate company experience including looking must need new opportunity or other required requirements role skills strong team work working years`.split(/\s+/));

function keywords(text: string): string[] {
  return [...new Set((text.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}+#.]*/gu) ?? [])
    .map((word) => word.replace(/\.+$/, ''))
    .filter((word) => word.length > 1 && !stopWords.has(word) && !/^\d+$/.test(word)))];
}

export function customizeResume(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Provide a resume and job description.'), { status: 400 });
  }
  const { resume, jobDescription } = input as Record<string, unknown>;
  if (typeof resume !== 'string' || typeof jobDescription !== 'string' ||
      !resume.trim() || !jobDescription.trim() || resume.length > 20000 || jobDescription.length > 20000) {
    throw Object.assign(new Error('Resume and job description are required and must each be at most 20,000 characters.'), { status: 400 });
  }

  const jobKeywords = keywords(jobDescription);
  const resumeKeywords = new Set(keywords(resume));
  const matchedKeywords = jobKeywords.filter((word) => resumeKeywords.has(word));
  const missingKeywords = jobKeywords.filter((word) => !resumeKeywords.has(word));
  const matched = new Set(matchedKeywords);
  const highlights = resume.split(/\r?\n/)
    .map((line, index) => ({ line: line.trim(), index, score: keywords(line).filter((word) => matched.has(word)).length }))
    .filter(({ line, score }) => line && score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 5)
    .map(({ line }) => line);

  return {
    tailoredResume: highlights.length
      ? `Relevant highlights\n${highlights.join('\n')}\n\nOriginal resume\n${resume.trim()}`
      : resume.trim(),
    matchedKeywords,
    missingKeywords,
  };
}
