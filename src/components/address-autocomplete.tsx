"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Search, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

interface AddressAutocompleteProps {
    label: string;
    placeholder: string;
    value: string;
    onChange: (address: string, url: string) => void;
    required?: boolean;
    icon?: React.ReactNode;
}

interface PhotonFeature {
    properties: {
        name: string;
        city?: string;
        country?: string;
        state?: string;
    };
    geometry: {
        coordinates: [number, number];
    };
}

export default function AddressAutocomplete({
    label,
    placeholder,
    value,
    onChange,
    required = false,
    icon = <MapPin className="h-4 w-4" />
}: AddressAutocompleteProps) {
    const [input, setInput] = useState(value);
    const [suggestions, setSuggestions] = useState<PhotonFeature[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const debouncedInput = useDebounce(input, 500);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (debouncedInput.length < 3) {
            setSuggestions([]);
            return;
        }

        const fetchSuggestions = async () => {
            setLoading(true);
            try {
                const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(debouncedInput)}&limit=5`);
                const data = await res.json();
                setSuggestions(data.features || []);
                setIsOpen(true);
            } catch (err) {
                console.error("Autocomplete fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestions();
    }, [debouncedInput]);

    const handleSelect = (feature: PhotonFeature) => {
        const { name, city, state, country } = feature.properties;
        const addressParts = [name, city, state, country].filter(Boolean);
        const displayName = addressParts.join(", ");

        const [lon, lat] = feature.geometry.coordinates;
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;

        setInput(displayName);
        onChange(displayName, googleMapsUrl);
        setIsOpen(false);
    };

    return (
        <div className="space-y-2 relative" ref={containerRef}>
            <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                {icon} {label}
            </label>
            <div className="relative">
                <input
                    required={required}
                    type="text"
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        if (e.target.value === "") {
                            onChange("", "");
                        }
                    }}
                    onFocus={() => input.length >= 3 && setIsOpen(true)}
                    className="w-full rounded-2xl bg-zinc-800 border-0 py-4 px-5 pr-12 text-white ring-1 ring-zinc-700 focus:ring-2 focus:ring-orange-500 transition-all shadow-lg"
                    placeholder={placeholder}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {loading ? (
                        <Loader2 className="h-4 w-4 text-zinc-500 animate-spin" />
                    ) : (
                        <Search className="h-4 w-4 text-zinc-500" />
                    )}
                </div>
            </div>

            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-[60] w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {suggestions.map((feature, index) => {
                        const { name, city, country } = feature.properties;
                        return (
                            <button
                                key={index}
                                type="button"
                                onClick={() => handleSelect(feature)}
                                className="w-full text-left px-5 py-3 hover:bg-zinc-800 transition-colors border-b border-zinc-800/50 last:border-0"
                            >
                                <p className="text-sm font-bold text-white mb-0.5">{name}</p>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                    {[city, country].filter(Boolean).join(" • ")}
                                </p>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
