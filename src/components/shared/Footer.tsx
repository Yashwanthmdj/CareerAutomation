import { Link } from "@tanstack/react-router";
import { Sparkles, Github, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative mt-32 border-t border-white/5">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2">
            <div className="relative h-7 w-7 rounded-md bg-gradient-to-br from-indigo-400 to-violet-600 shadow-[0_0_24px_rgba(99,102,241,0.55)]">
              <div className="absolute inset-[3px] rounded-[5px] bg-[#050816]/70 grid place-items-center">
                <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
              </div>
            </div>
            <span className="font-display text-[15px] font-semibold text-white">Nexus</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm text-white/50">
            The autonomous career operating system. Your career, on autopilot.
          </p>
          <div className="mt-5 flex gap-3 text-white/40">
            <a href="https://x.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors"><Twitter className="h-4 w-4" /></a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors"><Github className="h-4 w-4" /></a>
            <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors"><Linkedin className="h-4 w-4" /></a>
          </div>
        </div>
        {[
          { title: "Product", items: [["Features","/features"],["Pricing","/pricing"],["Integrations","/integrations"],["Dashboard","/app"]] },
          { title: "Company", items: [["Waitlist","/waitlist"],["Help","/help"],["Login","/login"],["Sign up","/signup"]] },
          { title: "Legal", items: [["Privacy","/help"],["Terms","/help"],["Security","/help"]] },
        ].map((col) => (
          <div key={col.title}>
            <div className="text-xs uppercase tracking-[0.18em] text-white/40">{col.title}</div>
            <ul className="mt-4 space-y-2">
              {col.items.map(([label, href]) => (
                <li key={label}>
                  <Link to={href as string} className="text-sm text-white/70 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/5 py-6 text-center text-xs text-white/30">
        © 2026 Nexus Labs · Built with intent.
      </div>
    </footer>
  );
}