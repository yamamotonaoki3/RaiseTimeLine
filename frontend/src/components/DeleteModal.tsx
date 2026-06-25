import { useState } from 'react'

interface Props {
  onConfirm: () => Promise<void>
  onClose: () => void
}

export default function DeleteModal({ onConfirm, onClose }: Props) {
  const [deleting, setDeleting] = useState(false)

  const handleConfirm = async () => {
    setDeleting(true)
    try {
      await onConfirm()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
          <p style={{ fontSize: '18px', marginBottom: '8px' }}>⚠️ この投稿を削除しますか？</p>
          <p style={{ color: '#536471', marginBottom: '24px' }}>この操作は元に戻せません。</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="btn btn-ghost" onClick={onClose}>キャンセル</button>
            <button className="btn btn-danger" onClick={handleConfirm} disabled={deleting}>
              {deleting ? '削除中...' : '削除する'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
