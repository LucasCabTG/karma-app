// Archivo: src/components/layout/Footer.tsx

import { FaInstagram, FaTiktok, FaYoutube } from 'react-icons/fa';

const socialLinks = [
  {
    name: 'Instagram',
    icon: FaInstagram,
    url: 'https://www.instagram.com/karmaseason_', // <-- REEMPLAZAR
  },
  {
    name: 'TikTok',
    icon: FaTiktok,
    url: 'https://www.tiktok.com/@karmaseason_?_t=ZM-8yr2C465jyH&_r=1', // <-- REEMPLAZAR
  },
  {
    name: 'YouTube',
    icon: FaYoutube,
    url: 'https://www.youtube.com/@KarmaSeason', // <-- REEMPLAZAR
  },
];

export function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-black text-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 py-8 px-4 sm:flex-row">
        <p className="text-sm text-gray-400">
          © {new Date().getFullYear()} KARMA. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-6">
          {socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 transition-colors hover:text-white"
              aria-label={link.name}
            >
              <link.icon size={24} />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}