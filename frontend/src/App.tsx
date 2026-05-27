import { useState, useEffect } from 'react';
import { ConfigProvider, theme, Button } from 'antd';
import { SendOutlined, EditOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { getChapters, getStories, createChapter, deleteChapter, renderChapterVideo, sendChapterAudio } from '@/features/videos/api';
import { VideoPlayerModal } from '@/features/videos/components';
import { ScriptCreatorPage, VideoGalleryPage } from '@/features/videos/pages';
import type { Chapter, Story } from '@/features/videos/types';
import './App.css';

const API_BASE = import.meta.env.VITE_API_BASE;

function App() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [activeTab, setActiveTab] = useState<'creator' | 'gallery'>('creator');
  
  // Loading & Feedback States
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null);
  const [activeMediaType, setActiveMediaType] = useState<'audio' | 'video' | null>(null);
  const [activeMediaTitle, setActiveMediaTitle] = useState('');

  // 1. Fetch Chapters and Stories on Mount
  const fetchData = async () => {
    try {
      const [chaptersData, storiesData] = await Promise.all([
        getChapters(),
        getStories()
      ]);
      setChapters(chaptersData);
      setStories(storiesData);
    } catch (e) {
      console.error('Failed to fetch data from API', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Handle Chapter Creation via API Service
  const handleCreate = async (payload: any) => {
    setLoading(true);
    setLoadingStep('Khởi động kịch bản AI...');

    try {
      setLoadingStep('Đang chuyển văn bản thành Giọng nói AI (GenMax)...');

      const newChapter = await createChapter(payload);
      console.log('Successfully created:', newChapter);

      setLoadingStep('Giọng nói hoàn thành! Đang render video bằng HyperFrames (Có thể mất 20s-30s)...');

      // Reload list
      await fetchData();

      setLoadingStep('Hoàn thành xuất sắc! Đã render video và gửi lên Telegram thành công! 🎉');
      
      // Auto switch to gallery tab to let the user see the new card
      setTimeout(() => {
        setActiveTab('gallery');
        setLoading(false);
        setLoadingStep('');
      }, 3000);

    } catch (err: any) {
      console.error(err);
      alert('Đã xảy ra lỗi trong quá trình tạo video: ' + err.message);
      setLoading(false);
      setLoadingStep('');
    }
  };

  // 3. Handle Chapter Delete via API Service
  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này không?')) return;
    try {
      await deleteChapter(id);
      setChapters(chapters.filter(ch => ch.id !== id));
    } catch (e) {
      console.error('Failed to delete chapter', e);
    }
  };

  // 3.5. Handle Manual Video Generation via API Service
  const handleRenderVideo = async (id: number) => {
    setLoading(true);
    setLoadingStep('Khởi động kịch bản AI...');

    try {
      setLoadingStep('Đang chuyển đổi giọng nói & render video bằng HyperFrames (Khoảng 20s-30s)...');
      
      const updatedChapter = await renderChapterVideo(id);
      console.log('Successfully manual rendered:', updatedChapter);

      setLoadingStep('Hoàn thành xuất sắc! Đã render video và gửi lên Telegram thành công! 🎉');
      
      // Reload list
      await fetchData();
      
      setTimeout(() => {
        setLoading(false);
        setLoadingStep('');
      }, 3000);

    } catch (err: any) {
      console.error(err);
      alert('Đã xảy ra lỗi trong quá trình tạo video: ' + err.message);
      setLoading(false);
      setLoadingStep('');
    }
  };

  // 3.6. Handle Manual Audio Send to Telegram (TUTIEN)
  const handleSendAudio = async (id: number) => {
    try {
      await sendChapterAudio(id);
      alert('✅ Đã gửi audio lên Telegram thành công!');
    } catch (err: any) {
      console.error(err);
      alert('Đã xảy ra lỗi khi gửi audio: ' + err.message);
    }
  };

  // 4. Helper to get clean media path
  const getMediaUrl = (filename: string | null, type: 'audio' | 'video') => {
    if (!filename) return null;
    const basename = filename.split('/').pop();
    return `${API_BASE}/${type === 'audio' ? 'audio' : 'output'}/${basename}`;
  };

  const handlePlayMedia = (url: string, type: 'audio' | 'video', title: string) => {
    setActiveMediaUrl(url);
    setActiveMediaType(type);
    setActiveMediaTitle(title);
  };

  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
      <div className="min-h-screen p-6 md:p-12 relative z-10 flex flex-col max-w-7xl mx-auto">
        {/* HEADER SECTION */}
        <header className="mb-8 text-center md:text-left flex flex-col md:flex-row md:justify-between md:items-center border-b border-white/5 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-[#10B981] via-[#34D399] to-[#FBBF24] bg-clip-text text-transparent">
              Studio Sáng Tạo Video & Giọng Nói AI
            </h1>
            <p className="text-gray-400 mt-2 text-lg">
              Hệ thống tự động chuyển đổi kịch bản thành video ngắn 9:16 (HyperFrames) và audio MP3.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-4 justify-center">
            <Button
              type="primary"
              href="https://t.me/c/5422795169"
              target="_blank"
              rel="noopener noreferrer"
              icon={<SendOutlined />}
              className="!flex items-center gap-2 !px-5 !py-2.5 !bg-sky-600/20 hover:!bg-sky-600/35 !border-sky-500/30 !text-sky-400 font-semibold !rounded-xl !h-auto transition duration-200"
            >
              Kênh Telegram
            </Button>
          </div>
        </header>

        {/* TABS NAVIGATION */}
        <div className="flex gap-4 p-1.5 bg-white/5 border border-white/5 backdrop-blur-2xl rounded-2xl mb-8 self-center md:self-start">
          <Button
            type="text"
            onClick={() => setActiveTab('creator')}
            icon={<EditOutlined />}
            className={`!flex items-center gap-2 !px-5 !py-2.5 !rounded-xl font-bold !text-sm transition-all duration-300 !h-auto !border-0 ${
              activeTab === 'creator'
                ? '!bg-gradient-to-r !from-emerald-500 !to-emerald-400 !text-black shadow-lg shadow-emerald-500/20 font-black'
                : '!text-gray-400 hover:!text-white hover:!bg-white/5'
            }`}
          >
            Biên Soạn Kịch Bản
          </Button>
          <Button
            type="text"
            onClick={() => setActiveTab('gallery')}
            icon={<VideoCameraOutlined />}
            className={`!flex items-center gap-2 !px-5 !py-2.5 !rounded-xl font-bold !text-sm transition-all duration-300 !h-auto !border-0 ${
              activeTab === 'gallery'
                ? '!bg-gradient-to-r !from-emerald-500 !to-emerald-400 !text-black shadow-lg shadow-emerald-500/20 font-black'
                : '!text-gray-400 hover:!text-white hover:!bg-white/5'
            }`}
          >
            Thư Viện Tác Phẩm
          </Button>
        </div>

        {/* CONDITIONAL PAGES WORKSPACE */}
        <main className="flex-grow">
          {activeTab === 'creator' ? (
            <ScriptCreatorPage
              stories={stories}
              onSubmit={handleCreate}
              loading={loading}
              loadingStep={loadingStep}
            />
          ) : (
            <VideoGalleryPage
              chapters={chapters}
              onDelete={handleDelete}
              onPlay={handlePlayMedia}
              getMediaUrl={getMediaUrl}
              onRenderVideo={handleRenderVideo}
              onSendAudio={handleSendAudio}
            />
          )}
        </main>

        {/* MEDIA PREVIEW MODAL */}
        {activeMediaUrl && activeMediaType && (
          <VideoPlayerModal
            url={activeMediaUrl}
            type={activeMediaType}
            title={activeMediaTitle}
            onClose={() => {
              setActiveMediaUrl(null);
              setActiveMediaType(null);
            }}
          />
        )}
      </div>
    </ConfigProvider>
  );
}

export default App;
