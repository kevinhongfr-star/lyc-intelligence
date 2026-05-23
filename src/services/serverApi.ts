const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export async function sendEmail(params: { to: string | string[]; subject: string; html?: string; text?: string; mandateId?: string; contactId?: string }): Promise<{ success: boolean; emailId?: string; error?: string }> {
  try { const res = await fetch(`${API_BASE}/email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) }); return await res.json(); }
  catch (err: any) { return { success: false, error: err.message }; }
}

export async function serverScoreCandidates(params: { mandateId: string; contactIds?: string[]; jdDescription?: string; cvData?: Array<{ id: string; name: string; title: string; headline: string; skills: string[]; experience: string }> }): Promise<any> {
  try { const res = await fetch(`${API_BASE}/score`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) }); return await res.json(); }
  catch (err: any) { return { success: false, results: [], scored: 0, failed: 0, error: err.message }; }
}

export async function uploadFile(params: { file: File; bucket: string; mandateId?: string; contactId?: string; visibility?: string }): Promise<any> {
  try {
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve, reject) => { reader.onload = () => resolve((reader.result as string).split(',')[1]); reader.onerror = reject; reader.readAsDataURL(params.file); });
    const res = await fetch(`${API_BASE}/upload`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName: `${Date.now()}_${params.file.name}`, fileType: params.file.type, fileBase64: base64, bucket: params.bucket, mandateId: params.mandateId, contactId: params.contactId, visibility: params.visibility || 'internal' }) });
    return await res.json();
  } catch (err: any) { return { success: false, error: err.message }; }
}

export async function healthCheck(): Promise<Record<string, string>> {
  try { const res = await fetch(`${API_BASE}/health`); return await res.json(); } catch { return { status: 'error' }; }
}
