const SITE_NAME = 'Tiểu Thi Hào'
const DEFAULT_DESCRIPTION =
  'Kho tàng thơ ca Việt Nam và thế giới — tra cứu theo tác giả, thể loại, đọc nguyên tác chữ Hán kèm phiên âm, dịch nghĩa và nhiều bản dịch.'

interface SeoProps {
  /** Tiêu đề riêng của trang, không kèm tên site (tự nối " – Tiểu Thi Hào") */
  title?: string
  description?: string
  /** Path tuyệt đối bắt đầu bằng "/" để sinh canonical + og:url */
  path?: string
  /** Trang không muốn index (login, profile, 404…) */
  noindex?: boolean
  ogType?: 'website' | 'article'
}

/**
 * Meta tags SEO cho từng trang. React 19 tự hoist <title>/<meta>/<link>
 * render trong component lên <head>, không cần react-helmet.
 */
export function Seo({ title, description, path, noindex, ogType = 'website' }: SeoProps) {
  const fullTitle = title ? `${title} – ${SITE_NAME}` : `${SITE_NAME} – Kho tàng thơ ca Việt Nam`
  const desc = description || DEFAULT_DESCRIPTION
  const url = path != null ? `${window.location.origin}${path}` : undefined

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {url && <link rel="canonical" href={url} />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      {url && <meta property="og:url" content={url} />}
    </>
  )
}
