import axios from 'axios'
import type { Game } from '../types'

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

export async function fetchGames(): Promise<Game[]> {
  const { data } = await api.get<Game[]>('/games')
  return data
}
