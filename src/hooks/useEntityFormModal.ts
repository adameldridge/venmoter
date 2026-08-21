import { useRef, useState, useImperativeHandle, type Ref } from "react";

export type EntityFormModalHandle<TEntity> = {
    open: (entity?: TEntity) => void;
};

type UseEntityFormModalOptions<TEntity, TFormValues> = {
    emptyValues: TFormValues;
    toFormValues: (entity: TEntity) => TFormValues;
    onSubmit: (values: TFormValues, editingId: string | null) => Promise<void>;
};

export function useEntityFormModal<TEntity extends { id: string }, TFormValues>(
    ref: Ref<EntityFormModalHandle<TEntity>>,
    { emptyValues, toFormValues, onSubmit }: UseEntityFormModalOptions<TEntity, TFormValues>,
) {
    const modalRef = useRef<HTMLDialogElement>(null);
    const [formValues, setFormValues] = useState<TFormValues>(emptyValues);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useImperativeHandle(ref, () => ({
        open(entity) {
            setEditingId(entity?.id ?? null);
            setFormValues(entity ? toFormValues(entity) : emptyValues);
            modalRef.current?.showModal();
        },
    }));

    function closeModal() {
        setFormValues(emptyValues);
        setEditingId(null);
        modalRef.current?.close();
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setFormValues((current) => ({
            ...current,
            [e.target.name]: e.target.value,
        }));
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSubmit(formValues, editingId);
            closeModal();
        } catch (error) {
            console.error("Error saving:", error);
        } finally {
            setIsSaving(false);
        }
    }

    return { modalRef, formValues, editingId, isSaving, closeModal, handleChange, handleSubmit };
}
