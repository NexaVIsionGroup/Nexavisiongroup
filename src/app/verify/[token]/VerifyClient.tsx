"use client";
import { useEffect, useState } from 'react';
import { ShieldCheck, Upload, FileCheck2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf'];
type Key = 'gov_id' | 'selfie' | 'supporting';
const SECTIONS: { key: Key; label: string; hint: string; required: boolean; multiple: boolean }[] = [
  { key: 'gov_id', label: 'Government-issued ID', hint: "Driver's license or passport — clear, all corners visible.", required: true, multiple: false },
  { key: 'selfie', label: 'Selfie photo', hint: 'A clear photo of your face in good lighting.', required: true, multiple: false },
  { key: 'supporting', label: 'Supporting documents', hint: 'Any additional documents requested (optional).', required: false, multiple: true },
];

export default function VerifyClient({ token }: { token: string }) {
  const [state, setState] = useState<'loading'|'ready'|'expired'|'invalid'|'done'|'submitted'>('loading');
  const [firstName, setFirstName] = useState('');
  const [files, setFiles] = useState<Record<Key, File[]>>({ gov_id: [], selfie: [], supporting: [] });
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/verify/' + token).then(async res => {
      if (res.status === 410) return setState('expired');
      if (!res.ok) return setState('invalid');
      const d = await res.json();
      setFirstName(d.firstName || '');
      setState(d.status === 'pending' ? 'ready' : 'submitted');
    }).catch(() => setState('invalid'));
  }, [token]);

  function pick(key: Key, list: FileList | null) {
    setError('');
    if (!list) return;
    const arr = Array.from(list);
    for (const f of arr) {
      if (f.size > MAX_BYTES) return setError(f.name + ' is over 10MB.');
      if (!ALLOWED.includes(f.type)) return setError(f.name + ': only images or PDF allowed.');
    }
    setFiles(p => ({ ...p, [key]: arr }));
  }

  async function submit() {
    setError('');
    if (files.gov_id.length === 0 || files.selfie.length === 0)
      return setError('Government ID and selfie are both required.');
    setBusy(true); setProgress(8);
    const fd = new FormData();
    SECTIONS.forEach(s => files[s.key].forEach(f => fd.append(s.key, f)));
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/verify/' + token);
      xhr.upload.onprogress = e => { if (e.lengthComputable) setProgress(8 + Math.round((e.loaded / e.total) * 87)); };
      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300)
          ? resolve()
          : reject(new Error((JSON.parse(xhr.responseText || '{}').error) || 'Upload failed'));
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(fd);
      });
      setProgress(100); setState('done');
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally { setBusy(false); }
  }

  const wrap: React.CSSProperties = { minHeight:'100vh', background:'#0A1428', color:'#F0F4F8', fontFamily:'system-ui, sans-serif', display:'flex', alignItems:'center', justifyContent:'center', padding:24 };
  const Shell = (p: { children: React.ReactNode }) => <div style={wrap}><div style={{ maxWidth:560, width:'100%' }}>{p.children}</div></div>;
  const Msg = (p: { title: string; body: string }) => (
    <div style={{ textAlign:'center' }}>
      <h1 style={{ fontSize:20, margin:'0 0 8px' }}>{p.title}</h1>
      <p style={{ color:'#8896A6', lineHeight:1.6 }}>{p.body}</p>
    </div>
  );

  if (state === 'loading') return <Shell><p style={{ textAlign:'center', color:'#5A6A7E' }}><Loader2 /> Loading…</p></Shell>;
  if (state === 'invalid') return <Shell><Msg title="Link not valid" body="This verification link is invalid. Please contact us for a new one." /></Shell>;
  if (state === 'expired') return <Shell><Msg title="Link expired" body="This verification link has expired. Please request a new one." /></Shell>;
  if (state === 'submitted') return <Shell><Msg title="Already received" body="We've already received your documents — nothing more to do." /></Shell>;
  if (state === 'done') return <Shell><Msg title="Documents received" body="Thank you. Your documents were submitted securely and are now under review." /></Shell>;

  return (
    <Shell>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
        <ShieldCheck color="#00E5CC" /><h1 style={{ fontSize:22, margin:0 }}>Identity verification</h1>
      </div>
      <p style={{ color:'#8896A6', marginTop:0, lineHeight:1.6 }}>
        {firstName ? 'Hi ' + firstName + '. ' : ''}Please upload the documents below so we can verify your identity. Files are sent securely and seen only by our review team.
      </p>
      {SECTIONS.map(s => (
        <div key={s.key} style={{ border:'1px solid #1C2D4A', borderRadius:12, padding:16, marginTop:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <strong>{s.label}{s.required && <span style={{ color:'#00E5CC' }}> *</span>}</strong>
            {files[s.key].length > 0 && <span style={{ color:'#22C55E', fontSize:13 }}>{files[s.key].length} selected</span>}
          </div>
          <p style={{ color:'#5A6A7E', fontSize:13, margin:'6px 0 10px' }}>{s.hint}</p>
          <label style={{ display:'inline-flex', alignItems:'center', gap:8, cursor:'pointer', background:'#13233F', border:'1px dashed #2A3F63', borderRadius:8, padding:'10px 14px', fontSize:14 }}>
            <Upload size={16} /> Choose file{s.multiple ? 's' : ''}
            <input type="file" accept={ALLOWED.join(',')} multiple={s.multiple} style={{ display:'none' }} onChange={e => pick(s.key, e.target.files)} />
          </label>
          {files[s.key].map(f => <div key={f.name} style={{ fontSize:13, color:'#8896A6', marginTop:6 }}>• {f.name} ({(f.size/1048576).toFixed(1)}MB)</div>)}
        </div>
      ))}
      {error && <p style={{ color:'#EF4444', marginTop:14, display:'flex', gap:6, alignItems:'center' }}><AlertCircle size={16} />{error}</p>}
      {busy && <div style={{ height:6, background:'#13233F', borderRadius:4, marginTop:16, overflow:'hidden' }}><div style={{ height:'100%', width:progress + '%', background:'#00E5CC', transition:'width .2s' }} /></div>}
      <button onClick={submit} disabled={busy} style={{ marginTop:18, width:'100%', padding:'12px 16px', borderRadius:10, border:'none', background:'#00E5CC', color:'#04121F', fontWeight:700, fontSize:15, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1 }}>
        {busy ? 'Uploading…' : 'Submit documents'}
      </button>
      <p style={{ color:'#5A6A7E', fontSize:12, marginTop:14, textAlign:'center' }}><FileCheck2 size={12} /> Encrypted in transit. Only our review team can access these files.</p>
    </Shell>
  );
}