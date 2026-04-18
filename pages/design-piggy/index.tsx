import Index from '../index'

/**
 * Experimental UI at /design-piggy — same data/behavior as home, isolated for Stitch-driven layout.
 * Project: https://stitch.withgoogle.com/projects/14173284532756628243
 */
export default function DesignPiggyPage(props: React.ComponentProps<typeof Index>) {
  return (
    <div
      className="design-piggy-preview relative rounded-2xl ring-1 ring-violet-500/25 shadow-[0_0_40px_-12px_rgba(139,92,246,0.35)] dark:ring-violet-400/20"
      data-design-scope="piggy"
    >
      <p className="sr-only">Design preview route — production home unchanged at /</p>
      <Index {...props} />
    </div>
  )
}

export { getServerSideProps } from '../index'
