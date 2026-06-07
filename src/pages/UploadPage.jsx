import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, uploadBytes } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Upload, FileText, X, CheckCircle, Loader2 } from 'lucide-react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import styles from './UploadPage.module.css';

export default function UploadPage() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  const onDrop = useCallback(accepted => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
    onDropRejected: () => toast.error('Maks 50MB, PDF/JPG/PNG desteklenir.'),
  });

  const formatSize = bytes =>
    bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(0)} KB`
      : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!file || !title.trim()) {
      toast.error('Dosya ve belge adı zorunludur.');
      return;
    }
    setUploading(true);
    try {
      // 1) Dosyayı Storage'a yükle
      const ext = file.name.split('.').pop();
      const storagePath = `users/${user.uid}/documents/${Date.now()}.${ext}`;
      const uploadTask = uploadBytesResumable(ref(storage, storagePath), file);

      await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          snap => setProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
          reject,
          resolve
        );
      });

      const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

      // 2) Firestore'a kaydet
      const docRef = await addDoc(collection(db, 'documents'), {
        title: title.trim(),
        description: description.trim() || null,
        fileName: file.name,
        fileSize: file.size,
        downloadUrl,
        storagePath,
        uid: user.uid,
        userEmail: user.email,
        displayName: user.displayName || '',
        viewCount: 0,
        downloadCount: 0,
        publicPageUrl: '',
        qrCodeUrl: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 3) QR PNG oluştur ve Storage'a yükle
      const publicUrl = `https://qrdocs-d21d5.web.app/doc/${docRef.id}`;
      const qrDataUrl = await QRCode.toDataURL(publicUrl, {
        width: 512, margin: 2,
        color: { dark: '#C9A84C', light: '#FFFFFF' },
        errorCorrectionLevel: 'H',
      });
      const qrBlob = await (await fetch(qrDataUrl)).blob();
      const qrRef = ref(storage, `users/${user.uid}/qr_codes/${docRef.id}.png`);
      await uploadBytes(qrRef, qrBlob, { contentType: 'image/png' });
      const qrCodeUrl = await getDownloadURL(qrRef);

      // 4) Belgeyi QR URL ile güncelle
      await updateDoc(doc(db, 'documents', docRef.id), {
        qrCodeUrl,
        publicPageUrl: publicUrl,
        updatedAt: serverTimestamp(),
      });

      setDone(true);
      toast.success('Belge yüklendi, QR kod oluşturuldu!');
    } catch (err) {
      toast.error('Hata: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setDone(false); setFile(null);
    setTitle(''); setDescription(''); setProgress(0);
  };

  if (done) {
    return (
      <div className={styles.success}>
        <CheckCircle size={64} color="#C9A84C" strokeWidth={1.5} />
        <h2>Belge Yüklendi!</h2>
        <p>QR kod oluşturuldu. Belgelerim'den görüntüleyebilirsiniz.</p>
        <button className={styles.resetBtn} onClick={reset}>+ Yeni Belge Yükle</button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Belge Yükle</h1>
        <p>Dosyayı sürükleyin veya seçin — QR kod otomatik oluşturulur</p>
      </div>

      <div className={styles.layout}>
        {/* Drop Zone */}
        <div
          {...getRootProps()}
          className={`${styles.dropzone} ${isDragActive ? styles.dragActive : ''} ${file ? styles.hasFile : ''}`}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className={styles.filePreview}>
              <div className={styles.fileIconWrap}>
                <FileText size={36} color="#C9A84C" strokeWidth={1.5} />
              </div>
              <p className={styles.fileName}>{file.name}</p>
              <p className={styles.fileSize}>{formatSize(file.size)}</p>
              <button className={styles.removeBtn} onClick={e => { e.stopPropagation(); setFile(null); }}>
                <X size={14} /> Kaldır
              </button>
            </div>
          ) : (
            <div className={styles.dropContent}>
              <div className={styles.dropIcon}>
                <Upload size={30} color="#C9A84C" strokeWidth={1.5} />
              </div>
              <p className={styles.dropText}>{isDragActive ? 'Bırakın!' : 'Dosyayı sürükleyin'}</p>
              <p className={styles.dropSub}>veya tıklayarak seçin</p>
              <p className={styles.dropHint}>PDF · JPG · PNG &nbsp;·&nbsp; Maks. 50 MB</p>
            </div>
          )}
        </div>

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Belge Adı <span className={styles.req}>*</span></label>
            <input
              type="text"
              placeholder="örn: Kalite kontrol raporu 2024"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label>Açıklama</label>
            <textarea
              placeholder="Opsiyonel not..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          {uploading && (
            <div className={styles.progressWrap}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>
              <span className={styles.progressText}>{progress}%</span>
            </div>
          )}

          <button type="submit" className={styles.submitBtn} disabled={uploading || !file}>
            {uploading
              ? <><Loader2 size={18} className={styles.spinner} /> Yükleniyor...</>
              : <><Upload size={18} /> Yükle & QR Oluştur</>}
          </button>
        </form>
      </div>
    </div>
  );
}