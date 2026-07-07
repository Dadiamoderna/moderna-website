import { STORE } from "../config";

export default function Footer() {
  return (
    <footer className="bg-noir text-silver-dim border-t border-line mt-24">
      <div className="mx-auto max-w-7xl px-5 md:px-8 py-14 grid gap-10 md:grid-cols-3">
        <div>
          <div className="font-display text-xl text-platinum mb-3">{STORE.name}</div>
          <p className="text-sm leading-relaxed max-w-xs">{STORE.about}</p>
        </div>
        <div>
          <div className="eyebrow text-platinum mb-3">Contact</div>
          <a
            href={`https://wa.me/${STORE.whatsappNumber}`}
            target="_blank"
            rel="noreferrer"
            className="block text-sm hover:text-brass-light transition-colors"
          >
            WhatsApp
          </a>
          <a
            href={`https://instagram.com/${STORE.instagramHandle}`}
            target="_blank"
            rel="noreferrer"
            className="block text-sm hover:text-brass-light transition-colors mt-1"
          >
            @{STORE.instagramHandle}
          </a>
        </div>
        <div>
          <div className="eyebrow text-platinum mb-3">Moderna</div>
          <a href="/admin" className="block text-sm hover:text-brass-light transition-colors">
            Admin
          </a>
        </div>
      </div>
      <div className="text-center text-xs py-6 border-t border-line">
        © {new Date().getFullYear()} {STORE.name}. All rights reserved.
      </div>
    </footer>
  );
}
