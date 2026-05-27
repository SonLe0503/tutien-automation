import React from 'react';
import { VideoStudio } from '@/features/videos/components/VideoStudio';
import type { Story } from '@/features/videos/types';

interface ScriptCreatorPageProps {
  stories: Story[];
  onSubmit: (payload: any) => Promise<void>;
  loading: boolean;
  loadingStep: string;
}

export const ScriptCreatorPage: React.FC<ScriptCreatorPageProps> = ({
  stories,
  onSubmit,
  loading,
  loadingStep,
}) => {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <VideoStudio
        stories={stories}
        onSubmit={onSubmit}
        loading={loading}
        loadingStep={loadingStep}
      />
    </div>
  );
};
