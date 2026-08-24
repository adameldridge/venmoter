import type { ReactNode } from "react";

type ListHeaderProps = {
    canEdit: boolean;
    addLabel: string;
    onAdd: () => void;
    children: ReactNode;
};

export default function ListHeader({ canEdit, addLabel, onAdd, children }: ListHeaderProps) {
    return (
        <div className="list-header">
            {children}
            {canEdit && (
                <button className="create-button" type="button" onClick={onAdd}>
                    {addLabel}
                </button>
            )}
        </div>
    );
}
