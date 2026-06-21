import { BrandLoader } from '@/components/BrandLoader'

export default function Loading() {
  return (
    <div className='h-full' style={{ background: '#FAFAF9' }}>
      <BrandLoader label='Recalling…' />
    </div>
  )
}
