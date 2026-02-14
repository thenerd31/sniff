"use client";

import { useState, useMemo } from "react";
import { Search, Camera, X, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";

const headlines = [
  "Your smartest shopping decision starts here",
  "Shop smarter. We'll handle the rest.",
  "Find it. Check it. Save big.",
  "The internet's best deals, verified for you",
  "Ready to outsmart every price tag?",
];

interface SearchBubbleProps {
  onSearch: (query: string, image?: File) => void;
}

export default function SearchBubble({ onSearch }: SearchBubbleProps) {
  const [query, setQuery] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const headline = useMemo(
    () => headlines[Math.floor(Math.random() * headlines.length)],
    []
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = () => {
    if (!query.trim() && !imageFile) return;
    onSearch(query.trim(), imageFile ?? undefined);
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 pb-20">
      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-4xl md:text-6xl font-bold text-white text-center max-w-3xl leading-tight mb-10"
      >
        {headline}
      </motion.h1>

      {/* Search Input Bubble */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
        className="w-full max-w-2xl"
      >
        <div className="flex items-center gap-2 bg-white rounded-full shadow-xl shadow-orange-500/10 px-4 py-3 md:px-6 md:py-4">
          {/* Image Upload */}
          <label className="flex-shrink-0 p-2 rounded-full hover:bg-orange-50 cursor-pointer transition-colors">
            <Camera className="w-5 h-5 text-orange-400" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </label>

          {/* Text Input */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="What are you looking for today?"
            className="flex-1 text-base md:text-lg text-gray-800 placeholder-gray-400 bg-transparent outline-none"
          />

          {/* Search Button */}
          <button
            onClick={handleSubmit}
            disabled={!query.trim() && !imageFile}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full font-medium text-sm transition-colors"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-3 mx-4"
          >
            <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
              <img
                src={imagePreview}
                alt="Upload preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 flex items-center gap-2 text-sm text-gray-600">
              <ImageIcon className="w-4 h-4 text-orange-400" />
              <span>{imageFile?.name}</span>
            </div>
            <button
              onClick={clearImage}
              className="p-1 hover:bg-orange-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Subtle hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 text-sm text-white/60"
      >
        Paste a product link, describe what you want, or upload an image
      </motion.p>
    </div>
  );
}
