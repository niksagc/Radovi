'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Filter, ShoppingCart, Star } from 'lucide-react';

interface CatalogProps {
  categories: any[];
  items: any[];
}

export default function Catalog({ categories, items }: CatalogProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState<number>(100);
  const [type, setType] = useState<'all' | 'base' | 'addon'>('all');
  const [minPages, setMinPages] = useState<number>(0);
  const [minSlides, setMinSlides] = useState<number>(0);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                            item.description?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategory || item.category_id === selectedCategory;
      const matchesPrice = (item.price_cents / 100) <= maxPrice;
      const matchesType = type === 'all' || item.type === type;
      const matchesPages = !item.max_pages || item.max_pages >= minPages;
      const matchesSlides = !item.max_slides || item.max_slides >= minSlides;

      return matchesSearch && matchesCategory && matchesPrice && matchesType && matchesPages && matchesSlides;
    });
  }, [items, search, selectedCategory, maxPrice, type, minPages, minSlides]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Filters Sidebar */}
      <aside className="lg:col-span-1 space-y-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-zinc-900">Filteri</h2>
          </div>

          <div className="space-y-6">
            {/* Search */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Pretraga</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  type="text" 
                  placeholder="Pretraži usluge..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Kategorija</label>
              <select 
                value={selectedCategory || ''} 
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Sve kategorije</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">Maks. cijena</label>
                <span className="text-sm font-bold text-indigo-600">{maxPrice} €</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="200" 
                step="5"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                className="w-full h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Vrsta usluge</label>
              <div className="flex flex-col gap-2">
                {['all', 'base', 'addon'].map((t) => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="type" 
                      checked={type === t}
                      onChange={() => setType(t as any)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-zinc-300"
                    />
                    <span className="text-sm text-zinc-600 group-hover:text-zinc-900 capitalize">
                      {t === 'all' ? 'Sve' : t === 'base' ? 'Osnovna usluga' : 'Dodatak'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Pages/Slides */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Min. str.</label>
                <input 
                  type="number" 
                  min="0"
                  value={minPages}
                  onChange={(e) => setMinPages(parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Min. slajd.</label>
                <input 
                  type="number" 
                  min="0"
                  value={minSlides}
                  onChange={(e) => setMinSlides(parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Items Grid */}
      <div className="lg:col-span-3">
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredItems.map((item) => (
              <Link 
                key={item.id} 
                href={`/usluge/${item.id}`}
                className="group bg-white p-6 rounded-2xl shadow-sm border border-zinc-200 hover:border-indigo-500 transition-all hover:shadow-md flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-wider">
                    {item.categories?.name}
                  </span>
                  <span className="text-lg font-bold text-zinc-900">
                    {(item.price_cents / 100).toFixed(2)} €
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-zinc-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  {item.name}
                </h3>
                
                <p className="text-zinc-500 text-sm mb-6 line-clamp-2 flex-grow">
                  {item.description}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-zinc-100 mt-auto">
                  <div className="flex items-center gap-4 text-xs font-medium text-zinc-400">
                    {item.max_pages && <span>{item.max_pages} str.</span>}
                    {item.max_slides && <span>{item.max_slides} slajd.</span>}
                    <span>{item.delivery_days} dana</span>
                  </div>
                  <div className="w-8 h-8 bg-zinc-900 text-white rounded-full flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                    <ShoppingCart size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-zinc-200 text-center">
            <Search className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Nema rezultata</h3>
            <p className="text-zinc-500">Pokušajte promijeniti filtere ili pojam za pretragu.</p>
            <button 
              onClick={() => {
                setSearch('');
                setSelectedCategory(null);
                setMaxPrice(100);
                setType('all');
                setMinPages(0);
                setMinSlides(0);
              }}
              className="mt-6 text-indigo-600 font-bold hover:text-indigo-500"
            >
              Poništi sve filtere
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
