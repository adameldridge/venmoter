import type { ReactNode } from "react";

type ListHeaderProps = {
    addLabel: string;
    onAdd: () => void;
    children: ReactNode;
};

export default function ListHeader({ addLabel, onAdd, children }: ListHeaderProps) {
    return (
        <div className="list-header">
            {children}
            <button className="create-button" type="button" onClick={onAdd}>
                {addLabel}
            </button>
        </div>
    );
}
