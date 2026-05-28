import type { Chapter, Story } from '@/features/videos/types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export const getChapters = async (): Promise<Chapter[]> => {
  const res = await fetch(`${API_BASE}/chapters`);
  if (!res.ok) throw new Error('Failed to fetch chapters');
  const data = await res.json();
  return data.sort((a: Chapter, b: Chapter) => b.id - a.id);
};

export const getStories = async (): Promise<Story[]> => {
  const res = await fetch(`${API_BASE}/stories/active`);
  if (!res.ok) throw new Error('Failed to fetch stories');
  return res.json();
};

export const createChapter = async (payload: any): Promise<Chapter> => {
  const res = await fetch(`${API_BASE}/chapters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, autoRender: true }),
  });
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  return res.json();
};

export const renderChapterVideo = async (id: number, settings: any = {}): Promise<Chapter> => {
  const res = await fetch(`${API_BASE}/chapters/${id}/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error(`Render failed: ${res.status}`);
  return res.json();
};

export const sendChapterAudio = async (id: number): Promise<{ success: boolean; id: number }> => {
  const res = await fetch(`${API_BASE}/chapters/${id}/send-audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Send audio failed: ${res.status}`);
  return res.json();
};

export const sendChapterVideo = async (id: number): Promise<{ success: boolean; id: number }> => {
  const res = await fetch(`${API_BASE}/chapters/${id}/send-video`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Send video failed: ${res.status}`);
  return res.json();
};

export const deleteChapter = async (id: number): Promise<void> => {
  const res = await fetch(`${API_BASE}/chapters/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete chapter');
};

export const updateChapter = async (id: number, payload: { title?: string; content?: string; summary?: string }): Promise<Chapter> => {
  const res = await fetch(`${API_BASE}/chapters/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Update failed: ${res.status}`);
  return res.json();
};
