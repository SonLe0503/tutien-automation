import React, { useState } from 'react';
import { Pagination, Input, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { VideoList } from '@/features/videos/components/VideoList';
import type { Chapter } from '@/features/videos/types';

interface VideoGalleryPageProps {
  chapters: Chapter[];
  onDelete: (id: number) => void;
  onPlay: (url: string, type: 'audio' | 'video', title: string) => void;
  getMediaUrl: (filename: string | null, type: 'audio' | 'video') => string | null;
  onRenderVideo?: (id: number) => Promise<void>;
  onSendAudio?: (id: number) => Promise<void>;
}

export const VideoGalleryPage: React.FC<VideoGalleryPageProps> = ({
  chapters,
  onDelete,
  onPlay,
  getMediaUrl,
  onRenderVideo,
  onSendAudio,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<'ALL' | 'HEALTH' | 'TUTIEN'>('ALL');
  const [selectedMediaType, setSelectedMediaType] = useState<'ALL' | 'VIDEO' | 'AUDIO' | 'NONE'>('ALL');
  const pageSize = 6;

  // Filter Logic
  const filteredChapters = chapters.filter((chapter) => {
    // 1. Text search filter
    const matchesSearch =
      chapter.title.toLowerCase().includes(searchText.toLowerCase()) ||
      chapter.content.toLowerCase().includes(searchText.toLowerCase());

    // 2. Topic category filter
    const topicLabel = chapter.story?.topic ?? 'TUTIEN';
    const matchesTopic =
      selectedTopic === 'ALL' ||
      (selectedTopic === 'HEALTH' && topicLabel === 'HEALTH') ||
      (selectedTopic === 'TUTIEN' && topicLabel !== 'HEALTH');

    // 3. Media presence filter
    const hasVideo = !!chapter.videoPath;
    const hasAudio = !!chapter.audioPath;
    let matchesMedia = true;
    if (selectedMediaType === 'VIDEO') matchesMedia = hasVideo;
    else if (selectedMediaType === 'AUDIO') matchesMedia = hasAudio;
    else if (selectedMediaType === 'NONE') matchesMedia = !hasVideo && !hasAudio;

    return matchesSearch && matchesTopic && matchesMedia;
  });

  // Calculate total pages for filtered items
  const totalPages = Math.ceil(filteredChapters.length / pageSize);

  // Get current chapters for page
  const startIndex = (currentPage - 1) * pageSize;
  const slicedChapters = filteredChapters.slice(startIndex, startIndex + pageSize);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset page to 1 when filters change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    setCurrentPage(1);
  };

  const handleTopicChange = (value: 'ALL' | 'HEALTH' | 'TUTIEN') => {
    setSelectedTopic(value);
    setCurrentPage(1);
  };

  const handleMediaChange = (value: 'ALL' | 'VIDEO' | 'AUDIO' | 'NONE') => {
    setSelectedMediaType(value);
    setCurrentPage(1);
  };

  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 p-5 bg-white/5 border border-white/5 rounded-3xl backdrop-blur-md">
        <div className="flex-grow">
          <Input
            placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..."
            value={searchText}
            onChange={handleSearchChange}
            prefix={<SearchOutlined className="text-gray-500" />}
            allowClear
            className="w-full !bg-black/40 !border-dark-border !text-white !rounded-xl !h-12 focus:!border-emerald-500 placeholder:!text-gray-600"
          />
        </div>
        <div className="flex gap-4 flex-wrap md:flex-nowrap">
          <Select
            value={selectedTopic}
            onChange={handleTopicChange}
            className="w-full md:w-48 !bg-transparent text-white [&>.ant-select-selector]:!bg-black/40 [&>.ant-select-selector]:!border-dark-border [&>.ant-select-selector]:!text-white [&>.ant-select-selector]:!rounded-xl [&>.ant-select-selector]:!h-12 [&>.ant-select-selector]:!py-1.5 focus:!border-emerald-500"
            popupClassName="!bg-[#0f1412] !border !border-white/10 [&_.ant-select-item]:!text-gray-300 [&_.ant-select-item-option-selected]:!bg-emerald-500/20 [&_.ant-select-item-option-active]:!bg-white/5 hover:[&_.ant-select-item]:!text-white"
          >
            <Select.Option value="ALL">📁 Tất cả chủ đề</Select.Option>
            <Select.Option value="HEALTH">🎬 HEALTH (Video)</Select.Option>
            <Select.Option value="TUTIEN">📖 TUTIEN (Audio)</Select.Option>
          </Select>

          <Select
            value={selectedMediaType}
            onChange={handleMediaChange}
            className="w-full md:w-48 !bg-transparent text-white [&>.ant-select-selector]:!bg-black/40 [&>.ant-select-selector]:!border-dark-border [&>.ant-select-selector]:!text-white [&>.ant-select-selector]:!rounded-xl [&>.ant-select-selector]:!h-12 [&>.ant-select-selector]:!py-1.5 focus:!border-emerald-500"
            popupClassName="!bg-[#0f1412] !border !border-white/10 [&_.ant-select-item]:!text-gray-300 [&_.ant-select-item-option-selected]:!bg-emerald-500/20 [&_.ant-select-item-option-active]:!bg-white/5 hover:[&_.ant-select-item]:!text-white"
          >
            <Select.Option value="ALL">📀 Tất cả định dạng</Select.Option>
            <Select.Option value="VIDEO">▶️ Có Video</Select.Option>
            <Select.Option value="AUDIO">🔊 Có Audio</Select.Option>
            <Select.Option value="NONE">📭 Không có media</Select.Option>
          </Select>
        </div>
      </div>

      {/* Render Sliced List */}
      <VideoList
        chapters={slicedChapters}
        onDelete={onDelete}
        onPlay={onPlay}
        getMediaUrl={getMediaUrl}
        onRenderVideo={onRenderVideo}
        onSendAudio={onSendAudio}
      />

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center pt-6 pb-2">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filteredChapters.length}
            onChange={handlePageChange}
            showSizeChanger={false}
            showTitle={false}
          />
        </div>
      )}
    </div>
  );
};
