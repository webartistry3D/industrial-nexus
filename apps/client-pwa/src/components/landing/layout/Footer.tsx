import { Link, Mail } from "lucide-react";

const footerLinks = {
  Company: ["About Us", "Careers", "Blog", "Press"],
  Solutions: [
    "Control Tower",
    "Weight Watch",
    "Driver PWA",
    "Client Portal",
    "Analytics",
  ],
  Industries: [
    "Manufacturing",
    "Distribution",
    "Warehousing",
    "Industrial Suppliers",
  ],
  Resources: ["Documentation", "API Reference", "Support", "Contact"],
};

export function Footer() {
  return (
    <footer
      className="bg-[#0D1D35] border-t border-[rgba(150,180,220,0.12)]"
      role="contentinfo"
    >
      <div className="max-w-[1180px] mx-auto px-6 pt-16 pb-10">
        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-[5px] bg-gradient-to-br from-[#E85D04] to-[#FF7800] flex items-center justify-center text-white text-xs font-black">
                IN
              </div>
              <span className="font-bold text-white">Industrial Nexus</span>
            </div>
            <p className="text-sm text-[#8A9BB5] leading-relaxed mb-6 max-w-[240px]">
              Keeping Industry Moving. Operational infrastructure for industrial
              logistics across the Lagos–Ogun corridor.
            </p>
            <div className="flex gap-2">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-9 h-9 rounded-lg bg-[rgba(150,180,220,0.06)] border border-[rgba(150,180,220,0.12)] flex items-center justify-center text-[#8A9BB5] hover:text-white hover:border-[rgba(150,180,220,0.25)] transition-colors"
              >
                <Link size={15} />
              </a>
              <a
                href="mailto:hello@industrialnexus.io"
                aria-label="Email"
                className="w-9 h-9 rounded-lg bg-[rgba(150,180,220,0.06)] border border-[rgba(150,180,220,0.12)] flex items-center justify-center text-[#8A9BB5] hover:text-white hover:border-[rgba(150,180,220,0.25)] transition-colors"
              >
                <Mail size={15} />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#C8D4E3] mb-4">
                {heading}
              </h3>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href={
                        link === "Contact"
                          ? "mailto:hello@industrialnexus.io"
                          : "#"
                      }
                      className="text-sm text-[#8A9BB5] hover:text-[#C8D4E3] transition-colors inline-flex items-center gap-1 group"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[rgba(150,180,220,0.1)] pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-[#8A9BB5]">
            © 2024 Industrial Nexus Technologies Ltd. Lagos, Nigeria. All rights
            reserved.
          </p>
          <div className="flex items-center gap-6">
            {["Privacy Policy", "Terms of Service", "Security"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-xs text-[#8A9BB5] hover:text-[#C8D4E3] transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
