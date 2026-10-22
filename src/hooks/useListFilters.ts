import { useEffect, useState } from "react";

// City and search filters for one list. "" means all cities. The search is debounced so the
// list doesn't refilter on every keystroke.
export function useListFilters() {
    const [city, setCity] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const timeoutId = setTimeout(() => setSearchTerm(searchInput), 300);
        return () => clearTimeout(timeoutId);
    }, [searchInput]);

    function matchesSearch(name: string) {
        return name.toLowerCase().includes(searchTerm.trim().toLowerCase());
    }

    return { city, setCity, searchInput, setSearchInput, matchesSearch };
}
