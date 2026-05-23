import React from 'react';

export const SkeletonLine = ({ className = "" }) => (
  <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`}></div>
);

export const TableSkeleton = ({ rows = 5, cols = 5 }) => (
  <div className="w-full space-y-4">
    {/* Header Skeleton row */}
    <div className="flex gap-4 pb-2 border-b border-slate-100">
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonLine key={i} className="h-4 flex-grow" />
      ))}
    </div>
    
    {/* Body Skeleton rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4 items-center">
        {Array.from({ length: cols }).map((_, j) => (
          <SkeletonLine key={j} className="h-6 flex-grow" />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton = () => (
  <div className="p-5 border border-slate-100 bg-white rounded-2xl shadow-sm space-y-4">
    <div className="flex justify-between items-center">
      <SkeletonLine className="h-3 w-20" />
      <SkeletonLine className="h-7 w-7 rounded-lg" />
    </div>
    <SkeletonLine className="h-6 w-16" />
    <SkeletonLine className="h-2 w-32" />
  </div>
);

export const ProductCardSkeleton = () => (
  <div className="border border-slate-100 bg-white rounded-2xl p-4 space-y-3">
    <SkeletonLine className="h-36 w-full" />
    <SkeletonLine className="h-3 w-1/4" />
    <SkeletonLine className="h-4 w-3/4" />
    <div className="flex justify-between items-center">
      <SkeletonLine className="h-5 w-1/4" />
      <SkeletonLine className="h-6 w-1/3 rounded-lg" />
    </div>
  </div>
);
