import React from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

const DataTable = ({ 
  headers, 
  items, 
  isLoading, 
  totalItems, 
  page, 
  pages, 
  onPageChange, 
  searchQuery, 
  onSearchChange,
  searchPlaceholder = "Search..."
}) => {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col animate-slide-in">
      {/* Filter and Summary Header */}
      {onSearchChange && (
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50/20">
          <div className="relative w-full max-w-xs">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 pr-4 py-1.5 w-full border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          {totalItems !== undefined && (
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider bg-slate-50 px-2.5 py-1 rounded-full border border-slate-150">
              {totalItems} records found
            </span>
          )}
        </div>
      )}

      {/* Responsive Horizontal Scroll Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] text-slate-500 font-bold uppercase tracking-wider select-none">
              {headers.map((h, i) => (
                <th 
                  key={i} 
                  className={`px-6 py-3.5 ${h.align === 'right' ? 'text-right' : h.align === 'center' ? 'text-center' : 'text-left'}`}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
            {isLoading ? (
              <tr>
                <td colSpan={headers.length} className="px-6 py-12 text-center">
                  <div className="flex justify-center items-center gap-1.5 text-emerald-600">
                    <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-6 py-12 text-center text-slate-400 font-semibold">
                  No records matching requirements.
                </td>
              </tr>
            ) : (
              items.map((item, rowIdx) => (
                <tr key={item.id || rowIdx} className="hover:bg-slate-50/30 transition-colors duration-150">
                  {headers.map((h, colIdx) => (
                    <td 
                      key={colIdx} 
                      className={`px-6 py-4 whitespace-nowrap ${h.align === 'right' ? 'text-right' : h.align === 'center' ? 'text-center' : 'text-left'}`}
                    >
                      {h.render ? h.render(item) : item[h.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {pages > 1 && (
        <div className="px-6 py-3 bg-slate-50/55 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-bold select-none">
            Page {page} of {pages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 disabled:opacity-40 disabled:pointer-events-none transition-colors scale-100 active:scale-95 duration-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= pages}
              className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 disabled:opacity-40 disabled:pointer-events-none transition-colors scale-100 active:scale-95 duration-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
