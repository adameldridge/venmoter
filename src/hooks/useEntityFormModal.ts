import { useRef, useState, useImperativeHandle, type Ref } from "react";

export type EntityFormModalHandle<TEntity> = {
    // onClose runs however the form closes (save, cancel or Escape), e.g. to go back to what opened it.
    open: (entity?: TEntity, options?: { onClose?: () => void }) => void;
};

type UseEntityFormModalOptions<TEntity, TFormValues> = {
    emptyValues: TFormValues;
    toFormValues: (entity: TEntity) => TFormValues;
    onSubmit: (values: TFormValues, editingId: string | null) => Promise<void>;
    onOpen?: (entity?: TEntity) => void;
};

export function useEntityFormModal<TEntity extends { id: string }, TFormValues>(
    ref: Ref<EntityFormModalHandle<TEntity>> | undefined,
    { emptyValues, toFormValues, onSubmit, onOpen }: UseEntityFormModalOptions<TEntity, TFormValues>,
) {
    const modalRef = useRef<HTMLDialogElement>(null);
    const [formValues, setFormValues] = useState<TFormValues>(emptyValues);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const onCloseRef = useRef<(() => void) | undefined>(undefined);

    useImperativeHandle(ref, () => ({
        open(entity, options) {
            onCloseRef.current = options?.onClose;
            setEditingId(entity?.id ?? null);
            setFormValues(entity ? toFormValues(entity) : emptyValues);
            onOpen?.(entity);
            modalRef.current?.showModal();
        },
    }));

    function closeModal() {
        setFormValues(emptyValues);
        setEditingId(null);
        modalRef.current?.close();
    }

    // Skips onClose, e.g. when deleting, since there's nothing to go back to.
    function closeWithoutReturning() {
        onCloseRef.current = undefined;
        closeModal();
    }

    // For the dialog's close event, which also fires on Escape.
    function handleDialogClose() {
        const onClose = onCloseRef.current;
        onCloseRef.current = undefined;
        onClose?.();
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, type, value, checked } = e.target;
        setFormValues((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value,
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

    return { modalRef, formValues, setFormValues, editingId, isSaving, closeModal, closeWithoutReturning, handleDialogClose, handleChange, handleSubmit };
}
