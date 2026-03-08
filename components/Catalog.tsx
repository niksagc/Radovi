'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Star, Filter, Search, X } from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  category_id: string;
  type: 'base' | 'addon';
  max_pages: number | null;
  max_slides: number | null;
  is_active: boolean;
}

export default function Catalog({ initialCategories, initialItems }: { initialCategories: Category[], initialItems: Item[] }) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [filteredItems, setFilteredItems] = useState<Item[]>(initialItems);
  const [categories] = useState<Category[]>(initialCategories);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]); // Max 500 EUR
  const [selectedType, setSelectedType] = useState<string>('all');
  const [maxPages, setMaxPages] = useState<number | ''>('');
  const [maxSlides, setMaxSlides] = useState<number | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let result = items;

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(query) || 
        item.description?.toLowerCase().includes(query)
      );
    }

    // Category
    if (selectedCategory !== 'all') {
      result = result.filter(item => item.category_id === selectedCategory);
    }

    // Price Range
    result = result.filter(item => {
      const priceEur = item.price_cents / 100;
      return priceEur >= priceRange[0] && priceEur <= priceRange[1];
    });

    // Type
    if (selectedType !== 'all') {
      result = result.filter(item => item.type === selectedType);
    }

    // Max Pages
    if (maxPages !== '') {
      result = result.filter(item => item.max_pages !== null && item.max_pages <= Number(maxPages));
    }

    // Max Slides
    if (maxSlides !== '') {
      result = result.filter(item => item.max_slides !== null && item.max_slides <= Number(maxSlides));
    }

    setFilteredItems(result);
  }, [items, searchQuery, selectedCategory, priceRange, selectedType, maxPages, maxSlides]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setPriceRange([0, 500]);
    setSelectedType('all');
    setMaxPages('');
    setMaxSlides('');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Mobile Filter Toggle */}
      <button 
        className="lg:hidden flex items-center justify-center gap-2 w-full py-3 bg-white border border-zinc-200 rounded-xl font-medium text-zinc-700"
        onClick={() => setShowFilters(!showFilters)}
      >
        <Filter size={20} />
        {showFilters ? 'Sakrij filtere' : 'Prikaži filtere'}
      </button>

      {/* Sidebar Filters */}
      <aside className={`lg:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 sticky top-24 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-zinc-900">Filteri</h3>
            <button onClick={clearFilters} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
              Očisti sve
            </button>
          </div>

          {/* Search */}
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-2 block">Pretraži</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Naziv usluge..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <Search className="absolute left-3 top-2.5 text-zinc-400 w-4 h-4" />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-2 block">Kategorija</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Sve kategorije</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-2 block">
              Cijena: {priceRange[0]}€ - {priceRange[1]}€
            </label>
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
              className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          {/* Type */}
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-2 block">Vrsta usluge</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm text-zinc-600">
                <input
                  type="radio"
                  name="type"
                  value="all"
                  checked={selectedType === 'all'}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span>Sve</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-zinc-600">
                <input
                  type="radio"
                  name="type"
                  value="base"
                  checked={selectedType === 'base'}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span>Osnovne usluge</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-zinc-600">
                <input
                  type="radio"
                  name="type"
                  value="addon"
                  checked={selectedType === 'addon'}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span>Dodaci</span>
              </label>
            </div>
          </div>

          {/* Max Pages */}
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-2 block">Max stranica</label>
            <input
              type="number"
              min="0"
              placeholder="Npr. 20"
              value={maxPages}
              onChange={(e) => setMaxPages(e.target.value ? Number(e.target.value) : '')}
              className="w-full p-2 border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Max Slides */}
          <div>
            <label className="text-sm font-medium text-zinc-700 mb-2 block">Max slajdova</label>
            <input
              type="number"
              min="0"
              placeholder="Npr. 10"
              value={maxSlides}
              onChange={(e) => setMaxSlides(e.target.value ? Number(e.target.value) : '')}
              className="w-full p-2 border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </aside>

      {/* Results Grid */}
      <div className="flex-1">
        <div className="mb-4 text-sm text-zinc-500">
          Prikazano {filteredItems.length} rezultata
        </div>

        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 flex flex-col relative hover:shadow-md transition-shadow">
                {item.type === 'addon' && (
                  <span className="absolute top-4 right-4 bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-lg">
                    Dodatak
                  </span>
                )}
                <div className="mb-4">
                  <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md mb-2 inline-block">
                    {categories.find(c => c.id === item.category_id)?.name}
                  </span>
                  <h3 className="text-lg font-bold text-zinc-900 pr-16">{item.name}</h3>
                </div>
                
                <p className="text-zinc-500 text-sm mb-4 flex-grow line-clamp-3">{item.description}</p>
                
                <div className="space-y-2 mb-4 text-xs text-zinc-500">
                  {item.max_pages && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-zinc-700">Max str:</span> {item.max_pages}
                    </div>
                  )}
                  {item.max_slides && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-zinc-700">Max slajdova:</span> {item.max_slides}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-100">
                  <span className="text-xl font-bold text-zinc-900">{(item.price_cents / 100).toFixed(2)} €</span>
                  <Link 
                    href={`/usluge/${item.id}`} 
                    className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                  >
                    Detalji
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-zinc-200">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
              <Search size={32} />
            </div>
            <h3 className="text-lg font-medium text-zinc-900 mb-1">Nema rezultata</h3>
            <p className="text-zinc-500">Pokušajte promijeniti filtere ili pretragu.</p>
            <button 
              onClick={clearFilters}
              className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium text-sm"
            >
              Očisti sve filtere
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
