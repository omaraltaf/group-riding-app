"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Search, Loader2, X, Check, Navigation } from "lucide-react";
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import { useDebounce } from "@/hooks/use-debounce";

interface LocationPickerProps {
    label: string;
    placeholder: string;
    value: string;
    onChange: (address: string, url: string) => void;
    required?: boolean;
    icon?: React.ReactNode;
}

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places"];

export default function LocationPicker({
    label,
    placeholder,
    value,
    onChange,
    icon = <MapPin className="h-4 w-4" />
}: LocationPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [selectedPlace, setSelectedPlace] = useState<{
        address: string;
        lat: number;
        lng: number;
    } | null>(null);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [mapCenter, setMapCenter] = useState({ lat: 25.2048, lng: 55.2708 }); // Default to Dubai or similar
    const [markerPos, setMarkerPos] = useState<{ lat: number; lng: number } | null>(null);

    const debouncedSearch = useDebounce(searchQuery, 300);
    const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
    const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
    const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries,
    });

    // Initialize services
    useEffect(() => {
        if (isLoaded && !autocompleteServiceRef.current) {
            autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
            // PlacesService needs a div or map instance
            const dummyDiv = document.createElement("div");
            placesServiceRef.current = new google.maps.places.PlacesService(dummyDiv);
        }
    }, [isLoaded]);

    // Handle session token generation
    const getSessionToken = () => {
        if (!sessionTokenRef.current) {
            sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
        }
        return sessionTokenRef.current;
    };

    const clearSessionToken = () => {
        sessionTokenRef.current = null;
    };

    // Fetch suggestions
    useEffect(() => {
        if (!debouncedSearch || debouncedSearch.length < 3 || !autocompleteServiceRef.current) {
            setSuggestions([]);
            return;
        }

        setLoadingSuggestions(true);
        autocompleteServiceRef.current.getPlacePredictions(
            {
                input: debouncedSearch,
                sessionToken: getSessionToken(),
            },
            (predictions, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                    setSuggestions(predictions);
                } else {
                    setSuggestions([]);
                }
                setLoadingSuggestions(false);
            }
        );
    }, [debouncedSearch]);

    const handleSelectSuggestion = (prediction: google.maps.places.AutocompletePrediction) => {
        if (!placesServiceRef.current) return;

        setLoadingSuggestions(true);
        placesServiceRef.current.getDetails(
            {
                placeId: prediction.place_id,
                fields: ["name", "formatted_address", "geometry"],
                sessionToken: getSessionToken(),
            },
            (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry?.location) {
                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();
                    const address = place.formatted_address || place.name || "";

                    setSelectedPlace({ address, lat, lng });
                    setMarkerPos({ lat, lng });
                    setMapCenter({ lat, lng });
                    setSearchQuery(address);
                    setSuggestions([]);
                    clearSessionToken(); // Recycle token after successful Place Details
                }
                setLoadingSuggestions(false);
            }
        );
    };

    const handleMapClick = (e: google.maps.MapMouseEvent) => {
        if (!e.latLng || !placesServiceRef.current) return;

        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        setMarkerPos({ lat, lng });

        // Reverse geocode to get address
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === "OK" && results && results[0]) {
                const address = results[0].formatted_address;
                setSelectedPlace({ address, lat, lng });
                setSearchQuery(address);
            }
        });
    };

    const handleConfirm = () => {
        if (selectedPlace) {
            const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${selectedPlace.lat},${selectedPlace.lng}`;
            onChange(selectedPlace.address, googleMapsUrl);
            setIsOpen(false);
        }
    };

    if (!isLoaded) return <div className="h-14 w-full bg-zinc-800 animate-pulse rounded-2xl" />;

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                {icon} {label}
            </label>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="w-full text-left rounded-2xl bg-zinc-800 border-0 py-4 px-5 text-white ring-1 ring-zinc-700 hover:ring-orange-500 transition-all shadow-lg flex justify-between items-center group"
            >
                <span className={value ? "text-white" : "text-zinc-500"}>
                    {value || placeholder}
                </span>
                <Search className="h-4 w-4 text-zinc-500 group-hover:text-orange-500 transition-colors" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10">
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    <div className="relative w-full max-w-4xl max-h-full bg-zinc-900 rounded-[32px] overflow-hidden flex flex-col shadow-2xl ring-1 ring-zinc-800">
                        {/* Header */}
                        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-500/10 rounded-xl">
                                    <MapPin className="h-6 w-6 text-orange-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">Pick Location</h2>
                                    <p className="text-xs text-zinc-500">Search or click anywhere on the map</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-zinc-800 rounded-xl transition-all"
                            >
                                <X className="h-6 w-6 text-zinc-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                            {/* Left Side: Search */}
                            <div className="w-full md:w-[350px] p-6 space-y-4 border-r border-zinc-800 flex flex-col">
                                <div className="relative">
                                    <input
                                        type="text"
                                        autoFocus
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full rounded-xl bg-zinc-800 border-0 py-3 px-4 pr-10 text-white ring-1 ring-zinc-700 focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                                        placeholder="Search for a place..."
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        {loadingSuggestions ? (
                                            <Loader2 className="h-4 w-4 text-zinc-500 animate-spin" />
                                        ) : (
                                            <Search className="h-4 w-4 text-zinc-500" />
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-2">
                                    {suggestions.map((suggestion) => (
                                        <button
                                            key={suggestion.place_id}
                                            onClick={() => handleSelectSuggestion(suggestion)}
                                            className="w-full text-left p-3 rounded-xl hover:bg-zinc-800 transition-all group"
                                        >
                                            <p className="text-sm font-bold text-white group-hover:text-orange-500 transition-colors line-clamp-1">
                                                {suggestion.structured_formatting.main_text}
                                            </p>
                                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider line-clamp-1">
                                                {suggestion.structured_formatting.secondary_text}
                                            </p>
                                        </button>
                                    ))}

                                    {searchQuery.length >= 3 && suggestions.length === 0 && !loadingSuggestions && (
                                        <div className="text-center py-8">
                                            <p className="text-zinc-500 text-sm">No results found.</p>
                                        </div>
                                    )}
                                </div>

                                {selectedPlace && (
                                    <div className="p-4 bg-orange-500/5 rounded-2xl ring-1 ring-orange-500/20 space-y-3 mt-auto">
                                        <div className="flex gap-3">
                                            <Navigation className="h-5 w-5 text-orange-500 shrink-0 mt-1" />
                                            <div>
                                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Selected Place</p>
                                                <p className="text-sm font-bold text-white leading-tight mt-0.5">{selectedPlace.address}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleConfirm}
                                            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <Check className="h-5 w-5" /> Confirm Selection
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Right Side: Map */}
                            <div className="flex-1 relative bg-zinc-800">
                                <GoogleMap
                                    mapContainerStyle={{ width: "100%", height: "100%" }}
                                    center={mapCenter}
                                    zoom={14}
                                    onClick={handleMapClick}
                                    onLoad={(map) => { mapRef.current = map; }}
                                    options={{
                                        disableDefaultUI: true,
                                        zoomControl: true,
                                        styles: darkMapStyle,
                                    }}
                                >
                                    {markerPos && <MarkerF position={markerPos} />}
                                </GoogleMap>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const darkMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    },
    {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    },
    {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#263c3f" }],
    },
    {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#6b9a76" }],
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#38414e" }],
    },
    {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#212a37" }],
    },
    {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9ca5b3" }],
    },
    {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#746855" }],
    },
    {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#1f2835" }],
    },
    {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#f3d19c" }],
    },
    {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#2f3948" }],
    },
    {
        featureType: "transit.station",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#17263c" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#515c6d" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#17263c" }],
    },
];
