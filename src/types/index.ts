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
  phone?: string
  role: UserRole | string
  createdAt?: string
  updatedAt?: string
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

// --- Poem ---

export interface PoemTranslation {
  translator?: string
  content: string
  sort_order?: number
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
  // API trả snake_case; giữ cả hai để an toàn
  author_name?: string
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
  /** Số bài thơ (API trả snake_case) — chỉ có ở endpoint /authors/top */
  poemCount?: number
  poem_count?: number
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

// --- Comment & Reply ---

export interface CommentResponse {
  id: number
  content: string
  poemId?: number
  userId?: number
  username: string
  createdAt?: string
  /** API trả snake_case, không có transform ở client */
  poem_id?: number
  user_id?: number
  created_at?: string
}

export interface CommentRequest {
  poemId: number
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
  userId: number
  poemId: number
  username: string
  createdAt: string
  status: FeedbackStatus | string
}

export interface FeedbackRequest {
  poemId: number
  content: string
}

// --- Reader Mode ---
export type ReaderStyleMode = 'modern-light' | 'modern-dark' | 'classic-sepia'
