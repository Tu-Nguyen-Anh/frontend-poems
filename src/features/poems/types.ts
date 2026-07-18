export interface Poem {
  id: number
  title: string
  content: string
  source_url: string
  period: string
  specific_genre: string
  author_name: string
  genre_name: string
}

export interface Genre {
  id: number
  name: string
}
