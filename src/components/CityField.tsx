const OTHER_CITY = "__other__";

type CityFieldProps = {
    id: string;
    // Cities to pick from, e.g. those the venues are in.
    cities: string[];
    value: string;
    // Whether "Other city…" is chosen, so the free-text box shows. Kept by the form so it can
    // reset it each time the form opens.
    isOther: boolean;
    onChange: (city: string, isOther: boolean) => void;
};

// Pick a known city, or choose "Other city…" and type a new one.
export default function CityField({ id, cities, value, isOther, onChange }: CityFieldProps) {
    return (
        <>
            <div>
                <label htmlFor={id}>City *</label>
                <select
                    id={id}
                    required
                    value={isOther ? OTHER_CITY : value}
                    onChange={(e) => {
                        const choice = e.target.value;
                        onChange(choice === OTHER_CITY ? "" : choice, choice === OTHER_CITY);
                    }}
                >
                    <option value="" disabled>Choose a city…</option>
                    {cities.map((city) => (
                        <option value={city} key={city}>{city}</option>
                    ))}
                    <option value={OTHER_CITY}>Other city…</option>
                </select>
            </div>

            {isOther && (
                <div>
                    <label htmlFor={`${id}Other`}>City name *</label>
                    <input
                        id={`${id}Other`}
                        type="text"
                        required
                        autoFocus
                        autoComplete="off"
                        value={value}
                        onChange={(e) => onChange(e.target.value, true)}
                    />
                </div>
            )}
        </>
    );
}
