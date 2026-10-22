import type { ReactNode } from "react";
import { FaLink, FaFacebook, FaInstagram, FaEnvelope } from "react-icons/fa";
import type { ContactChannel } from "../types/venue";
import "./SocialLinks.css";

type SocialLinksProps = {
    website?: string;
    instagram?: string;
    facebook?: string;
    email?: string;
    // Highlighted, with the other icons dimmed, so the preferred way in stands out.
    preferred?: ContactChannel | "";
    className?: string;
};

export default function SocialLinks({
    website,
    instagram,
    facebook,
    email,
    preferred = "",
    className = "data-row-links",
}: SocialLinksProps) {
    if (!website && !instagram && !facebook && !email) return null;

    const links: { channel: ContactChannel; href?: string; label: string; icon: ReactNode; external: boolean }[] = [
        { channel: "website", href: website, label: "Website", icon: <FaLink />, external: true },
        { channel: "instagram", href: instagram, label: "Instagram", icon: <FaInstagram />, external: true },
        { channel: "facebook", href: facebook, label: "Facebook", icon: <FaFacebook />, external: true },
        { channel: "email", href: email && `mailto:${email}`, label: "Email", icon: <FaEnvelope />, external: false },
    ];
    const hasPreferred = links.some((link) => link.href && link.channel === preferred);

    return (
        <div className={hasPreferred ? `${className} social-links-has-preferred` : className}>
            {links
                .filter((link) => link.href)
                .map((link) => {
                    const isPreferred = link.channel === preferred;
                    return (
                        <a
                            key={link.channel}
                            href={link.href}
                            className={isPreferred ? "social-link-preferred" : undefined}
                            title={isPreferred ? `${link.label} (preferred)` : link.label}
                            {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        >
                            {link.icon}
                        </a>
                    );
                })}
        </div>
    );
}
