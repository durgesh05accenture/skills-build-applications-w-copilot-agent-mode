import { useState, type FormEvent } from 'react';
import { postJson } from '../api/client.js';

type Result = { tailoredResume: string; matchedKeywords: string[]; missingKeywords: string[] };

export default function ResumeCustomizer() {
  const [resume, setResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setError('');
    setLoading(true);
    try {
      setResult(await postJson<Result>('/api/resume/customize', { resume, jobDescription }));
    } catch {
      setError('Unable to customize your resume. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return <section>
    <h2>Resume customizer</h2>
    <p>Paste your resume and the job description. Matching lines will be highlighted without adding new claims. Review all suggestions before using them.</p>
    <form onSubmit={submit}>
      <div className="mb-3">
        <label className="form-label" htmlFor="resume">Resume</label>
        <textarea className="form-control" id="resume" rows={10} required maxLength={20000} value={resume} disabled={loading} onChange={(event) => { setResume(event.target.value); setResult(null); }} />
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="job-description">Job description</label>
        <textarea className="form-control" id="job-description" rows={10} required maxLength={20000} value={jobDescription} disabled={loading} onChange={(event) => { setJobDescription(event.target.value); setResult(null); }} />
      </div>
      <button className="btn btn-primary" type="submit" disabled={loading}>Customize resume</button>
    </form>
    {loading && <p role="status">Customizing resume...</p>}
    {error && <p role="alert">{error}</p>}
    {result && <div className="mt-4">
      <h3>Customized resume</h3>
      <p>Copy and edit this draft as needed.</p>
      <pre className="border rounded p-3" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{result.tailoredResume}</pre>
      <h3>Matching terms</h3>
      <p>{result.matchedKeywords.length ? result.matchedKeywords.join(', ') : 'No matching terms found.'}</p>
      <h3>Terms to review</h3>
      <p>{result.missingKeywords.length ? result.missingKeywords.join(', ') : 'No unmatched terms found.'}</p>
      <p>Only add a term if it accurately reflects your experience. Keyword matches do not guarantee a fit.</p>
    </div>}
  </section>;
}
