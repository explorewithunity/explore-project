"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { createTrip } from "@/components/FirebaseActions";
import {
    MapPin,
    Calendar,
    Upload,
    Plus,
    Trash2,
    Move,
    Clock,
    Image as ImageIcon,
    X,
    ChevronDown,
    ChevronUp,
    Save,
    Eye,
    Globe,
    Users,
    Tag,
    AlertCircle,
    CheckCircle,
    ArrowLeft,
    ArrowRight,
} from "lucide-react";
import { Stop, TripData } from "@/types/interface";
import toast from "react-hot-toast";

export default function CreateTripPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [tripData, setTripData] = useState<TripData>({
        title: "",
        departureDate: "",
        returnDate: "",
        destination: "",
        coverImage: null,
        stops: [],
        tags: [],
        description: "",
        maxTravelers: 8,
        price: 0,
        isPublic: true,
    });
    const [newTag, setNewTag] = useState("");
    const [expandedStops, setExpandedStops] = useState<string[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user, loading } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);


    // Add a new stop
    const addStop = () => {
        const newStop: Stop = {
            id: Date.now().toString(),
            title: "",
            time: "10:00",
            day: tripData.stops.length + 1,
            description: "",
            order: tripData.stops.length + 1,
        };
        setTripData({
            ...tripData,
            stops: [...tripData.stops, newStop],
        });
        setExpandedStops([...expandedStops, newStop.id]);
    };

    // Remove a stop
    const removeStop = (stopId: string) => {
        setTripData({
            ...tripData,
            stops: tripData.stops.filter((stop) => stop.id !== stopId),
        });
        setExpandedStops(expandedStops.filter((id) => id !== stopId));
    };

    // Update stop
    const updateStop = (stopId: string, field: keyof Stop, value: any) => {
        setTripData({
            ...tripData,
            stops: tripData.stops.map((stop) =>
                stop.id === stopId ? { ...stop, [field]: value } : stop
            ),
        });
    };

    // Toggle stop expansion
    const toggleStopExpand = (stopId: string) => {
        setExpandedStops((prev) =>
            prev.includes(stopId)
                ? prev.filter((id) => id !== stopId)
                : [...prev, stopId]
        );
    };

    // Handle cover image upload
    const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 20 * 1024 * 1024) {
                toast.error("Image size must be less than 20MB");
                return;
            }
            setTripData({
                ...tripData,
                coverImage: URL.createObjectURL(file),
                coverImageFile: file,
            });
        }
    };

    // Handle drag and drop
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            if (file.size > 20 * 1024 * 1024) {
                toast.error("Image size must be less than 20MB");
                return;
            }
            setTripData({
                ...tripData,
                coverImage: URL.createObjectURL(file),
                coverImageFile: file,
            });
        }
    };

    // Add tag
    const addTag = () => {
        if (newTag.trim() && !tripData.tags.includes(newTag.trim())) {
            setTripData({
                ...tripData,
                tags: [...tripData.tags, newTag.trim()],
            });
            setNewTag("");
        }
    };

    // Remove tag
    const removeTag = (tag: string) => {
        setTripData({
            ...tripData,
            tags: tripData.tags.filter((t) => t !== tag),
        });
    };

    // Handle stop image upload
    const handleStopImageUpload = (stopId: string, file: File) => {
        if (file.size > 20 * 1024 * 1024) {
            toast.error("Image size must be less than 20MB");
            return;
        }
        setTripData(prevTripData => ({
            ...prevTripData,
            stops: prevTripData.stops.map(s =>
                s.id === stopId
                    ? { ...s, image: URL.createObjectURL(file), imageFile: file }
                    : s
            ),
        }));
    };

    // Validate step
    const validateStep = () => {
        switch (currentStep) {
            case 1:
                if (!tripData.title.trim()) {
                    toast.error("Please add a trip title");
                    return false;
                }
                if (!tripData.departureDate) {
                    toast.error("Please select departure date");
                    return false;
                }
                if (!tripData.returnDate) {
                    toast.error("Please select return date");
                    return false;
                }
                if (!tripData.destination.trim()) {
                    toast.error("Please add a destination");
                    return false;
                }
                if (!tripData.coverImage) {
                    toast.error("Please upload a cover image");
                    return false;
                }
                return true;
            case 2:
                if (tripData.stops.length === 0) {
                    toast.error("Please add at least one stop to your trip");
                    return false;
                }
                for (const stop of tripData.stops) {
                    if (!stop.title.trim()) {
                        toast.error("Please add titles for all stops");
                        return false;
                    }
                    if (!stop.description.trim()) {
                        toast.error("Please add descriptions for all stops");
                        return false;
                    }
                }
                return true;
            case 3:
                return true;
            default:
                return true;
        }
    };

    // Next step
    const nextStep = () => {
        if (validateStep()) {
            setCurrentStep(currentStep + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    // Previous step
    const prevStep = () => {
        setCurrentStep(currentStep - 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Submit trip
    const submitTrip = async () => {
        if (!validateStep()) {
            return;
        }
        if (!user) {
            toast.error("You must be logged in to create a trip.");
            return;
        }

        setIsSubmitting(true);
        try {
            const tripId = await createTrip(tripData, user.uid, user.displayName, user.photoURL);
            toast.success("Trip created successfully!");

            // Redirect to the new trip's page
            router.push(`/explore/${tripId}`);

        } catch (error) {
            console.error("Error creating trip: ", error);
            const message = error instanceof Error ? error.message : "Failed to create trip. Please try again.";
            toast.error(message);
            setIsSubmitting(false);
        }
    };

    // Step indicators
    const steps = [
        { number: 1, title: "Trip Itinerary", icon: <Globe size={18} /> },
        { number: 2, title: "Sequence of Events", icon: <MapPin size={18} /> },
        { number: 3, title: "Final Details", icon: <Tag size={18} /> },
    ];

    if (loading || !user) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

    return (
        <>


            <main className="min-h-screen bg-primary  pb-[80px] md:pb-12">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 lg:pt-4 pt-0">
                    {/* Header */}
                    <div className="mb-10 ">
                        <h1 className="text-2xl sm:text-3xl font-bold text-secondary leading-tight">Create Trip</h1>
                        <p className="text-text text-xs sm:text-sm mt-0.5">
                            Curate your next journey. Every detail matters in the digital gallery of the world.
                        </p>
                    </div>

                    {/* Progress Steps */}
                    <div className="mb-10 sm:mb-12">
                        <div className="relative flex items-start justify-between max-w-3xl mx-auto">

                            {/* Full background track line */}
                            <div className="absolute top-4 sm:top-5 left-0 right-0 h-[2px] bg-[#e0e0e0] z-0" />

                            {/* Filled progress line */}
                            <div
                                className="absolute top-4 sm:top-5 h-[2px] bg-secondary z-0 transition-all duration-500"
                                style={{
                                    left: 0,
                                    width:
                                        currentStep === 1
                                            ? "0%"
                                            : currentStep === steps.length
                                                ? "100%"
                                                : `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                                }}
                            />

                            {steps.map((step) => {
                                const isDone = currentStep > step.number;
                                const isActive = currentStep === step.number;

                                return (
                                    <div key={step.number} className="relative z-10 flex flex-col items-center">

                                        {/* Step Button */}
                                        <button
                                            onClick={() => isDone && setCurrentStep(step.number)}
                                            disabled={!isDone}
                                            className={`
              flex items-center justify-center rounded-full
              w-8 h-8 sm:w-10 sm:h-10
              border-2 transition-all duration-300 outline-none
              disabled:cursor-default
              ${isActive
                                                    ? "bg-[#1a1a1a] border-[#1a1a1a] text-white ring-4 ring-[#1a1a1a]/10"
                                                    : isDone
                                                        ? "bg-[#1a1a1a] border-[#1a1a1a] text-white hover:scale-105 cursor-pointer"
                                                        : "bg-white border-[#c0c0c0] text-gray-400"
                                                }
            `}
                                        >
                                            {isDone || isActive ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <span className="text-sm leading-none">{step.icon}</span>
                                            )}
                                        </button>

                                        {/* Label */}
                                        <span
                                            className={`
              hidden sm:block text-[10px] mt-3 font-semibold tracking-widest uppercase text-center
              transition-colors duration-200 whitespace-nowrap
              ${isActive || isDone ? "text-[#1a1a1a]" : "text-gray-400"}
            `}
                                        >
                                            {step.title}
                                        </span>

                                        {/* Mobile dot */}
                                        <span className={`sm:hidden mt-1.5 w-1 h-1 rounded-full ${isActive ? "bg-[#1a1a1a]" : "bg-transparent"}`} />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Mobile status */}
                        <p className="sm:hidden text-center text-xs mt-5 text-gray-500">
                            Step <span className="font-semibold">{currentStep}</span> of {steps.length}
                            {" — "}
                            <span className="font-medium">{steps[currentStep - 1]?.title}</span>
                        </p>
                    </div>
                    {/* Step 1: Trip Identity */}
                    {currentStep === 1 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-white rounded-2xl border border-border p-5 sm:p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-6 sm:mb-8 pb-4 border-b border-border/50">
                                    <span className="w-8 h-8 rounded-lg bg-secondary/5 flex items-center justify-center text-secondary font-bold text-base">01</span>
                                    <h2 className="text-lg sm:text-xl font-bold text-secondary uppercase tracking-tight">Trip Itinerary</h2>
                                </div>

                                {/* Narrative Title */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-secondary mb-2">
                                        NARRATIVE TITLE
                                    </label>
                                    <input
                                        type="text"
                                        value={tripData.title}
                                        onChange={(e) => setTripData({ ...tripData, title: e.target.value })}
                                        placeholder="e.g., The Brutalist Architecture of Berlin"
                                        className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary"
                                    />
                                </div>

                                {/* Dates Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-secondary mb-2">
                                            DEPARTURE
                                        </label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text" size={18} />
                                            <input
                                                type="date"
                                                value={tripData.departureDate}
                                                onChange={(e) => setTripData({ ...tripData, departureDate: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-secondary mb-2">
                                            RETURN
                                        </label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text" size={18} />
                                            <input
                                                type="date"
                                                value={tripData.returnDate}
                                                onChange={(e) => setTripData({ ...tripData, returnDate: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Primary Destination */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-secondary mb-2">
                                        PRIMARY DESTINATION
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text" size={18} />
                                        <input
                                            type="text"
                                            value={tripData.destination}
                                            onChange={(e) => setTripData({ ...tripData, destination: e.target.value })}
                                            placeholder="Search cities, regions..."
                                            className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary"
                                        />
                                    </div>
                                </div>

                                {/* Cover Image Upload */}
                                <div>
                                    <label className="block text-sm font-semibold text-secondary mb-2">
                                        COVER AESTHETIC
                                    </label>
                                    <div
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${dragOver
                                            ? "border-secondary bg-secondary/5"
                                            : "border-border hover:border-secondary"
                                            }`}
                                    >
                                        {tripData.coverImage ? (
                                            <div className="relative group">
                                                <div className="relative w-full h-56 sm:h-80 rounded-xl overflow-hidden shadow-inner">
                                                    <Image
                                                        src={tripData.coverImage}
                                                        alt="Cover"
                                                        fill
                                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <button
                                                        onClick={() => setTripData({ ...tripData, coverImage: null })}
                                                        className="absolute top-3 right-3 bg-white/90 text-secondary p-1.5 rounded-full shadow-lg hover:bg-white transition-all transform hover:scale-110 z-10"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                                <p className="text-[10px] sm:text-xs text-text/60 mt-3 flex items-center justify-center gap-1.5 uppercase font-medium tracking-wider">
                                                    <CheckCircle size={12} className="text-green-500" /> RAW or JPEG, max 20MB
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="mx-auto text-text mb-3" size={32} />
                                                <p className="text-text mb-2">Drag & drop or click to upload</p>
                                                <p className="text-xs text-text">RAW or JPEG, max 20MB</p>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleCoverImageUpload}
                                                    className="hidden"
                                                />
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="mt-4 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-[#333] transition-colors text-sm"
                                                >
                                                    Select Image
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Sequence of Events */}
                    {currentStep === 2 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-white rounded-2xl border border-border p-5 sm:p-8 shadow-sm">
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 sm:mb-10 pb-4 border-b border-border/50">
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <span className="w-8 h-8 rounded-lg bg-secondary/5 flex items-center justify-center text-secondary font-bold text-base">02</span>
                                        <h2 className="text-lg sm:text-xl font-bold text-secondary uppercase tracking-tight">Sequence of Events</h2>
                                    </div>
                                    <button
                                        onClick={addStop}
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-white rounded-xl hover:bg-[#333] transition-all transform hover:-translate-y-px shadow-sm active:scale-95"
                                    >
                                        <Plus size={18} />
                                        <span className="text-sm font-bold tracking-wide uppercase">ADD STOP</span>
                                    </button>
                                </div>

                                {/* Stops List */}
                                <div className="space-y-4">
                                    {tripData.stops.length === 0 ? (
                                        <div className="text-center py-12 bg-primary rounded-xl">
                                            <MapPin size={48} className="mx-auto text-text mb-3" />
                                            <p className="text-text">No stops added yet</p>
                                            <button
                                                onClick={addStop}
                                                className="mt-3 text-secondary hover:underline text-sm"
                                            >
                                                Add your first stop
                                            </button>
                                        </div>
                                    ) : (
                                        tripData.stops.map((stop, index) => (
                                            <div
                                                key={stop.id}
                                                className="border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                                            >
                                                {/* Stop Header */}
                                                <div className="flex items-center justify-between p-4 bg-primary/50 hover:bg-primary transition-colors cursor-pointer group"
                                                    onClick={() => toggleStopExpand(stop.id)}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <Move className="text-text/40 group-hover:text-secondary transition-colors cursor-move shrink-0" size={18} />
                                                        <span className="font-semibold text-secondary truncate text-sm sm:text-base">
                                                            {stop.order}. {stop.title || "Untitled Stop"}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 shrink-0 ml-2">
                                                        <div className="hidden xs:flex items-center gap-2 px-2 py-1 bg-white rounded-md border border-border/50 text-[10px] sm:text-xs text-text font-medium">
                                                            Day {stop.day} • {stop.time}
                                                        </div>
                                                        {expandedStops.includes(stop.id) ? (
                                                            <ChevronUp size={20} className="text-secondary" />
                                                        ) : (
                                                            <ChevronDown size={20} className="text-secondary" />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Stop Details */}
                                                {expandedStops.includes(stop.id) && (
                                                    <div className="p-4 border-t border-border space-y-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-xs font-semibold text-text mb-1">
                                                                    STOP NAME
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={stop.title}
                                                                    onChange={(e) => updateStop(stop.id, "title", e.target.value)}
                                                                    placeholder="e.g., Arrival at Brandenburger Tor"
                                                                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                                                                />
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div>
                                                                    <label className="block text-xs font-semibold text-text mb-1">
                                                                        TIME
                                                                    </label>
                                                                    <input
                                                                        type="time"
                                                                        value={stop.time}
                                                                        onChange={(e) => updateStop(stop.id, "time", e.target.value)}
                                                                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-semibold text-text mb-1">
                                                                        DAY
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        value={stop.day}
                                                                        onChange={(e) => updateStop(stop.id, "day", parseInt(e.target.value))}
                                                                        min="1"
                                                                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="block text-xs font-semibold text-text mb-1">
                                                                DESCRIPTION
                                                            </label>
                                                            <textarea
                                                                value={stop.description}
                                                                onChange={(e) => updateStop(stop.id, "description", e.target.value)}
                                                                rows={3}
                                                                placeholder="Describe the atmosphere, the light, the textures..."
                                                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-xs font-semibold text-text mb-1">
                                                                LOCATION (Optional)
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={stop.location || ""}
                                                                onChange={(e) => updateStop(stop.id, "location", e.target.value)}
                                                                placeholder="Add a specific location..."
                                                                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-xs font-semibold text-text mb-1">
                                                                IMAGE (Optional)
                                                            </label>
                                                            {stop.image ? (
                                                                <div className="relative w-full h-48 rounded-lg overflow-hidden">
                                                                    <Image
                                                                        src={stop.image}
                                                                        alt={stop.title}
                                                                        fill
                                                                        className="object-cover"
                                                                    />
                                                                    <button
                                                                        onClick={() => updateStop(stop.id, "image", null)}
                                                                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                                                                    >
                                                                        <X size={16} />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => imageInputRef.current?.click()}
                                                                    className="w-full p-4 border-2 border-dashed border-border rounded-lg text-center hover:border-secondary transition-colors"
                                                                >
                                                                    <ImageIcon size={24} className="mx-auto text-text mb-2" />
                                                                    <span className="text-sm text-text">Click to upload image</span>
                                                                </button>
                                                            )}
                                                            <input
                                                                ref={imageInputRef}
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) handleStopImageUpload(stop.id, file);
                                                                }}
                                                                className="hidden"
                                                            />
                                                        </div>

                                                        <div className="flex justify-end">
                                                            <button
                                                                onClick={() => removeStop(stop.id)}
                                                                className="flex items-center gap-1 text-red-500 hover:text-red-600 text-sm"
                                                            >
                                                                <Trash2 size={14} />
                                                                Remove Stop
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Final Details */}
                    {currentStep === 3 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-white rounded-2xl border border-border p-5 sm:p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border/50">
                                    <span className="w-8 h-8 rounded-lg bg-secondary/5 flex items-center justify-center text-secondary font-bold text-base">03</span>
                                    <h2 className="text-lg sm:text-xl font-bold text-secondary uppercase tracking-tight">Final Details</h2>
                                </div>

                                {/* Trip Description */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-secondary mb-2">
                                        TRIP DESCRIPTION
                                    </label>
                                    <textarea
                                        value={tripData.description}
                                        onChange={(e) => setTripData({ ...tripData, description: e.target.value })}
                                        rows={4}
                                        placeholder="Tell travelers what makes this journey special..."
                                        className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
                                    />
                                </div>

                                {/* Tags */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-secondary mb-2">
                                        TAGS
                                    </label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {tripData.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-primary rounded-full text-sm"
                                            >
                                                #{tag}
                                                <button
                                                    onClick={() => removeTag(tag)}
                                                    className="text-text hover:text-red-500"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <input
                                            type="text"
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            onKeyPress={(e) => e.key === "Enter" && addTag()}
                                            placeholder="Add tags (e.g., adventure, culture, food)"
                                            className="flex-1 px-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                                        />
                                        <button
                                            onClick={addTag}
                                            className="px-6 py-2.5 bg-secondary/10 text-secondary font-bold rounded-xl hover:bg-secondary hover:text-white transition-all transform active:scale-95 sm:w-auto w-full"
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>

                                {/* Trip Settings */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-secondary mb-2">
                                            MAX TRAVELERS
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <Users size={18} className="text-text" />
                                            <input
                                                type="number"
                                                value={tripData.maxTravelers}
                                                onChange={(e) => setTripData({ ...tripData, maxTravelers: parseInt(e.target.value) })}
                                                min="1"
                                                max="50"
                                                className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-secondary mb-2">
                                            Trip Estimate (₹)
                                        </label>
                                        <input
                                            type="number"
                                            value={tripData.price}
                                            onChange={(e) => setTripData({ ...tripData, price: parseInt(e.target.value) })}
                                            min="0"
                                            placeholder="0 for free"
                                            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                                        />
                                    </div>
                                </div>

                                {/* Visibility */}
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-secondary mb-2 uppercase tracking-tight">
                                        POST VISIBILITY
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                                        <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl border border-border/50 hover:border-secondary/30 hover:bg-secondary/5 transition-all">
                                            <input
                                                type="radio"
                                                checked={tripData.isPublic}
                                                onChange={() => setTripData({ ...tripData, isPublic: true })}
                                                className="w-4 h-4 text-secondary cursor-pointer focus:ring-secondary/20"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-sm text-secondary font-bold group-hover:text-black transition-colors">Public Post</span>
                                                <span className="text-[10px] text-text/60">Visible to all travelers</span>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl border border-border/50 hover:border-secondary/30 hover:bg-secondary/5 transition-all">
                                            <input
                                                type="radio"
                                                checked={!tripData.isPublic}
                                                onChange={() => setTripData({ ...tripData, isPublic: false })}
                                                className="w-4 h-4 text-secondary cursor-pointer focus:ring-secondary/20"
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-sm text-secondary font-bold group-hover:text-black transition-colors">Save as Draft</span>
                                                <span className="text-[10px] text-text/60">Only you can see this</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Preview Card */}
                                <div className="bg-primary rounded-xl p-4 border border-border">
                                    <h3 className="font-semibold text-secondary mb-3">Preview</h3>
                                    <div className="flex items-center gap-4 flex-wrap">
                                        <div className="flex items-center gap-1">
                                            <Globe size={14} className="text-text" />
                                            <span className="text-sm text-text">{tripData.destination || "Anywhere"}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar size={14} className="text-text" />
                                            <span className="text-sm text-text">
                                                {tripData.departureDate ? new Date(tripData.departureDate).toLocaleDateString() : "TBD"} -
                                                {tripData.returnDate ? new Date(tripData.returnDate).toLocaleDateString() : "TBD"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Users size={14} className="text-text" />
                                            <span className="text-sm text-text">{tripData.maxTravelers} travelers max</span>
                                        </div>
                                        {tripData.price > 0 && (
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm font-semibold text-secondary">₹{tripData.price}</span>
                                                <span className="text-sm text-text">/person</span>
                                            </div>
                                        )}
                                    </div>
                                    {tripData.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-3">
                                            {tripData.tags.map((tag) => (
                                                <span key={tag} className="text-xs text-text">#{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex flex-col-reverse sm:flex-row justify-between items-center mt-10 gap-4">
                        {currentStep > 1 && (
                            <button
                                onClick={prevStep}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 border border-border rounded-xl text-secondary font-bold hover:bg-white hover:border-secondary/30 transition-all active:scale-95 shadow-sm"
                            >
                                <ArrowLeft size={18} />
                                Previous
                            </button>
                        )}
                        {currentStep < 3 ? (
                            <button
                                onClick={nextStep}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-secondary text-white rounded-xl hover:bg-[#333] transition-all transform hover:-translate-y-px shadow-lg active:scale-95 ml-auto"
                            >
                                Next
                                <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button
                                onClick={submitTrip}
                                disabled={isSubmitting}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg transform hover:-translate-y-px active:scale-95 disabled:bg-gray-400 ml-auto"
                            >
                                <Save size={18} />
                                {isSubmitting ? "Creating..." : "Create Trip"}
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}