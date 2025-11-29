// Visual marker icons for each theme (same as SliceTemplate)
const visualMarkerIcons: Record<string, string[]> = {
  pizza: ['🍕', '🍄', '🧅', '🫒', '🌶️', '🥓', '🧀', '🍅', '🌿', '🥬', '🫑', '🥒', '🌽', '🥕', '🥔', '🥑', '🥩', '🍖', '🦐', '🦑', '🐟', '🐠'],
  cosmos: ['🪐', '⭐', '🌟', '✨', '💫', '🌙', '☀️', '🌍', '🌎', '🌏', '🔭', '🛸', '👽', '🚀', '🌌', '🌠', '☄️', '🌑', '🌒', '🌓', '🌔', '🌕'],
  primates: ['🦍', '🦧', '🐵', '🙈', '🙉', '🙊', '🐒', '🦝', '🦁', '🐯', '🐅', '🐆', '🐴', '🦄', '🦓', '🦌', '🦬', '🐂', '🐃', '🐄', '🐎', '🐖'],
  vehicles: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '🛼', '🚁', '✈️'],
  furniture: ['🪑', '🛋️', '🛏️', '🪣', '🪤', '🪆', '🪡', '🪢', '🪣', '🪝', '🪟', '🪞', '🪟', '🪠', '🪡', '🪢', '🪣', '🪝', '🪟', '🪞', '🪟', '🪠'],
  instruments: ['🎸', '🎹', '🥁', '🎺', '🎷', '🎤', '🎧', '🎵', '🎶', '🎼', '🎻', '🪘', '🪗', '🪕', '🎹', '🥁', '🎺', '🎷', '🎤', '🎧', '🎵', '🎶'],
  trees: ['🌳', '🌲', '🌴', '🌵', '🌱', '🌿', '☘️', '🍀', '🍃', '🍂', '🍁', '🌾', '🌺', '🌻', '🌷', '🌹', '🥀', '🌼', '🌸', '🌍', '🌎', '🌏'],
  colors: ['🎨', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜', '🟫', '🔶', '🔷', '🔸'],
  shapes: ['🔷', '🔶', '🔸', '🔹', '🔺', '🔻', '💠', '🔳', '🔲', '⚪', '⚫', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '🟥', '🟧', '🟨', '🟩', '🟦'],
  tools: ['🔨', '🪓', '⛏️', '🪚', '🔧', '🪛', '🔩', '⚙️', '🪤', '🧰', '🧲', '🪜', '⚒️', '🛠️', '🗡️', '⚔️', '🔪', '🗡️', '⚔️', '🪓', '⛏️', '🪚'],
}

function getVisualMarkerIcon(theme: string, sliceNumber: number): string {
  const icons = visualMarkerIcons[theme] || visualMarkerIcons.pizza
  return icons[(sliceNumber - 1) % icons.length]
}

interface KeySlicePreviewProps {
  totalSlices: number
  visualMarker: string
  slices: Array<{ share: string; qrCode: string; index: number }>
  onSliceClick: (index: number) => void
}

export function KeySlicePreview({ totalSlices, visualMarker, slices, onSliceClick }: KeySlicePreviewProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Key Slices Preview</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: totalSlices }).map((_, idx) => {
          const slice = slices[idx]
          const markerIcon = getVisualMarkerIcon(visualMarker, idx + 1)
          
          return (
            <button
              key={idx}
              onClick={() => onSliceClick(idx)}
              className="relative aspect-[5/2] rounded-sm border-2 border-border hover:border-primary transition-colors cursor-pointer group bg-white overflow-hidden"
            >
              {/* Mini template preview */}
              <div className="absolute inset-0 p-2 flex flex-col text-xs" style={{ fontFamily: 'Times New Roman, serif' }}>
                <div className="flex justify-between items-start border-b border-black pb-1 mb-1">
                  <div>
                    <div className="font-bold text-[10px] uppercase">key slice {idx + 1} of {totalSlices}</div>
                    <div className="text-2xl leading-none mt-0.5">{markerIcon}</div>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  {slice ? (
                    <>
                      <div className="text-[8px] font-bold uppercase border-b border-black">key slice data</div>
                      <div className="text-[7px] font-mono truncate">{slice.share.substring(0, 40)}...</div>
                      {slice.qrCode && (
                        <img src={slice.qrCode} alt="QR" className="w-8 h-8 object-contain self-end" />
                      )}
                    </>
                  ) : (
                    <div className="text-[8px] text-muted-foreground italic">Generating...</div>
                  )}
                </div>
              </div>
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-primary/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <span className="font-bold text-lg text-white drop-shadow-2xl">View Slice</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

