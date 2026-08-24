import { useEffect, useRef, useState } from "react";
import { FaEllipsisV } from "react-icons/fa";
import "./CardMenu.css";

export type CardMenuItem = {
    label: string;
    onClick: () => void;
    danger?: boolean;
};

type CardMenuProps = {
    items: CardMenuItem[];
};

export default function CardMenu({ items }: CardMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    function handleItemClick(item: CardMenuItem) {
        setIsOpen(false);
        item.onClick();
    }

    return (
        <div className="card-menu" ref={menuRef}>
            <button
                className="card-menu-trigger"
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                aria-label="Open menu"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <FaEllipsisV />
            </button>
            {isOpen && (
                <div className="card-menu-dropdown">
                    {items.map((item) => (
                        <button
                            key={item.label}
                            className={item.danger ? "card-menu-item card-menu-item-danger" : "card-menu-item"}
                            type="button"
                            onClick={() => handleItemClick(item)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
