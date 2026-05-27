import React from 'react';
import { Modal } from 'antd';

interface VideoPlayerModalProps {
  url: string;
  type: 'audio' | 'video';
  title: string;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ url, type, title, onClose }) => {
  return (
    <Modal
      open={true}
      title={<span className="text-white text-lg font-bold truncate block pr-8">{title}</span>}
      onCancel={onClose}
      footer={null}
      centered
      width={type === 'video' ? 420 : 520}
      className="dark-modal [&>.ant-modal-content]:!bg-[#0f1412] [&>.ant-modal-content]:!border [&>.ant-modal-content]:!border-white/10 [&>.ant-modal-content]:!rounded-3xl [&>.ant-modal-header]:!bg-transparent [&>.ant-modal-close]:!text-gray-400 hover:[&>.ant-modal-close]:!text-white [&>.ant-modal-close]:hover:!bg-white/10 [&>.ant-modal-close]:!rounded-full"
    >
      <div className="w-full flex justify-center bg-black/60 rounded-2xl overflow-hidden border border-white/5 mt-4">
        {type === 'video' ? (
          <video
            src={url}
            controls
            autoPlay
            className="h-[550px] w-auto max-w-full aspect-[9/16]"
          />
        ) : (
          <div className="py-12 px-6 w-full flex flex-col items-center gap-6">
            <div className="text-6xl animate-pulse">📻</div>
            <span className="text-gray-400 text-sm font-semibold">Trình phát Giọng nói AI</span>
            <audio
              src={url}
              controls
              autoPlay
              className="w-full"
            />
          </div>
        )}
      </div>
    </Modal>
  );
};
