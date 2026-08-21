import { FaLink, FaFacebook, FaInstagram, FaEnvelope } from "react-icons/fa";

type SocialLinksProps = {
    website?: string;
    instagram?: string;
    facebook?: string;
    email?: string;
    className?: string;
};

export default function SocialLinks({
    website,
    instagram,
    facebook,
    email,
    className = "entity-card-social-icons",
}: SocialLinksProps) {
    if (!website && !instagram && !facebook && !email) return null;

    return (
        <div className={className}>
            {website && (
                <a href={website} target="_blank" rel="noopener noreferrer">
                    <FaLink />
                </a>
            )}
            {instagram && (
                <a href={instagram} target="_blank" rel="noopener noreferrer">
                    <FaInstagram />
                </a>
            )}
            {facebook && (
                <a href={facebook} target="_blank" rel="noopener noreferrer">
                    <FaFacebook />
                </a>
            )}
            {email && (
                <a href={`mailto:${email}`}>
                    <FaEnvelope />
                </a>
            )}
        </div>
    );
}
