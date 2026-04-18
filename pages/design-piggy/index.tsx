import Index from '../index'

/**
 * Experimental UI at /design-piggy — preview wrapper around the upload voucher home.
 * Project: https://stitch.withgoogle.com/projects/14173284532756628243
 */
export default function DesignPiggyPage() {
  return (
    <div
      className="design-piggy-preview relative rounded-2xl ring-1 ring-violet-500/25 shadow-[0_0_40px_-12px_rgba(139,92,246,0.35)] dark:ring-violet-400/20"
      data-design-scope="piggy"
    >
      <p className="sr-only">Design preview route — production home at /</p>
      <Index />
    </div>
  )
}

export { getServerSideProps } from '../index'
