'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Cookie, Shield, BarChart3, Pause, Play } from 'lucide-react';

interface ProductImage {
  src: string;
  alt: string;
  title: string;
}

interface ProductCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  images: ProductImage[];
}

const productCategories: ProductCategory[] = [
  {
    id: 'cookie',
    name: 'Cookie Consent',
    icon: <Cookie className="h-4 w-4" />,
    color: 'blue',
    images: [
      { src: '/product-images/cocokie-overview.png', alt: 'Cookie Consent Overview', title: 'Cookie Dashboard Overview' },
      { src: '/product-images/cookie-records.png', alt: 'Cookie Consent Records', title: 'Consent Records & History' },
      { src: '/product-images/cookie-scanner.png', alt: 'Cookie Scanner', title: 'Automated Cookie Scanner' },
    ],
  },
  {
    id: 'dpdpa',
    name: 'DPDPA Compliance',
    icon: <Shield className="h-4 w-4" />,
    color: 'purple',
    images: [
      { src: '/product-images/dpdpa-dashboard.png', alt: 'DPDPA Dashboard', title: 'DPDPA Compliance Dashboard' },
      { src: '/product-images/dpdpa-consentrecords.png', alt: 'DPDPA Consent Records', title: 'Data Principal Consent Records' },
      { src: '/product-images/dpdpa-widgetconfig.png', alt: 'DPDPA Widget Config', title: 'Widget Configuration' },
      { src: '/product-images/processing-activities.png', alt: 'Processing Activities', title: 'Data Processing Activities' },
    ],
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    icon: <BarChart3 className="h-4 w-4" />,
    color: 'green',
    images: [
      { src: '/product-images/reports-analytics.png', alt: 'Reports Analytics', title: 'Comprehensive Analytics' },
      { src: '/product-images/reports-analytics2.png', alt: 'Reports Analytics 2', title: 'Detailed Compliance Reports' },
    ],
  },
];

const colorVariants = {
  blue: {
    bg: 'bg-blue-500',
    bgLight: 'bg-blue-100',
    text: 'text-blue-600',
    border: 'border-blue-500',
    ring: 'ring-blue-500',
    gradient: 'from-blue-500 to-blue-600',
  },
  purple: {
    bg: 'bg-purple-500',
    bgLight: 'bg-purple-100',
    text: 'text-purple-600',
    border: 'border-purple-500',
    ring: 'ring-purple-500',
    gradient: 'from-purple-500 to-purple-600',
  },
  green: {
    bg: 'bg-green-500',
    bgLight: 'bg-green-100',
    text: 'text-green-600',
    border: 'border-green-500',
    ring: 'ring-green-500',
    gradient: 'from-green-500 to-green-600',
  },
};

// Full Product Showcase with Category Tabs
export function ProductShowcase() {
  const [activeCategory, setActiveCategory] = useState(productCategories[0]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextImage = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex((prev) => (prev + 1) % activeCategory.images.length);
      setIsTransitioning(false);
    }, 150);
  }, [activeCategory.images.length]);

  const prevImage = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex((prev) => (prev - 1 + activeCategory.images.length) % activeCategory.images.length);
      setIsTransitioning(false);
    }, 150);
  }, [activeCategory.images.length]);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [activeCategory]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextImage, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextImage]);

  const colors = colorVariants[activeCategory.color as keyof typeof colorVariants];

  return (
    <div className="w-full">
      {/* Category Tabs */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
        {productCategories.map((category) => {
          const catColors = colorVariants[category.color as keyof typeof colorVariants];
          const isActive = activeCategory.id === category.id;
          return (
            <button
              key={category.id}
              onClick={() => {
                setActiveCategory(category);
                setIsAutoPlaying(true);
              }}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300
                ${isActive 
                  ? `bg-gradient-to-r ${catColors.gradient} text-white shadow-lg scale-105` 
                  : `${catColors.bgLight} ${catColors.text} hover:scale-105`
                }
              `}
            >
              {category.icon}
              <span className="hidden sm:inline">{category.name}</span>
              <span className="sm:hidden">{category.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Image Display */}
      <div className="relative group">
        {/* Browser Chrome */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-100 to-gray-50 px-4 py-3 flex items-center gap-3 border-b border-gray-200">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400 hover:bg-red-500 transition-colors cursor-pointer"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400 hover:bg-yellow-500 transition-colors cursor-pointer"></div>
              <div className="w-3 h-3 rounded-full bg-green-400 hover:bg-green-500 transition-colors cursor-pointer"></div>
            </div>
            <div className="flex-1 bg-white rounded-lg px-4 py-1.5 text-xs sm:text-sm text-gray-500 flex items-center gap-2 shadow-inner">
              <span className="text-green-600">🔒</span>
              consently.in/dashboard
            </div>
            {/* Auto-play toggle */}
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
              title={isAutoPlaying ? 'Pause slideshow' : 'Play slideshow'}
            >
              {isAutoPlaying ? (
                <Pause className="h-4 w-4 text-gray-500" />
              ) : (
                <Play className="h-4 w-4 text-gray-500" />
              )}
            </button>
          </div>

          {/* Image Container */}
          <div className="relative aspect-[16/10] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
            <div className={`absolute inset-0 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
              <Image
                src={activeCategory.images[currentImageIndex].src}
                alt={activeCategory.images[currentImageIndex].alt}
                fill
                className="object-contain p-2 sm:p-4"
                priority
              />
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={() => {
                prevImage();
                setIsAutoPlaying(false);
              }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-white/90 shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 z-10"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
            </button>
            <button
              onClick={() => {
                nextImage();
                setIsAutoPlaying(false);
              }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-white/90 shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 z-10"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700" />
            </button>
          </div>

          {/* Image Title & Dots */}
          <div className="bg-white px-4 py-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h4 className="text-sm sm:text-base font-semibold text-gray-800">
                {activeCategory.images[currentImageIndex].title}
              </h4>
              <div className="flex gap-2">
                {activeCategory.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentImageIndex(index);
                      setIsAutoPlaying(false);
                    }}
                    className={`
                      h-2 rounded-full transition-all duration-300
                      ${index === currentImageIndex 
                        ? `w-6 ${colors.bg}` 
                        : 'w-2 bg-gray-300 hover:bg-gray-400'
                      }
                    `}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Image Carousel for specific sections
interface ImageCarouselProps {
  images: ProductImage[];
  color?: 'blue' | 'purple' | 'green';
  autoPlayInterval?: number;
}

export function ImageCarousel({ images, color = 'blue', autoPlayInterval = 3500 }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextImage = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
      setIsTransitioning(false);
    }, 150);
  }, [images.length]);

  useEffect(() => {
    const interval = setInterval(nextImage, autoPlayInterval);
    return () => clearInterval(interval);
  }, [nextImage, autoPlayInterval]);

  const colors = colorVariants[color];

  return (
    <div className="relative rounded-xl overflow-hidden shadow-2xl border-2 border-white/20">
      <div className="relative aspect-[16/10] bg-white/10 backdrop-blur-sm">
        <div className={`absolute inset-0 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          <Image
            src={images[currentIndex].src}
            alt={images[currentIndex].alt}
            fill
            className="object-contain p-2"
          />
        </div>
      </div>
      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`
              h-2 rounded-full transition-all duration-300
              ${index === currentIndex 
                ? 'w-6 bg-white' 
                : 'w-2 bg-white/50 hover:bg-white/70'
              }
            `}
          />
        ))}
      </div>
    </div>
  );
}

// Hero Section Carousel - Shows all images in a continuous loop
export function HeroCarousel() {
  const allImages = productCategories.flatMap(cat => cat.images);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextImage = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % allImages.length);
      setIsTransitioning(false);
    }, 200);
  }, [allImages.length]);

  useEffect(() => {
    const interval = setInterval(nextImage, 3000);
    return () => clearInterval(interval);
  }, [nextImage]);

  // Find which category this image belongs to
  const getCurrentCategory = () => {
    let count = 0;
    for (const cat of productCategories) {
      if (currentIndex < count + cat.images.length) {
        return cat;
      }
      count += cat.images.length;
    }
    return productCategories[0];
  };

  const currentCategory = getCurrentCategory();
  const colors = colorVariants[currentCategory.color as keyof typeof colorVariants];

  return (
    <div className="rounded-2xl border-4 border-blue-200 shadow-2xl overflow-hidden bg-white">
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 sm:p-6">
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Browser Chrome */}
          <div className="bg-gray-100 px-4 py-3 flex items-center gap-3 border-b border-gray-200">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="flex-1 bg-white rounded-lg px-4 py-1.5 text-xs sm:text-sm text-gray-600 flex items-center gap-2">
              <span className="text-green-600">🔒</span>
              consently.in/dashboard
            </div>
          </div>

          {/* Image */}
          <div className="relative aspect-[16/10] bg-gradient-to-b from-white to-gray-50 overflow-hidden">
            <div className={`absolute inset-0 transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
              <Image
                src={allImages[currentIndex].src}
                alt={allImages[currentIndex].alt}
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Footer with title and category badge */}
          <div className="px-4 py-3 bg-white border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bgLight} ${colors.text}`}>
                {currentCategory.icon}
                {currentCategory.name}
              </span>
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                {allImages[currentIndex].title}
              </span>
            </div>
            {/* Progress dots */}
            <div className="flex gap-1.5">
              {allImages.map((_, index) => (
                <div
                  key={index}
                  className={`
                    h-1.5 rounded-full transition-all duration-300
                    ${index === currentIndex 
                      ? `w-4 ${colors.bg}` 
                      : 'w-1.5 bg-gray-300'
                    }
                  `}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

