// --- General API Response Schemas ---

export interface ResponseGeneral<T> {
  status: number
  message: string
  data: T
  timestamp: string
}

export interface PageResponse<T> {
  content: T[]
  amount: number
}

export interface CursorPageResponse<T> {
  content: T[]
  next_cursor?: number | null
  nextCursor?: number | null
  has_next?: boolean
  hasNext?: boolean
  total_elements?: number | null
  totalElements?: number | null
}

export interface FileUploadResponse {
  url: string
  file_name: string
  fileName?: string
  size: number
  content_type: string
  contentType?: string
}

// --- Auth & User ---

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface UserResponse {
  id: number
  username: string
  email: string
  phoneNumber?: string
  phone_number?: string
  phone?: string
  role: UserRole | string
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  tokenType?: string
  expiresIn?: number
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  phoneNumber?: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface GoogleLoginRequest {
  token: string
}

// --- Poem ---

export interface PoemTranslation {
  translator?: string
  content: string
  sort_order?: number
}

export interface LibraryStats {
  total_poems: number
  total_authors: number
  total_countries: number
  viet_count: number
  han_count: number
  foreign_count: number
}

export interface PoemResponse {
  id: number
  name: string
  description?: string
  year?: number
  content: string
  transliteration?: string
  translation?: string
  meaning?: string
  language?: string
  era?: string
  genreName?: string
  authorName?: string
  authorId?: number
  // API trả snake_case; giữ cả hai để an toàn
  author_name?: string
  author_id?: number
  genre_name?: string
  translations?: PoemTranslation[]
}

/** Một nhánh trong cây duyệt phân cấp (Ngôn ngữ → Thời kỳ → Thể thơ → Tác giả). */
export interface FacetItem {
  id: number | null
  label: string
  count: number
}

export interface PoemRequest {
  name: string
  description?: string
  year?: number
  content: string
  transliteration?: string
  translation?: string
  language?: string
  genreId?: number
  authorId?: number
}

// --- Author ---

export interface AuthorResponse {
  id: number
  name: string
  birthYear?: number
  achievement?: string
  hometown?: string
  /** Ảnh chân dung + tiểu sử (crawl thivien). API trả snake_case → đọc cả hai. */
  avatarUrl?: string
  avatar_url?: string
  /** Key ảnh tự crawl trên RustFS (dạng "<uuid>.<ext>"); link = `${env.AVATAR_BASE_URL}/${avatar_local}`. */
  avatarLocal?: string
  avatar_local?: string
  bio?: string
  /** Quốc gia tác giả (crawl thivien). API trả snake_case → đọc cả hai. */
  country?: string
  countryId?: number
  country_id?: number
  /** Số bài thơ (API trả snake_case) */
  poemCount?: number
  poem_count?: number
  /** Số tác phẩm văn xuôi (API trả snake_case) */
  storyCount?: number
  story_count?: number
}

export interface AuthorRequest {
  name: string
  birthYear?: number
  achievement?: string
  hometown?: string
}

// --- Genre ---

export interface GenreResponse {
  id: number
  name: string
}

export interface GenreRequest {
  name: string
}

// --- Poem Composition (Góc Sáng Tác) ---

export type PoemCompositionStatus = 'PUBLISHED' | 'DRAFT' | 'PRIVATE'

export interface PoemCompositionResponse {
  id: number
  userId?: number
  user_id?: number
  username?: string
  content: string
  penName?: string
  pen_name?: string
  title: string
  genreId?: number
  genre_id?: number
  genreName?: string
  genre_name?: string
  status: PoemCompositionStatus
  createdAt?: string
  created_at?: string
}

export interface PoemCompositionRequest {
  title: string
  content: string
  penName?: string
  pen_name?: string
  genreId?: number
  genre_id?: number
  status?: PoemCompositionStatus
}

// --- Comment & Reply ---

export interface CommentResponse {
  id: number
  content: string
  poemId?: number
  poem_id?: number
  poemCompositionId?: number
  poem_composition_id?: number
  userId?: number
  user_id?: number
  username: string
  createdAt?: string
  created_at?: string
}

export interface CommentRequest {
  poemId?: number
  poem_id?: number
  poemCompositionId?: number
  poem_composition_id?: number
  content: string
}

export interface ReplyResponse {
  id: number
  content: string
  commentId?: number
  userId?: number
  username: string
  createdAt?: string
  contentComment?: string
  content_comment?: string
  poemId?: number
  poem_id?: number
  /** API trả snake_case, không có transform ở client */
  comment_id?: number
  user_id?: number
  created_at?: string
}

export interface ReplyRequest {
  commentId: number
  content: string
}

// --- Feedback ---

export enum FeedbackStatus {
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  APPROVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

export interface FeedbackResponse {
  id: number
  content: string
  userId?: number
  user_id?: number
  poemId?: number
  poem_id?: number
  username: string
  createdAt?: string
  created_at?: string
  status: FeedbackStatus | string
}

export interface FeedbackRequest {
  poemId: number
  content: string
}

// --- User Preferences & Recommendation ---
export interface UserPreferences {
  authorIds: number[]
  genreIds: number[]
  eras: string[]
}

export interface RandomPoemsParams {
  authorIds?: number[]
  genreIds?: number[]
  eras?: string[]
}

// --- Reader Mode ---
export type ReaderStyleMode = 'modern-light' | 'modern-dark' | 'classic-sepia'

// --- Văn xuôi / Truyện ngắn (API trả snake_case) ---
export interface StoryChapterMeta {
  seq: number
  title?: string
  word_count?: number
  char_count?: number
}

export interface StoryResponse {
  id: number
  title: string
  author?: string
  author_url?: string
  author_id?: number
  year?: number
  genre?: string
  category?: string
  collection?: string
  source?: string
  type?: string
  chapter_count?: number
  char_count?: number
  word_count?: number
  chapters?: StoryChapterMeta[]
}

export interface StoryChapterResponse {
  id?: number
  story_id: number
  seq: number
  title?: string
  word_count?: number
  char_count?: number
  content: string
}

export interface StoryCollection {
  collection: string
  count: number
}

