"use client";

import { X, Loader2, Upload, Calendar, MapPin, Users, Tag, Trash2, Plus, Move, ChevronDown, ChevronUp, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { updateTrip, deleteTrip } from "@/components/FirebaseActions";
import { ExploreTripData, TripData } from "@/types/interface";
import { toast } from "react-hot-toast";

interface EditTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: ExploreTripData | null;
  onUpdate: () => void;
}

export default function EditTripModal({
  isOpen,
  onClose,
  trip,
  onUpdate,
}: EditTripModalProps) {
  const [formData, setFormData] = useState<Partial<TripData>>({
    title: "",
    description: "",
    destination: "",
    departureDate: "",
    returnDate: "",
    maxTravelers: 8,
    price: 0,
    isPublic: true,
    tags: [],
    stops: [],
  });
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [newTag, setNewTag] = useState("");
  const [expandedStops, setExpandedStops] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (trip && isOpen) {
      setFormData({
        title: trip.title || "",
        description: trip.description || "",
        destination: trip.destination || "",
        departureDate: trip.departureDate || "",
        returnDate: trip.returnDate || "",
        maxTravelers: trip.maxTravelers || 8,
        price: trip.price || 0,
        isPublic: trip.isPublic !== undefined ? trip.isPublic : true,
        tags: trip.tags || [],
        stops: trip.stops || [],
      });
      setCoverPreview(trip.image || null);
    }
  }, [trip, isOpen]);

  const handleSave = async () => {
    if (!trip) return;
    setLoading(true);

    try {
      await updateTrip(trip.id, {
        ...formData,
        coverImage: coverPreview,
        coverImageFile: coverFile || undefined,
      });

      toast.success("Trip updated successfully!");
      onUpdate();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to update trip");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!trip) return;
    if (!window.confirm("Are you sure you want to delete this trip? This action cannot be undone.")) return;

    setIsDeleting(true);
    try {
      await deleteTrip(trip.id);
      toast.success("Trip deleted successfully!");
      onUpdate();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete trip");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const addStop = () => {
    const newStop = {
      id: Date.now().toString(),
      title: "",
      time: "10:00",
      day: (formData.stops?.length || 0) + 1,
      description: "",
      order: (formData.stops?.length || 0) + 1,
    };
    setFormData({
      ...formData,
      stops: [...(formData.stops || []), newStop as any],
    });
    setExpandedStops([...expandedStops, newStop.id]);
  };

  const removeStop = (stopId: string) => {
    setFormData({
      ...formData,
      stops: formData.stops?.filter((stop) => stop.id !== stopId),
    });
    setExpandedStops(expandedStops.filter((id) => id !== stopId));
  };

  const updateStop = (stopId: string, field: string, value: any) => {
    setFormData({
      ...formData,
      stops: formData.stops?.map((stop) =>
        stop.id === stopId ? { ...stop, [field]: value } : stop
      ),
    });
  };

  const toggleStopExpand = (stopId: string) => {
    setExpandedStops((prev) =>
      prev.includes(stopId)
        ? prev.filter((id) => id !== stopId)
        : [...prev, stopId]
    );
  };

  const handleStopImageUpload = (stopId: string, file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image size must be less than 20MB");
      return;
    }
    setFormData(prev => ({
      ...prev,
      stops: prev.stops?.map(s =>
        s.id === stopId
          ? { ...s, image: URL.createObjectURL(file), imageFile: file }
          : s
      ),
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag.trim()],
      });
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag),
    });
  };

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !trip) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#e8e6e4]">
          <h2 className="text-xl font-bold text-[#2c3e4e]">Edit Journal</h2>
          <button
            onClick={onClose}
            disabled={loading || isDeleting}
            className="p-2 text-[#8b9aab] hover:text-[#2c3e4e] hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-secondary">
          {/* Cover Image */}
          <div>
            <label className="block text-xs font-semibold text-[#8b9aab] uppercase tracking-wider mb-2">
              Cover Aesthetic
            </label>
            <div 
              className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 border-dashed border-[#e8e6e4] hover:border-secondary transition-colors cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              {coverPreview ? (
                <>
                  <Image
                    src={coverPreview}
                    alt="Cover Preview"
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-sm font-medium">Change Image</span>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#8b9aab]">
                  <Upload size={32} className="mb-2" />
                  <span className="text-xs">Upload Cover Image</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#8b9aab] uppercase tracking-wider mb-2">
              Narrative Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-[#f8f9fa] border border-[#e8e6e4] rounded-xl text-[#2c3e4e] focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
              placeholder="e.g., The Brutalist Architecture of Berlin"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#8b9aab] uppercase tracking-wider mb-2">
              Journal Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 bg-[#f8f9fa] border border-[#e8e6e4] rounded-xl text-[#2c3e4e] focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all resize-none"
              placeholder="Tell travelers what makes this journey special..."
            />
          </div>

          {/* Destination & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#8b9aab] uppercase tracking-wider mb-2">
                Primary Destination
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b9aab]" size={16} />
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-[#f8f9fa] border border-[#e8e6e4] rounded-xl text-[#2c3e4e] focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                  placeholder="e.g., Berlin, Germany"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-xs font-semibold text-[#8b9aab] uppercase tracking-wider mb-2">
                        Departure
                    </label>
                    <input
                        type="date"
                        value={formData.departureDate}
                        onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                        className="w-full px-3 py-3 bg-[#f8f9fa] border border-[#e8e6e4] rounded-xl text-[#2c3e4e] text-[10px] focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-[#8b9aab] uppercase tracking-wider mb-2">
                        Return
                    </label>
                    <input
                        type="date"
                        value={formData.returnDate}
                        onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                        className="w-full px-3 py-3 bg-[#f8f9fa] border border-[#e8e6e4] rounded-xl text-[#2c3e4e] text-[10px] focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all"
                    />
                </div>
            </div>
          </div>

          {/* Travelers & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#8b9aab] uppercase tracking-wider mb-2">
                Max Travelers
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b9aab]" size={16} />
                <input
                  type="number"
                  value={formData.maxTravelers}
                  onChange={(e) => setFormData({ ...formData, maxTravelers: parseInt(e.target.value) })}
                  className="w-full pl-10 pr-4 py-3 bg-[#f8f9fa] border border-[#e8e6e4] rounded-xl text-[#2c3e4e] focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8b9aab] uppercase tracking-wider mb-2">
                Trip Estimate (₹)
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-[#f8f9fa] border border-[#e8e6e4] rounded-xl text-[#2c3e4e] focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-[#8b9aab] uppercase tracking-wider mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.tags?.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-medium"
                >
                  #{tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-secondary/70 transition-colors">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b9aab]" size={16} />
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addTag()}
                  placeholder="Add tags..."
                  className="w-full pl-10 pr-4 py-3 bg-[#f8f9fa] border border-[#e8e6e4] rounded-xl text-[#2c3e4e] text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all"
                />
              </div>
              <button
                onClick={addTag}
                className="px-6 py-3 bg-secondary text-white text-sm font-medium rounded-xl hover:bg-[#1a2a3a] transition-all"
              >
                Add
              </button>
            </div>
          </div>

          {/* Stops Section */}
          <div className="pt-4 border-t border-[#e8e6e4]">
            <div className="flex items-center justify-between mb-4">
               <label className="block text-xs font-bold text-secondary uppercase tracking-wider">
                Sequence of Events (Itinerary)
              </label>
              <button
                onClick={addStop}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-white rounded-lg text-xs font-bold hover:bg-[#1a2a3a] transition-all"
              >
                <Plus size={14} />
                ADD STOP
              </button>
            </div>

            <div className="space-y-4">
              {formData.stops?.length === 0 ? (
                <div className="text-center py-8 bg-[#f8f9fa] rounded-2xl border border-dashed border-[#e8e6e4]">
                  <MapPin size={32} className="mx-auto text-[#8b9aab] mb-2" />
                  <p className="text-xs text-[#8b9aab]">No stops added yet</p>
                </div>
              ) : (
                formData.stops?.map((stop: any, index: number) => (
                  <div key={stop.id} className="bg-white border border-[#e8e6e4] rounded-2xl overflow-hidden shadow-sm">
                    {/* Stop Header */}
                    <div 
                      className="flex items-center justify-between p-4 bg-[#f8f9fa] cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleStopExpand(stop.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Move className="text-[#8b9aab]" size={16} />
                        <span className="text-sm font-bold text-secondary">
                          {index + 1}. {stop.title || "Untitled Stop"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-[#8b9aab] px-2 py-0.5 bg-white border border-[#e8e6e4] rounded-full">
                          Day {stop.day} • {stop.time}
                        </span>
                        {expandedStops.includes(stop.id) ? (
                            <ChevronUp size={16} className="text-[#8b9aab]" />
                        ) : (
                            <ChevronDown size={16} className="text-[#8b9aab]" />
                        )}
                      </div>
                    </div>

                    {/* Stop Body */}
                    {expandedStops.includes(stop.id) && (
                      <div className="p-4 border-t border-[#e8e6e4] space-y-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-[#8b9aab] uppercase mb-1">Stop Name</label>
                            <input
                              type="text"
                              value={stop.title}
                              onChange={(e) => updateStop(stop.id, "title", e.target.value)}
                              className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e8e6e4] rounded-lg text-sm text-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
                              placeholder="e.g., Arrival at Brandenburger Tor"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                             <div>
                              <label className="block text-[10px] font-bold text-[#8b9aab] uppercase mb-1">Time</label>
                              <input
                                type="time"
                                value={stop.time}
                                onChange={(e) => updateStop(stop.id, "time", e.target.value)}
                                className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e8e6e4] rounded-lg text-secondary focus:outline-none focus:ring-1 focus:ring-secondary text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-[#8b9aab] uppercase mb-1">Day</label>
                              <input
                                type="number"
                                value={stop.day}
                                onChange={(e) => updateStop(stop.id, "day", parseInt(e.target.value))}
                                min="1"
                                className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e8e6e4] rounded-lg text-secondary focus:outline-none focus:ring-1 focus:ring-secondary text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#8b9aab] uppercase mb-1">Description</label>
                          <textarea
                            value={stop.description}
                            onChange={(e) => updateStop(stop.id, "description", e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#e8e6e4] rounded-lg text-sm text-secondary focus:outline-none focus:ring-1 focus:ring-secondary resize-none"
                            placeholder="Describe the atmosphere..."
                          />
                        </div>
                        
                        <div>
                          <label className="block text-[10px] font-bold text-[#8b9aab] uppercase mb-1">Stop Image</label>
                          {stop.image ? (
                            <div className="relative aspect-video rounded-xl overflow-hidden group">
                              <Image src={stop.image} alt={stop.title} fill className="object-cover" />
                              <button 
                                onClick={() => updateStop(stop.id, "image", null)}
                                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div 
                              className="w-full py-6 border-2 border-dashed border-[#e8e6e4] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-secondary transition-colors"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.onchange = (e: any) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleStopImageUpload(stop.id, file);
                                };
                                input.click();
                              }}
                            >
                              <ImageIcon size={20} className="text-[#8b9aab] mb-2" />
                              <span className="text-[10px] font-bold text-[#8b9aab]">Add Stop Image</span>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => removeStop(stop.id)}
                            className="flex items-center gap-1 text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-wider"
                          >
                            <Trash2 size={12} />
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

          {/* Visibility */}
          <div>
            <label className="block text-xs font-semibold text-[#8b9aab] uppercase tracking-wider mb-2">
              Post Visibility
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  checked={formData.isPublic}
                  onChange={() => setFormData({ ...formData, isPublic: true })}
                  className="w-4 h-4 text-secondary border-[#e8e6e4] focus:ring-secondary cursor-pointer"
                />
                <span className="text-sm text-[#5a6b7a] group-hover:text-[#2c3e4e] transition-colors font-medium">Public Post</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  checked={!formData.isPublic}
                  onChange={() => setFormData({ ...formData, isPublic: false })}
                  className="w-4 h-4 text-secondary border-[#e8e6e4] focus:ring-secondary cursor-pointer"
                />
                <span className="text-sm text-[#5a6b7a] group-hover:text-[#2c3e4e] transition-colors font-medium">Save as Draft</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#e8e6e4] bg-[#faf9f8] flex flex-wrap items-center justify-between gap-4 rounded-b-3xl">
          <button
            onClick={handleDelete}
            disabled={loading || isDeleting}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-all disabled:opacity-50"
          >
            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            Delete Post
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading || isDeleting}
              className="px-6 py-2.5 text-sm font-medium text-[#5a6b7a] hover:text-[#2c3e4e] hover:bg-[#e8e6e4] rounded-full transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || isDeleting}
              className="px-8 py-2.5 bg-secondary text-white text-sm font-medium rounded-full hover:bg-[#1a2a3a] transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Update Journal"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
