import React from 'react';
import { Slider, Button } from 'antd';

interface StudioConfigPanelProps {
  currentStoryTopic: string;
  voiceSpeed: number;
  setVoiceSpeed: (v: number) => void;
  musicVolume: number;
  setMusicVolume: (v: number) => void;
  accentColor: string;
  setAccentColor: (c: string) => void;
  fontFamily: string;
  setFontFamily: (f: string) => void;
}

export const StudioConfigPanel: React.FC<StudioConfigPanelProps> = ({
  currentStoryTopic,
  voiceSpeed,
  setVoiceSpeed,
  musicVolume,
  setMusicVolume,
  accentColor,
  setAccentColor,
  fontFamily,
  setFontFamily,
}) => {
  return (
    <div className="border-t border-white/5 pt-6 space-y-6">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <span>🎛️</span> Tùy Chỉnh Âm Thanh & Video
      </h3>

      {/* Voice Speed Slider */}
      <div>
        <div className="flex justify-between text-sm font-bold mb-2">
          <span className="text-gray-400">Tốc độ Giọng Đọc (AI Voice Speed)</span>
          <span className="text-emerald-400">{voiceSpeed}x</span>
        </div>
        <Slider
          min={0.7}
          max={1.5}
          step={0.1}
          value={voiceSpeed}
          onChange={(value) => setVoiceSpeed(value)}
          tooltip={{ formatter: (v) => `${v ?? 1.0}x` }}
          className="w-full !m-0 !py-2"
        />
      </div>

      {currentStoryTopic === 'HEALTH' && (
        <>
          {/* Music Volume Slider */}
          <div>
            <div className="flex justify-between text-sm font-bold mb-2">
              <span className="text-gray-400">Âm lượng Nhạc Nền (BGM Volume)</span>
              <span className="text-amber-400">{Math.round(musicVolume * 100)}%</span>
            </div>
            <Slider
              min={0.0}
              max={0.4}
              step={0.02}
              value={musicVolume}
              onChange={(value) => setMusicVolume(value)}
              tooltip={{ formatter: (v) => `${Math.round((v ?? 0) * 100)}%` }}
              className="w-full !m-0 !py-2"
            />
          </div>

          {/* Accent Color Selection Presets */}
          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2">Tông màu Video (Accent Preset)</label>
            <div className="flex gap-4">
              {['emerald', 'amber', 'purple', 'blue', 'red'].map((color) => (
                <Button
                  key={color}
                  type="text"
                  shape="circle"
                  onClick={() => setAccentColor(color)}
                  className={`!w-10 !h-10 !rounded-full border-2 ${
                    accentColor === color ? '!border-white scale-110 shadow-lg' : '!border-transparent'
                  } transition-all duration-200`}
                  style={{
                    backgroundColor:
                      color === 'emerald' ? '#10B981' :
                      color === 'amber' ? '#F59E0B' :
                      color === 'purple' ? '#8B5CF6' :
                      color === 'blue' ? '#3B82F6' : '#EF4444'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Font Family Selection */}
          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2">Phông chữ hiển thị</label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                type={fontFamily === 'sans' ? 'primary' : 'default'}
                onClick={() => setFontFamily('sans')}
                className={`!px-4 !py-2.5 !rounded-xl text-sm font-bold transition duration-200 !h-auto ${
                  fontFamily === 'sans'
                    ? '!border-emerald-500 !bg-emerald-500/10 !text-emerald-400'
                    : '!border-dark-border !bg-black/20 !text-gray-400'
                }`}
              >
                Outfit (Không Chân)
              </Button>
              <Button
                type={fontFamily === 'serif' ? 'primary' : 'default'}
                onClick={() => setFontFamily('serif')}
                className={`!px-4 !py-2.5 !rounded-xl text-sm font-bold font-serif transition duration-200 !h-auto ${
                  fontFamily === 'serif'
                    ? '!border-emerald-500 !bg-emerald-500/10 !text-emerald-400'
                    : '!border-dark-border !bg-black/20 !text-gray-400'
                }`}
              >
                Playfair (Có Chân)
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
