import React from 'react';
import type { Chapter } from '@/features/videos/types';
import { VideoCard } from '@/features/videos/components/VideoCard';

interface VideoListProps {
  chapters: Chapter[];
  onDelete: (id: number) => void;
  onPlay: (url: string, type: 'audio' | 'video', title: string) => void;
  getMediaUrl: (filename: string | null, type: 'audio' | 'video') => string | null;
  onRenderVideo?: (id: number) => Promise<void>;
  onSendAudio?: (id: number) => Promise<void>;
}

export const VideoList: React.FC<VideoListProps> = ({
  chapters,
  onDelete,
  onPlay,
  getMediaUrl,
  onRenderVideo,
  onSendAudio,
}) => {
  if (chapters.length === 0) {
    return (
      <div className="bg-dark-card border border-dark-border backdrop-blur-md rounded-3xl p-12 text-center text-gray-500">
        <div className="text-5xl mb-4">📭</div>
        Chưa có video hay audio nào được tạo. Hãy biên soạn kịch bản ở cột bên trái để bắt đầu!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {chapters.map((chapter) => (
        <VideoCard
          key={chapter.id}
          chapter={chapter}
          onDelete={onDelete}
          onPlay={onPlay}
          getMediaUrl={getMediaUrl}
          onRenderVideo={onRenderVideo}
          onSendAudio={onSendAudio}
        />
      ))}
    </div>
  );
};
