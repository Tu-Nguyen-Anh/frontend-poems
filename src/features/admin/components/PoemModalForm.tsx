import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { AuthorSelect } from './AuthorSelect'
import { poemService } from '@/services/poem.service'
import type { PoemResponse, GenreResponse, PoemRequest } from '@/types'

interface PoemModalFormProps {
  isOpen: boolean
  onClose: () => void
  editingPoem: PoemResponse | null
  genres: GenreResponse[]
  eras?: string[]
  onSubmit: (data: PoemRequest) => Promise<void>
}

export function PoemModalForm({
  isOpen,
  onClose,
  editingPoem,
  genres,
  eras = [],
  onSubmit,
}: PoemModalFormProps) {
  const [availableEras, setAvailableEras] = useState<string[]>(eras)
  const [isCustomEra, setIsCustomEra] = useState(false)
  const [customEraInput, setCustomEraInput] = useState('')

  const [form, setForm] = useState<PoemRequest>({
    name: '',
    description: '',
    year: undefined,
    content: '',
    transliteration: '',
    translation: '',
    language: 'Việt',
    era: '',
    authorId: undefined,
    genreId: undefined,
  })
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Nạp danh sách thời kỳ nếu chưa có
  useEffect(() => {
    if (eras && eras.length > 0) {
      setAvailableEras(eras)
    } else if (isOpen) {
      poemService
        .getEras()
        .then((res) => {
          if (res && res.length > 0) setAvailableEras(res)
        })
        .catch((err) => console.warn('Lỗi tải danh sách thời kỳ:', err))
    }
  }, [eras, isOpen])

  useEffect(() => {
    setErrorMsg('')
    setIsCustomEra(false)
    setCustomEraInput('')

    if (editingPoem) {
      const rawGenreName =
        editingPoem.genreName ||
        (editingPoem as any).genre_name ||
        (editingPoem as any).genre?.name ||
        ''
      const matchedGenre = rawGenreName
        ? genres.find(
            (g) =>
              g.name.trim().toLowerCase() === rawGenreName.trim().toLowerCase() ||
              g.id === Number(rawGenreName),
          )
        : undefined

      const resolvedGenreId =
        editingPoem.genreId ??
        (editingPoem as any).genre_id ??
        (editingPoem as any).genre?.id ??
        matchedGenre?.id ??
        undefined

      const resolvedAuthorId =
        editingPoem.authorId ??
        (editingPoem as any).author_id ??
        (editingPoem as any).author?.id ??
        undefined

      const resolvedTranslation =
        editingPoem.translation ||
        (editingPoem as any).meaning ||
        (editingPoem.translations && editingPoem.translations.length > 0
          ? editingPoem.translations
              .map((t) => (t.translator ? `[${t.translator}]\n${t.content}` : t.content))
              .join('\n\n')
          : '') ||
        ''

      const resolvedTransliteration =
        editingPoem.transliteration ||
        (editingPoem as any).transcription ||
        ''

      const resolvedDescription =
        editingPoem.description ||
        (editingPoem as any).note ||
        ''

      const resolvedEra =
        editingPoem.era ||
        (editingPoem as any).era ||
        ''

      if (resolvedEra) {
        setAvailableEras((prev) => (prev.includes(resolvedEra) ? prev : [resolvedEra, ...prev]))
      }

      setForm({
        name: editingPoem.name || (editingPoem as any).title || '',
        description: resolvedDescription,
        year: editingPoem.year ?? (editingPoem as any).created_year ?? undefined,
        content: editingPoem.content || (editingPoem as any).body || '',
        transliteration: resolvedTransliteration,
        translation: resolvedTranslation,
        language: editingPoem.language || 'Việt',
        era: resolvedEra,
        authorId: resolvedAuthorId,
        genreId: resolvedGenreId,
      })
    } else {
      setForm({
        name: '',
        description: '',
        year: new Date().getFullYear(),
        content: '',
        transliteration: '',
        translation: '',
        language: 'Việt',
        era: '',
        authorId: undefined,
        genreId: genres[0]?.id,
      })
    }
  }, [editingPoem, genres, isOpen])

  const initialAuthorLabel =
    editingPoem?.authorName ||
    (editingPoem as any)?.author_name ||
    (editingPoem as any)?.author?.name ||
    ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSubmitting(true)
    try {
      const eraValue = isCustomEra ? customEraInput.trim() : form.era?.trim()
      await onSubmit({
        ...form,
        era: eraValue || undefined,
      })
    } catch (err: any) {
      console.error('Lỗi lưu bài thơ:', err)
      setErrorMsg(err?.response?.data?.message || err?.message || 'Không thể lưu bài thơ. Vui lòng kiểm tra lại dữ liệu.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingPoem ? 'Chỉnh sửa bài thơ' : 'Thêm bài thơ mới'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-sm text-[var(--c-text)]">
        {errorMsg && (
          <div className="p-3 bg-[var(--c-danger-bg)] border border-[var(--c-border)] rounded-lg text-[var(--c-danger)] text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase text-[var(--c-muted)] mb-1">Tên bài thơ *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full p-2.5 bg-[var(--c-bg)] border border-[var(--c-border)] rounded-xl text-[var(--c-heading)] focus:ring-2 focus:ring-[var(--c-brand-tint-border)] outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-[var(--c-muted)] mb-1">Tác giả *</label>
            <AuthorSelect
              required
              value={form.authorId}
              initialLabel={initialAuthorLabel}
              onChange={(id) => setForm((prev) => ({ ...prev, authorId: id }))}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-[var(--c-muted)] mb-1">Thể loại *</label>
            <select
              required
              value={form.genreId || ''}
              onChange={(e) => setForm({ ...form, genreId: Number(e.target.value) || undefined })}
              className="w-full p-2.5 bg-[var(--c-bg)] border border-[var(--c-border)] rounded-xl text-[var(--c-heading)] focus:ring-2 focus:ring-[var(--c-brand-tint-border)] outline-none"
            >
              <option value="">Chọn thể loại</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-[var(--c-muted)] mb-1">Thời kỳ (Era)</label>
            {!isCustomEra ? (
              <select
                value={form.era || ''}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setIsCustomEra(true)
                    setCustomEraInput('')
                    setForm((prev) => ({ ...prev, era: '' }))
                  } else {
                    setForm((prev) => ({ ...prev, era: e.target.value }))
                  }
                }}
                className="w-full p-2.5 bg-[var(--c-bg)] border border-[var(--c-border)] rounded-xl text-[var(--c-heading)] focus:ring-2 focus:ring-[var(--c-brand-tint-border)] outline-none"
              >
                <option value="">Chọn thời kỳ</option>
                {availableEras.map((era) => (
                  <option key={era} value={era}>
                    {era}
                  </option>
                ))}
                <option value="__custom__">+ Nhập thời kỳ mới...</option>
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nhập tên thời kỳ mới..."
                  value={customEraInput}
                  onChange={(e) => {
                    setCustomEraInput(e.target.value)
                    setForm((prev) => ({ ...prev, era: e.target.value }))
                  }}
                  className="flex-1 p-2.5 bg-[var(--c-bg)] border border-[var(--c-border)] rounded-xl text-[var(--c-heading)] focus:ring-2 focus:ring-[var(--c-brand-tint-border)] outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomEra(false)
                    setForm((prev) => ({ ...prev, era: '' }))
                  }}
                  className="px-3 py-2 text-xs bg-[var(--c-surface-2)] hover:bg-[var(--c-surface-3)] text-[var(--c-text)] rounded-xl transition-colors whitespace-nowrap"
                  title="Chọn lại từ danh sách có sẵn"
                >
                  Chọn có sẵn
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-[var(--c-muted)] mb-1">Năm sáng tác</label>
            <input
              type="number"
              placeholder="VD: 1938"
              value={form.year || ''}
              onChange={(e) => setForm({ ...form, year: Number(e.target.value) || undefined })}
              className="w-full p-2.5 bg-[var(--c-bg)] border border-[var(--c-border)] rounded-xl text-[var(--c-heading)] focus:ring-2 focus:ring-[var(--c-brand-tint-border)] outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-[var(--c-muted)] mb-1">Nội dung bài thơ *</label>
          <textarea
            rows={6}
            required
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="w-full p-3 bg-[var(--c-bg)] border border-[var(--c-border)] rounded-xl font-serif text-[var(--c-heading)] focus:ring-2 focus:ring-[var(--c-brand-tint-border)] outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-[var(--c-muted)] mb-1">Phiên âm Hán Việt (tùy chọn)</label>
          <textarea
            rows={3}
            value={form.transliteration || ''}
            onChange={(e) => setForm({ ...form, transliteration: e.target.value })}
            placeholder="Phiên âm chữ Hán sang tiếng Việt..."
            className="w-full p-3 bg-[var(--c-bg)] border border-[var(--c-border)] rounded-xl font-serif text-[var(--c-heading)] focus:ring-2 focus:ring-[var(--c-brand-tint-border)] outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-[var(--c-muted)] mb-1">Dịch thơ / Giải nghĩa (tùy chọn)</label>
          <textarea
            rows={3}
            value={form.translation || ''}
            onChange={(e) => setForm({ ...form, translation: e.target.value })}
            placeholder="Bản dịch thơ hoặc giải nghĩa..."
            className="w-full p-3 bg-[var(--c-bg)] border border-[var(--c-border)] rounded-xl font-serif text-[var(--c-heading)] focus:ring-2 focus:ring-[var(--c-brand-tint-border)] outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-[var(--c-muted)] mb-1">Ghi chú / Hoàn cảnh sáng tác (tùy chọn)</label>
          <textarea
            rows={2}
            value={form.description || ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Ghi chú thêm về bài thơ, hoàn cảnh sáng tác..."
            className="w-full p-3 bg-[var(--c-bg)] border border-[var(--c-border)] rounded-xl text-[var(--c-heading)] focus:ring-2 focus:ring-[var(--c-brand-tint-border)] outline-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--c-border)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[var(--c-surface-2)] hover:bg-[var(--c-surface-3)] text-[var(--c-text)] rounded-lg text-xs font-medium transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-[var(--c-gold)] hover:opacity-90 text-white font-medium text-xs rounded-lg transition-colors"
          >
            {submitting ? 'Đang lưu...' : 'Lưu bài thơ'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
