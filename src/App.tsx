/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { Flame, Layout, Newspaper, Share2, Loader2, Camera, Send, Upload, ShieldCheck } from 'lucide-react';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

type Medium = 'billboard' | 'newspaper' | 'social';

interface GeneratedImage {
  url: string;
  medium: Medium;
  prompt: string;
}

export default function App() {
  const [productDescription, setProductDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateImages = async () => {
    if (!productDescription.trim()) return;

    setIsGenerating(true);
    setError(null);
    setImages([]);

    // Prompt context including the logo description for consistency
    const brandContext = "The brand is S&T BBQ. The logo is a bold shield with orange and red flames, featuring metallic silver 'S&T' text and fiery 'BBQ' text. Ensure the branding is visible and consistent.";

    const mediums: { type: Medium; promptSuffix: string; aspectRatio: "1:1" | "16:9" | "3:4" | "4:3" | "9:16" }[] = [
      { 
        type: 'billboard', 
        promptSuffix: `A wide-angle shot of a large highway billboard for S&T BBQ. ${brandContext} The billboard prominently features [PRODUCT]. High-end commercial photography, clear blue sky. No people.`,
        aspectRatio: "16:9"
      },
      { 
        type: 'newspaper', 
        promptSuffix: `A vintage black and white newspaper ad for S&T BBQ. ${brandContext} The ad features [PRODUCT] in a classic layout with old-school typography. Grainy texture, no people.`,
        aspectRatio: "4:3"
      },
      { 
        type: 'social', 
        promptSuffix: `A high-contrast, vibrant Instagram close-up for S&T BBQ. ${brandContext} Professional food styling of [PRODUCT]. Shallow depth of field, wood-fire aesthetic. No people.`,
        aspectRatio: "1:1"
      }
    ];

    try {
      const generatedResults: GeneratedImage[] = [];

      for (const medium of mediums) {
        const fullPrompt = medium.promptSuffix.replace('[PRODUCT]', productDescription);
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [{ text: fullPrompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: medium.aspectRatio,
            },
          },
        });

        let imageUrl = '';
        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if (part.inlineData) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }

        if (imageUrl) {
          generatedResults.push({
            url: imageUrl,
            medium: medium.type,
            prompt: fullPrompt
          });
        }
      }

      setImages(generatedResults);
    } catch (err) {
      console.error("Generation failed:", err);
      setError("Failed to generate images. Please check your API key and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] font-serif selection:bg-[#ff4d00] selection:text-white">
      {/* Header */}
      <header className="border-b border-white/10 py-8 px-6 bg-[#111] sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-16 h-16 bg-[#222] rounded-xl border border-white/10 flex items-center justify-center cursor-pointer hover:border-[#ff4d00] transition-all overflow-hidden group"
            >
              {logoUrl ? (
                <img src={logoUrl} alt="S&T BBQ Logo" className="w-full h-full object-contain" />
              ) : (
                <Upload className="w-6 h-6 text-white/20 group-hover:text-[#ff4d00]" />
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleLogoUpload} 
                className="hidden" 
                accept="image/*"
              />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter uppercase italic text-white flex items-center gap-2">
                S&T BBQ
                <ShieldCheck className="w-6 h-6 text-[#ff4d00]" />
              </h1>
              <p className="text-[10px] uppercase tracking-[0.4em] font-sans font-bold text-[#ff4d00]">Pitmaster Visualizer</p>
            </div>
          </div>
          
          <div className="flex items-center gap-8 text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-white/40">
            <div className="flex flex-col items-end">
              <span>Low & Slow</span>
              <span className="text-[#ff4d00]">Since 2026</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Input Section */}
        <section className="mb-20">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl mb-6 italic text-white">What's on the smoker today?</h2>
            
            <div className="relative">
              <textarea
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Describe your brisket, ribs, or specialty tray..."
                className="w-full h-40 p-8 bg-[#151515] border border-white/10 rounded-3xl font-sans text-lg focus:outline-none focus:border-[#ff4d00] transition-all resize-none shadow-2xl text-white placeholder:text-white/10"
              />
              <div className="absolute bottom-6 right-6 flex gap-3">
                <button
                  onClick={generateImages}
                  disabled={isGenerating || !productDescription.trim()}
                  className="bg-[#ff4d00] text-white px-8 py-4 rounded-2xl font-sans font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:bg-[#ff6a00] hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 transition-all active:scale-95 shadow-[0_0_30px_rgba(255,77,0,0.3)]"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Stoking the coals...
                    </>
                  ) : (
                    <>
                      <Flame className="w-4 h-4" />
                      Visualize
                    </>
                  )}
                </button>
              </div>
            </div>
            {error && <p className="mt-4 text-red-500 font-sans text-xs uppercase tracking-widest">{error}</p>}
          </div>
        </section>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {images.length > 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
              {/* Billboard - Full Width */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Layout className="w-4 h-4 text-[#ff4d00]" />
                    <span className="font-sans font-black text-[10px] uppercase tracking-[0.3em] text-white/40">Highway Billboard</span>
                  </div>
                  <span className="text-[10px] font-sans text-white/20 uppercase tracking-widest">16:9 Aspect</span>
                </div>
                <div className="relative aspect-[16/9] overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl group">
                  <img 
                    src={images.find(img => img.medium === 'billboard')?.url} 
                    alt="Billboard" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
              </div>

              {/* Grid for Newspaper and Social */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Newspaper */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Newspaper className="w-4 h-4 text-[#ff4d00]" />
                    <span className="font-sans font-black text-[10px] uppercase tracking-[0.3em] text-white/40">The Daily Pitmaster</span>
                  </div>
                  <div className="aspect-[4/3] bg-white p-6 rounded-[2rem] shadow-xl">
                    <div className="w-full h-full border-2 border-black/5 overflow-hidden rounded-xl">
                      <img 
                        src={images.find(img => img.medium === 'newspaper')?.url} 
                        alt="Newspaper" 
                        className="w-full h-full object-cover grayscale contrast-150"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                </div>

                {/* Social */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Share2 className="w-4 h-4 text-[#ff4d00]" />
                    <span className="font-sans font-black text-[10px] uppercase tracking-[0.3em] text-white/40">Social Feed</span>
                  </div>
                  <div className="aspect-square relative overflow-hidden rounded-[2rem] border border-white/10 shadow-xl">
                    <img 
                      src={images.find(img => img.medium === 'social')?.url} 
                      alt="Social" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-6 left-6 right-6 bg-black/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#ff4d00] rounded-full flex items-center justify-center">
                          <Flame className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-sans font-black text-[10px] uppercase tracking-widest text-white">st_bbq_pit</span>
                      </div>
                      <Camera className="w-4 h-4 text-white/20" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : !isGenerating && (
            <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-white/5 rounded-[3rem]">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <Camera className="w-8 h-8 text-white/10" />
              </div>
              <p className="font-sans font-black uppercase tracking-[0.4em] text-[10px] text-white/20">Awaiting the Pitmaster's Command</p>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-32 border-t border-white/5 py-20 px-6 text-center bg-[#050505]">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="flex items-center justify-center gap-4 opacity-20">
            <div className="h-px w-12 bg-white"></div>
            <Flame className="w-5 h-5" />
            <div className="h-px w-12 bg-white"></div>
          </div>
          <p className="text-xl italic text-white/60">
            "I am not a chef – I am better than that. I'm a Pitmaster."
          </p>
          <p className="font-sans text-[9px] uppercase tracking-[0.5em] text-white/20">
            &copy; 2026 S&T BBQ Smokehouse &bull; Authentic Wood-Fired Excellence
          </p>
        </div>
      </footer>
    </div>
  );
}
