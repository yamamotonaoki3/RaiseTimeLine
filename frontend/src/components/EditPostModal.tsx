import { useRef, useState } from 'react'
import type { Post } from '../api/posts'

interface Props {
  post: Post
  onSave: (content: string, image?: File, removeImage?: boolean) => Promise<void>
  onClose: () => void
}

const MAX_LENGTH = 280
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif']
const MAX_BYTES = 5 * 1024 * 1024

export default function EditPostModal({ post, onSave, onClose }: Props) {
  const [content, setContent] = useState(post.content)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | undefined>(undefined)
  const [previewUrl, setPreviewUrl] = useState<string | null>(post.imageUrl ?? null)
  const [removeImage, setRemoveImage] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const remaining = MAX_LENGTH - content.length

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      setImageError('画像はJPEG・PNG・GIF形式、5MB以内でアップロードしてください')
      return
    }
    if (file.size > MAX_BYTES) {
      setImageError('画像はJPEG・PNG・GIF形式、5MB以内でアップロードしてください')
      return
    }
    setImageFile(file)
    setRemoveImage(false)
    setImageError(null)
    const reader = new FileReader()
    reader.onload = () => setPreviewUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setImageFile(undefined)
    setPreviewUrl(null)
    setRemoveImage(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSave = async () => {
    if (!content.trim() || saving) return
    setSaving(true)
    setSubmitError(null)
    try {
      await onSave(content.trim(), imageFile, removeImage)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setSubmitError(msg ?? '保存に失敗しました。しばらくしてからもう一度お試しください。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="modal-header">
          <h2 className="modal-title">投稿を編集</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <textarea
            className="post-textarea"
            rows={4}
            maxLength={MAX_LENGTH}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <p className={`char-count${remaining < 20 ? ' char-count--warn' : ''}`}>
            {content.length}/{MAX_LENGTH}
          </p>
          {previewUrl && (
            <div className="post-image-preview">
              <img src={previewUrl} alt="投稿画像" className="post-image-preview__img" />
              <button
                type="button"
                className="btn btn-ghost btn-sm post-image-preview__remove"
                onClick={handleRemoveImage}
              >
                画像を削除
              </button>
            </div>
          )}
          <div className="post-image-attach">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              画像を添付
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            {imageError && <p className="error-msg">{imageError}</p>}
            {submitError && <p className="error-msg">{submitError}</p>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>キャンセル</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !content.trim() || remaining < 0}
          >
            {saving ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  )
}
