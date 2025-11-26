interface KeySlicePreviewProps {
  totalSlices: number
  onSliceClick: (index: number) => void
}

export function KeySlicePreview({ totalSlices, onSliceClick }: KeySlicePreviewProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Key Slices Preview</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: totalSlices }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => onSliceClick(idx)}
            className="relative aspect-[5/2] rounded-sm  hover:border-3 hover:border-primary transition-colors cursor-pointer group"
          >
            <div className="absolute -top-1 left-1 z-10 w-7 h-7 bg-black rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">{idx + 1}</span>
            </div>
            <img
              src="/images/key-slice-template.png"
              alt={`Key slice ${idx + 1} of ${totalSlices}`}
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-primary/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="font-bold text-lg text-white drop-shadow-2xl">Export Slice</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

