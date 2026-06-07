import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { FileText, QrCode, Download, Search, Eye, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './DocumentsPage.module.css';


export default function DocumentsPage() {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [qrModal, setQrModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (!user) return;
    loadDocs();
  }, [user]);

  useEffect(() => {
    if (!search) return setFiltered(docs);
    setFiltered(docs.filter(d =>
      d.title?.toLowerCase().includes(search.toLowerCase())
    ));
  }, [search, docs]);

  async function loadDocs() {
    try {
      const snap = await getDocs(query(
        collection(db, 'documents'),
        where('uid', '==', user.uid),
        orderBy('createdAt', 'desc')
      ));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setDocs(data);
      setFiltered(data);
    } catch (err) { console.error('loadDocs error:', err); toast.error(err.message); }
    setLoading(false);
  }

  async function handleDelete(document) {
    const toastId = toast.loading('Siliniyor...');
    try {
      // Storage'dan PDF'i sil
      if (document.storagePath) {
        await deleteObject(ref(storage, document.storagePath)).catch(() => {});
      }
      // Storage'dan QR kodunu sil
      if (document.uid) {
        await deleteObject(ref(storage, `users/${document.uid}/qr_codes/${document.id}.png`)).catch(() => {});
      }
      // Firestore'dan sil
      await deleteDoc(doc(db, 'documents', document.id));

      setDocs(prev => prev.filter(d => d.id !== document.id));
      toast.success('Belge silindi.', { id: toastId });
    } catch (err) {
      toast.error('Silinemedi: ' + err.message, { id: toastId });
    }
    setDeleteConfirm(null);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Belgelerim</h1>
          <p>{filtered.length} belge</p>
        </div>
      </div>

      <div className={styles.searchWrap}>
        <Search size={16} color="#555" />
        <input
          type="text"
          placeholder="Belge ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ background:'none', color:'var(--text-dim)', display:'flex' }}>
            <X size={14} />
          </button>
        )}
      </div>

      {loading ? (
        <div className={styles.grid}>
          {[1,2,3,4,5,6].map(i => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <FileText size={48} strokeWidth={1} color="#333" />
          <p>{search ? 'Sonuç bulunamadı' : 'Henüz belge yok'}</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map(document => (
            <DocCard
              key={document.id}
              doc={document}
              onQR={() => setQrModal(document)}
              onDelete={() => setDeleteConfirm(document)}
            />
          ))}
        </div>
      )}

      {qrModal && <QRModal doc={qrModal} onClose={() => setQrModal(null)} />}

      {deleteConfirm && (
        <div className={styles.overlay} onClick={() => setDeleteConfirm(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setDeleteConfirm(null)}><X size={18} /></button>
            <Trash2 size={36} color="#EF4444" strokeWidth={1.5} />
            <h3>Belgeyi sil?</h3>
            <p className={styles.modalSub} style={{ textAlign: 'center' }}>
              <strong style={{ color: 'var(--text)' }}>{deleteConfirm.title}</strong> kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </p>
            <div className={styles.modalActions} style={{ marginTop: 8 }}>
              <button className={styles.previewBtn} onClick={() => setDeleteConfirm(null)}>İptal</button>
              <button className={styles.deleteBtn} onClick={() => handleDelete(deleteConfirm)}>
                <Trash2 size={14} /> Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DocCard({ doc, onQR, onDelete }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        {doc.qrCodeUrl && <span className={styles.qrBadge}><QrCode size={11} /> QR Aktif</span>}
        <button className={styles.deleteIconBtn} onClick={onDelete} title="Sil">
          <Trash2 size={14} />
        </button>
      </div>
      <h3 className={styles.cardTitle}>{doc.title}</h3>
      {doc.description && <p className={styles.cardDesc}>{doc.description}</p>}
      <p className={styles.cardDate}>
        {doc.createdAt?.toDate
          ? new Date(doc.createdAt.toDate()).toLocaleDateString('tr-TR', {
              day: 'numeric', month: 'long', year: 'numeric'
            })
          : '—'}
      </p>
      <div className={styles.cardStats}>
        <span><Eye size={12} /> {doc.viewCount || 0} görüntülenme</span>
        <span><Download size={12} /> {doc.downloadCount || 0} indirme</span>
      </div>
      <div className={styles.cardActions}>
        <button className={styles.qrBtn} onClick={onQR}>
          <QrCode size={14} /> QR Kod
        </button>
        {doc.downloadUrl && (
          <a href={doc.downloadUrl} target="_blank" rel="noreferrer" className={styles.dlBtn}>
            <Download size={14} /> Aç
          </a>
        )}
      </div>
    </div>
  );
}

function QRModal({ doc, onClose }) {
  const url = doc.publicPageUrl || `https://qrdocs-d21d5.web.app/doc/${doc.id}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(url);
    toast.success('Link kopyalandı!');
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose}><X size={18} /></button>
        <h3>{doc.title}</h3>
        <p className={styles.modalSub}>{doc.fileName}</p>

        <div className={styles.qrWrap}>
          {doc.qrCodeUrl ? (
            <img src={doc.qrCodeUrl} alt="QR Kod" className={styles.qrImg} />
          ) : (
            <div className={styles.qrPlaceholder}>
              <QrCode size={72} strokeWidth={1} color="#C9A84C" />
              <p>QR oluşturuluyor...</p>
              <small>Birkaç saniye içinde hazır olacak</small>
            </div>
          )}
        </div>

        <button className={styles.urlRow} onClick={copyUrl} title="Kopyala">
          <span className={styles.urlText}>{url}</span>
          <span className={styles.copyHint}>Kopyala</span>
        </button>

        <div className={styles.modalActions}>
          {doc.qrCodeUrl && (
            <a
              href={doc.qrCodeUrl}
              download={`qrdocs-${doc.id}.png`}
              className={styles.dlQrBtn}
            >
              QR İndir
            </a>
          )}
          <a href={url} target="_blank" rel="noreferrer" className={styles.previewBtn}>
            Sayfayı Aç →
          </a>
        </div>
      </div>
    </div>
  );
}