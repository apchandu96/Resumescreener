
export default function Footer() {
  return (
    <footer role="contentinfo" className="mt-10 footerbar border-top border-[#d2460e]">
      <div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[15px] md:text-base">
        <p className="text-sm md:text-base">&copy; {new Date().getFullYear()} CV Craft</p>
        <nav aria-label="Footer" className="flex gap-2">
          <a href="/" className="px-3 py-2 rounded-xl hover:bg-[#ff6a33]">Home</a>
          <a href="mailto:contact@gopichandu.com" className="px-3 py-2 rounded-xl hover:bg-[#ff6a33]">Contact</a>
        </nav>
      </div>
    </footer>
  )
}
