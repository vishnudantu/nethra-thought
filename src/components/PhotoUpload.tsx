import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Trash2, X, Loader2, CheckCircle2, AlertCircle, Link } from 'lucide-react';
import { useAuth } from '../lib/auth';

interface Props {
  politicianId: string | number;
  currentPhotoUrl?: string | null;
  politicianName: string;
  size?: 'sm' | 'md' | 'lg';
  onPhotoUpdated?: (url: string | null) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

export default function PhotoUpload({
  politicianId, currentPhotoUrl, politicianName, size = 'md', onPhotoUpdated
}: Props) {
  const { session } = useAuth();
  const token = session?.access_token || localStorage.getItem('nethra_token') || '';
  const [photo, setPhoto] = useState<string | null>(currentPhotoUrl || null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = politicianName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const dim = size === 'sm' ? 48 : size === 'lg' ? 120 : 80;
  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 20 : 16;

  function showStatus(type: 'success' | 'error', msg: string) {
    setStatus({ type, msg });
    setTimeout(() => setStatus(null), 4000);
  }

  async function uploadBase64(base64: string, mimeType: string) {
    setUploading(true);
    try {
      const r = await fetch(`/api/founder/politicians/${politicianId}/photo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: base64, mime_type: mimeType }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Upload failed');
      setPhoto(d.photo_url);
      setPreview(null);
      onPhotoUpdated?.(d.photo_url);
      showStatus('success', 'Photo updated');
    } catch (e: any) {
      showStatus('error', e.message);
    }
    setUploading(false);
    setShowOverlay(false);
  }

  async function savePhotoUrl(url: string) {
    setUploading(true);
    try {
      const r = await fetch(`/api/founder/politicians/${politicianId}/photo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: null, photo_url_direct: url }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setPhoto(url);
      onPhotoUpdated?.(url);
      showStatus('success', 'Photo updated');
      setShowUrlInput(false);
      setUrlInput('');
    } catch (e: any) {
      // Fallback: save URL directly
      const r2 = await fetch(`/api/founder/politicians/${politicianId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_url: url }),
      });
      if (r2.ok) {
        setPhoto(url);
        onPhotoUpdated?.(url);
        showStatus('success', 'Photo URL saved');
        setShowUrlInput(false);
        setUrlInput('');
      } else {
        showStatus('error', e.message);
      }
    }
    setUploading(false);
    setShowOverlay(false);
  }

  function processFile(file: File) {
    if (!ACCEPTED.includes(file.type)) {
      showStatus('error', 'Only JPG, PNG, WebP accepted');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showStatus('error', 'File too large. Max 10MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  async function confirmUpload() {
    if (!preview) return;
    const base64 = preview.replace(/^data:image\/\w+;base64,/, '');
    const mimeMatch = preview.match(/^data:(image\/\w+);base64,/);
    const mime = mimeMatch?.[1] || 'image/jpeg';
    await uploadBase64(base64, mime);
  }

  async function deletePhoto() {
    setUploading(true);
    try {
      await fetch(`/api/founder/politicians/${politicianId}/photo`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setPhoto(null);
      setPreview(null);
      onPhotoUpdated?.(null);
      showStatus('success', 'Photo removed');
    } catch (_) { showStatus('error', 'Could not remove photo'); }
    setUploading(false);
    setShowOverlay(false);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Avatar / Photo */}
      <div
        onMouseEnter={() => setShowOverlay(true)}
        onMouseLeave={() => { if (!preview && !showUrlInput) setShowOverlay(false); }}
        style={{ width: dim, height: dim, borderRadius: size === 'sm' ? 10 : 14, overflow: 'hidden', position: 'relative', cursor: 'pointer', flexShrink: 0 }}
      >
        {photo ? (
          <img
            src={photo}
            alt={politicianName}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
            onError={() => setPhoto(null)}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: dim * 0.3, fontWeight: 800, color: '#8899bb', fontFamily: 'Space Grotesk' }}>
            {initials}
          </div>
        )}

        {/* Hover overlay */}
        <AnimatePresence>
          {(showOverlay || uploading) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => !uploading && fileInputRef.current?.click()}
              style={{ position: 'absolute', inset: 0, background: 'rgba(6,11,24,0.75)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}
            >
              {uploading ? (
                <Loader2 size={iconSize} style={{ color: '#00d4aa', animation: 'spin 1s linear infinite' }} />
              ) : (
                <>
                  <Camera size={iconSize} style={{ color: '#f0f4ff' }} />
                  {size !== 'sm' && <span style={{ fontSize: 9, color: '#d0d8ee', fontWeight: 600 }}>Change</span>}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value = ''; }}
      />

      {/* Status badge */}
      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6 }}
            style={{ position: 'absolute', bottom: -36, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 700, background: status.type === 'success' ? 'rgba(0,200,100,0.15)' : 'rgba(255,85,85,0.15)', border: `1px solid ${status.type === 'success' ? 'rgba(0,200,100,0.3)' : 'rgba(255,85,85,0.3)'}`, color: status.type === 'success' ? '#00c864' : '#ff7777', display: 'flex', alignItems: 'center', gap: 4, zIndex: 10 }}
          >
            {status.type === 'success' ? <CheckCircle2 size={9} /> : <AlertCircle size={9} />}
            {status.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview + confirm modal (shows when file selected) */}
      <AnimatePresence>
        {preview && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,11,24,0.85)' }}
            onClick={e => { if (e.target === e.currentTarget) { setPreview(null); setShowOverlay(false); } }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              style={{ background: '#0d1628', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 24, width: 340, textAlign: 'center' }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>Confirm Photo</div>
              <div style={{ fontSize: 11, color: '#8899bb', marginBottom: 18 }}>{politicianName}</div>

              {/* Preview */}
              <div style={{ width: 160, height: 160, borderRadius: 16, overflow: 'hidden', margin: '0 auto 20px', border: '2px solid rgba(0,212,170,0.3)' }}>
                <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
              </div>

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{ border: `2px dashed ${dragging ? 'rgba(0,212,170,0.6)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, padding: '10px 16px', marginBottom: 16, cursor: 'pointer', fontSize: 11, color: '#8899bb', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', transition: 'border-color 0.2s' }}
              >
                <Upload size={12} /> Drop a different image or click to browse
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setPreview(null); setShowOverlay(false); }}
                  style={{ flex: 1, padding: '9px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#8899bb', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={confirmUpload} disabled={uploading}
                  style={{ flex: 2, padding: '9px', borderRadius: 10, background: 'linear-gradient(135deg,#00d4aa,#1e88e5)', border: 'none', color: '#060b18', fontSize: 12, fontWeight: 800, cursor: uploading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {uploading ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />Uploading...</> : <><Upload size={12} />Use this photo</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Compact action bar (use below avatar in profile/admin views) ──────────────
export function PhotoActions({
  politicianId, currentPhotoUrl, politicianName, onPhotoUpdated
}: Omit<Props, 'size'>) {
  const { session } = useAuth();
  const token = session?.access_token || localStorage.getItem('nethra_token') || '';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [showUrl, setShowUrl] = useState(false);
  const [urlVal, setUrlVal] = useState('');

  function showSt(type: 'success' | 'error', msg: string) {
    setStatus({ type, msg });
    setTimeout(() => setStatus(null), 3500);
  }

  function processFile(file: File) {
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
      showSt('error', 'JPG, PNG or WebP only'); return;
    }
    if (file.size > 10*1024*1024) { showSt('error', 'Max 10MB'); return; }
    const reader = new FileReader();
    reader.onload = async e => {
      const dataUrl = e.target?.result as string;
      const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
      const mime = dataUrl.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
      setUploading(true);
      try {
        const r = await fetch(`/api/founder/politicians/${politicianId}/photo`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: base64, mime_type: mime }),
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        onPhotoUpdated?.(d.photo_url);
        showSt('success', 'Photo uploaded');
      } catch (ex: any) { showSt('error', ex.message); }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  }

  async function removePhoto() {
    setUploading(true);
    try {
      await fetch(`/api/founder/politicians/${politicianId}/photo`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` },
      });
      onPhotoUpdated?.(null);
      showSt('success', 'Photo removed');
    } catch (_) { showSt('error', 'Failed'); }
    setUploading(false);
  }

  async function saveUrl() {
    if (!urlVal.trim()) return;
    setUploading(true);
    try {
      const r = await fetch(`/api/founder/politicians/${politicianId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_url: urlVal.trim() }),
      });
      if (!r.ok) throw new Error('Failed');
      onPhotoUpdated?.(urlVal.trim());
      showSt('success', 'Photo URL saved');
      setShowUrl(false); setUrlVal('');
    } catch (ex: any) { showSt('error', ex.message); }
    setUploading(false);
  }

  const btnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '5px 11px', borderRadius: 8, fontSize: 11, fontWeight: 600,
    cursor: uploading ? 'wait' : 'pointer', border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)', color: '#8899bb',
  };

  return (
    <div>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }}
        onChange={e => { const f=e.target.files?.[0]; if(f) processFile(f); e.target.value=''; }} />

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={btnStyle}>
          {uploading ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={11} />}
          Upload
        </button>
        <button onClick={() => setShowUrl(v => !v)} style={btnStyle}>
          <Link size={11} /> URL
        </button>
        {currentPhotoUrl && (
          <button onClick={removePhoto} disabled={uploading} style={{ ...btnStyle, color: '#ff7777', borderColor: 'rgba(255,85,85,0.2)' }}>
            <Trash2 size={11} /> Remove
          </button>
        )}
        {status && (
          <span style={{ fontSize: 10, fontWeight: 700, color: status.type === 'success' ? '#00c864' : '#ff7777' }}>
            {status.type === 'success' ? '✓' : '✗'} {status.msg}
          </span>
        )}
      </div>

      <AnimatePresence>
        {showUrl && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
            style={{ overflow:'hidden', marginTop:8 }}>
            <div style={{ display:'flex', gap:6 }}>
              <input value={urlVal} onChange={e=>setUrlVal(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                onKeyDown={e => e.key === 'Enter' && saveUrl()}
                style={{ flex:1, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'6px 10px', color:'#f0f4ff', fontSize:11, outline:'none' }} />
              <button onClick={saveUrl} disabled={!urlVal.trim() || uploading}
                style={{ padding:'6px 12px', borderRadius:8, background:'rgba(0,212,170,0.12)', border:'1px solid rgba(0,212,170,0.25)', color:'#00d4aa', fontSize:11, fontWeight:700, cursor:'pointer' }}>
                Save
              </button>
              <button onClick={() => { setShowUrl(false); setUrlVal(''); }}
                style={{ padding:'6px 10px', borderRadius:8, background:'transparent', border:'1px solid rgba(255,255,255,0.08)', color:'#8899bb', fontSize:11, cursor:'pointer' }}>
                <X size={11} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
