import React, { useRef } from 'react';
import { useStore } from '../store';

export const Overlay: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addUploadedImage = useStore(s => s.addUploadedImage);
  const uploadedImages = useStore(s => s.uploadedImages);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      addUploadedImage(url);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-40 flex flex-col justify-between p-8">
      
      {/* Header */}
      <div className="w-full flex justify-center pt-4">
        <h1 className="text-6xl md:text-8xl font-script text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-500 to-yellow-200 animate-shine drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]">
          Merry Christmas
        </h1>
      </div>

      {/* Controls */}
      <div className="absolute top-8 right-8 pointer-events-auto">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="bg-black/40 backdrop-blur-md border border-luxury-gold/50 text-luxury-gold font-deco px-6 py-2 rounded-full hover:bg-luxury-gold/20 transition-all duration-300 uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(255,215,0,0.2)]"
        >
          Add Memory
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleUpload} 
        />
        <div className="mt-2 text-right text-xs text-white/50 font-serif">
            {uploadedImages.length} memories loaded
        </div>
      </div>

      {/* Instructions / Footer */}
      <div className="w-full flex justify-end items-end pb-4">
        <div className="text-right font-serif text-white/60">
           <p className="text-lg italic text-luxury-gold">An Interactive Experience</p>
           <p className="text-xs tracking-widest mt-1">USE HAND GESTURES TO CONTROL</p>
        </div>
      </div>
    </div>
  );
};