import { CONTACT_CHANNELS, type ContactChannel } from "../types/venue";

type PreferredContactFieldProps = {
    id: string;
    value: ContactChannel | "";
    // The details filled in on the form, so channels without one can be marked as such.
    details: Partial<Record<ContactChannel, string>>;
    onChange: (value: ContactChannel | "") => void;
};

export default function PreferredContactField({ id, value, details, onChange }: PreferredContactFieldProps) {
    return (
        <div>
            <label htmlFor={id}>Preferred contact</label>
            <select id={id} value={value} onChange={(e) => onChange(e.target.value as ContactChannel | "")}>
                <option value="">No preference</option>
                {CONTACT_CHANNELS.map((channel) => (
                    <option key={channel.value} value={channel.value}>
                        {channel.label}
                        {!details[channel.value]?.trim() && " (not added yet)"}
                    </option>
                ))}
            </select>
        </div>
    );
}
