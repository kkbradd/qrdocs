import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { FileText, QrCode, Eye, Upload, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './DashboardPage.module.css';


export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadDocs();
  }, [user]);

  async function loadDocs() {
    try {
      const snap = await getDocs(query(
        collection(db, 'documents'),
        where('uid', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(50)
      ));
      setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error('loadDocs error:', err); }
    setLoading(false);
  }

  const totalViews = docs.reduce((s, d) => s + (d.viewCount || 0), 0);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1>Merhaba 👋</h1>
          <p className={styles.sub}>{user?.email}</p>
        </div>
        <button className={styles.uploadBtn} onClick={() => navigate('/upload')}>
          <Upload size={16} /> Yeni Belge
        </button>
      </div>

      <div className={styles.statsGrid}>
        <StatCard icon={FileText} label="Toplam Belge" value={docs.length} color="#C9A84C" loading={loading} />
        <StatCard icon={Eye} label="Toplam Görüntülenme" value={totalViews} color="#60A5FA" loading={loading} />
        <StatCard icon={QrCode} label="QR Kodu Aktif" value={docs.filter(d => d.qrCodeUrl).length} color="#34D399" loading={loading} />
      </div>

      <div className={styles.recentCard}>
        <div className={styles.cardTitle}>
          <Clock size={16} color="#C9A84C" />
          <span>Son Belgeler</span>
          {docs.length > 0 && (
            <button className={styles.allBtn} onClick={() => navigate('/documents')}>
              Tümünü Gör →
            </button>
          )}
        </div>

        {loading ? (
          <div className={styles.skeleton}>
            {[1,2,3].map(i => <div key={i} className={styles.skRow} />)}
          </div>
        ) : docs.length === 0 ? (
          <div className={styles.empty}>
            <QrCode size={48} strokeWidth={1} color="#333" />
            <p>Henüz belge yok</p>
            <button className={styles.startBtn} onClick={() => navigate('/upload')}>
              İlk belgeyi yükle →
            </button>
          </div>
        ) : (
          <div className={styles.docList}>
            {docs.slice(0, 6).map(doc => (
              <div key={doc.id} className={styles.docRow}>
                <div className={styles.docIcon}>
                  <FileText size={16} color="#C9A84C" />
                </div>
                <div className={styles.docInfo}>
                  <p className={styles.docTitle}>{doc.title}</p>
                  <p className={styles.docMeta}>
                    {doc.createdAt?.toDate
                      ? new Date(doc.createdAt.toDate()).toLocaleDateString('tr-TR')
                      : '—'}
                  </p>
                </div>
                <div className={styles.docStats}>
                  <span><Eye size={12} /> {doc.viewCount || 0}</span>
                  {doc.qrCodeUrl && <span className={styles.qrActive}><QrCode size={12} /> QR</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, loading }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon} style={{ background: `${color}18`, color }}>
        <Icon size={20} />
      </div>
      <div>
        <p className={styles.statLabel}>{label}</p>
        {loading
          ? <div className={styles.statSkeleton} />
          : <p className={styles.statValue} style={{ color }}>{value}</p>}
      </div>
    </div>
  );
}