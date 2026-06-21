export function BrandLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className='flex h-full w-full items-center justify-center'>
      <div className='flex flex-col items-center gap-4'>
        <div className='relative w-12 h-12'>
          {/* Spinning ring */}
          <div
            className='recall-spin absolute inset-0 rounded-full'
            style={{
              background: 'conic-gradient(from 0deg, #534AB7, #1D9E75, transparent 75%)',
              WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 0)',
              mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 0)',
            }}
          />
          {/* Brand mark */}
          <div
            className='recall-pulse absolute inset-1.5 rounded-lg flex items-center justify-center text-white text-sm font-bold'
            style={{ background: 'linear-gradient(135deg, #534AB7, #1D9E75)' }}
          >
            R
          </div>
        </div>
        <div className='text-xs font-medium tracking-wide text-zinc-400'>{label}</div>
      </div>
    </div>
  )
}
