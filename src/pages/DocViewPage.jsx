import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { QrCode, Download, FileText } from 'lucide-react';

export default function DocViewPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) { setError('Belge ID bulunamadı.'); setLoading(false); return; }
    getDoc(doc(db, 'documents', id))
      .then(snap => {
        if (!snap.exists()) { setError('Belge bulunamadı.'); return; }
        setData({ id: snap.id, ...snap.data() });
        updateDoc(doc(db, 'documents', id), { viewCount: increment(1) }).catch(() => {});
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const formatDate = ts => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatSize = bytes => {
    if (!bytes) return '—';
    return bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(0)} KB`
      : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <QrCode size={22} color="#C9A84C" />
        <span style={s.logo}>QR<strong style={{ color: '#C9A84C' }}>Docs</strong></span>
      </header>

      <main style={s.main}>
        {loading ? (
          <div style={s.center}>
            <div style={s.spinner} />
            <p style={{ color: '#555', marginTop: 16 }}>Belge yükleniyor...</p>
          </div>
        ) : error ? (
          <div style={s.center}>
            <FileText size={52} strokeWidth={1} color="#333" />
            <p style={{ color: '#888', marginTop: 16, fontSize: 15 }}>{error}</p>
          </div>
        ) : (
          <>
            <div style={s.card}>
              <p style={s.sectionLabel}>Belge</p>
              <h1 style={s.title}>{data.title}</h1>
              {data.description && <p style={s.desc}>{data.description}</p>}
            </div>

            <div style={s.card}>
              <p style={s.sectionLabel}>Detaylar</p>
              <Row label="Yükleyen" value={data.displayName || data.userEmail || '—'} />
              <Row label="Yükleme Tarihi" value={formatDate(data.createdAt)} />
              <Row label="Dosya" value={`${data.fileName || '—'}${data.fileSize ? ` · ${formatSize(data.fileSize)}` : ''}`} />
              <Row label="Görüntülenme" value={`${(data.viewCount || 0) + 1} kez`} last />
            </div>

            {data.downloadUrl && (
              <a href={data.downloadUrl} target="_blank" rel="noreferrer" style={s.dlBtn}>
                <Download size={18} />
                Belgeyi Görüntüle / İndir
              </a>
            )}
          </>
        )}
      </main>

      <footer style={s.footer}>
        Bu belge <strong style={{ color: '#C9A84C' }}>QRDocs</strong> platformu tarafından sunulmaktadır.
      </footer>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function Row({ label, value, last }) {
  return (
    <div style={{ ...s.row, borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
      <p style={s.rowLabel}>{label}</p>
      <p style={s.rowValue}>{value}</p>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#0D0D0D', color: '#EFEFEF', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  header: { background: '#111', borderBottom: '1px solid rgba(201,168,76,0.2)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 },
  logo: { fontSize: 17, fontWeight: 700, color: '#EFEFEF' },
  main: { flex: 1, maxWidth: 560, margin: '0 auto', padding: '28px 16px 48px', width: '100%' },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  spinner: { width: 38, height: 38, border: '3px solid rgba(201,168,76,0.15)', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  card: { background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 22, marginBottom: 16 },
  sectionLabel: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#C9A84C', marginBottom: 14 },
  title: { fontSize: 22, fontWeight: 700, color: '#EFEFEF', lineHeight: 1.3, marginBottom: 8 },
  desc: { fontSize: 14, color: '#888', lineHeight: 1.5 },
  row: { padding: '11px 0' },
  rowLabel: { fontSize: 11, color: '#666', marginBottom: 3 },
  rowValue: { fontSize: 14, fontWeight: 500, color: '#EFEFEF' },
  dlBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', background: 'linear-gradient(135deg, #C9A84C, #A07830)', color: '#080808', textAlign: 'center', padding: 15, borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: 'none', marginBottom: 12 },
  footer: { textAlign: 'center', padding: '24px 16px', color: '#333', fontSize: 12 },
};