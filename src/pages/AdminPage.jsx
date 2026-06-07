import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Users, History, Shield, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './AdminPage.module.css';

const ACTION_LABELS = {
  'document.create': 'Belge Oluşturuldu',
  'document.update': 'Belge Güncellendi',
  'document.delete': 'Belge Silindi',
  'document.view': 'Belge Görüntülendi',
  'document.download': 'Belge İndirildi',
  'document.approve': 'Belge Onaylandı',
  'document.reject': 'Belge Reddedildi',
  'machine.create': 'Makine Oluşturuldu',
  'machine.delete': 'Makine Silindi',
  'user.create': 'Kullanıcı Oluşturuldu',
  'user.update': 'Kullanıcı Güncellendi',
  'user.deactivate': 'Kullanıcı Devre Dışı',
  'user.login': 'Giriş Yapıldı',
};

export default function AdminPage() {
  const { profile } = useAuth();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';

  useEffect(() => {
    if (!profile?.companyId || !isAdmin) return;
    loadAll();
  }, [profile]);

  async function loadAll() {
    const cid = profile.companyId;
    const [uSnap, lSnap] = await Promise.all([
      getDocs(query(collection(db, 'users'), where('companyId', '==', cid))),
      getDocs(query(
        collection(db, 'audit_logs'),
        where('companyId', '==', cid),
        orderBy('timestamp', 'desc'),
        limit(50)
      )),
    ]);
    setUsers(uSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLogs(lSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  }

  async function toggleUser(u) {
    try {
      await updateDoc(doc(db, 'users', u.id), { isActive: !u.isActive });
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isActive: !x.isActive } : x));
      toast.success(u.isActive ? 'Kullanıcı devre dışı bırakıldı.' : 'Kullanıcı aktif edildi.');
    } catch {
      toast.error('Güncelleme başarısız.');
    }
  }

  if (!isAdmin) {
    return (
      <div className={styles.denied}>
        <Shield size={48} strokeWidth={1} color="#555" />
        <p>Bu sayfaya erişim yetkiniz yok.</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Admin Paneli</h1>
        <p>Kullanıcılar ve sistem logları</p>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'users' ? styles.active : ''}`}
          onClick={() => setTab('users')}
        >
          <Users size={15} /> Kullanıcılar ({users.length})
        </button>
        <button
          className={`${styles.tab} ${tab === 'logs' ? styles.active : ''}`}
          onClick={() => setTab('logs')}
        >
          <History size={15} /> İşlem Kayıtları ({logs.length})
        </button>
      </div>

      {loading ? (
        <div className={styles.skeleton}>
          {[1,2,3,4].map(i => <div key={i} className={styles.skRow} />)}
        </div>
      ) : tab === 'users' ? (
        <div className={styles.list}>
          {users.map(u => (
            <div key={u.id} className={`${styles.userRow} ${!u.isActive ? styles.inactive : ''}`}>
              <div className={styles.avatar}>{(u.displayName || 'U')[0].toUpperCase()}</div>
              <div className={styles.userInfo}>
                <p className={styles.userName}>{u.displayName}</p>
                <p className={styles.userEmail}>{u.email}</p>
              </div>
              <span className={styles.roleBadge}>{u.role}</span>
              <button
                className={styles.toggleBtn}
                onClick={() => toggleUser(u)}
                title={u.isActive ? 'Devre Dışı Bırak' : 'Aktif Et'}
              >
                {u.isActive
                  ? <ToggleRight size={24} color="#C9A84C" />
                  : <ToggleLeft size={24} color="#555" />}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.list}>
          {logs.map(log => (
            <div key={log.id} className={styles.logRow}>
              <div className={styles.logDot} />
              <div className={styles.logInfo}>
                <span className={styles.logAction}>
                  {ACTION_LABELS[log.action] || log.action}
                </span>
                <span className={styles.logMeta}>
                  {log.userDisplayName} · {log.resourceTitle || log.resourceId}
                </span>
              </div>
              <span className={styles.logTime}>
                {log.timestamp?.toDate
                  ? new Date(log.timestamp.toDate()).toLocaleString('tr-TR', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })
                  : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}