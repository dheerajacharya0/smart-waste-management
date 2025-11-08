"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Loader2, MapPin, Camera, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MapDisplay } from "@/components/map-display"

interface Complaint {
  id: string
  image?: string  // Keep for backwards compatibility
  images?: string[]  // New field for multiple images
  latitude: number
  longitude: number
  description: string
  timestamp: string
  status: "Submitted" | "In Progress" | "Resolved"
}

export default function ReportPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [images, setImages] = useState<string[]>([])
  const [isCapturing, setIsCapturing] = useState(false)
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(true)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [videoReady, setVideoReady] = useState(false)
  const [flashEnabled, setFlashEnabled] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setLocationLoading(false)
        },
        () => {
          toast({
            title: "Location Error",
            description: "Could not access your location. Please enable location services.",
            variant: "destructive",
          })
          setLocationLoading(false)
        },
      )
    }
  }, [toast])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!location) {
      toast({
        title: "Location Required",
        description: "Please enable location services before uploading a photo.",
        variant: "destructive",
      })
      return
    }

    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setImages(prev => [...prev, event.target?.result as string])
      }
      reader.readAsDataURL(file)
    }
  }

  const startCamera = async () => {
    try {
      // Stop any existing stream first
      if (streamRef.current) {
        stopCamera();
      }

      // Set showCamera true and videoReady false
      setShowCamera(true);
      setVideoReady(false);
      
      // Small delay to ensure the video element is in the DOM
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get the video element
      const video = videoRef.current;
      if (!video) {
        throw new Error('Video element not found');
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      // Store the stream reference
      streamRef.current = stream;
      
      // Set the stream and ensure it's visible
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play().then(() => {
          // Video is playing, hide loading overlay
          setVideoReady(true);
        }).catch(e => {
          console.error('Error playing video:', e);
          setCameraError('Failed to start camera feed');
        });
      };
      
      // Set camera error to null when everything is working
      setCameraError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      const errorMessage = err instanceof Error ? err.message : 'Could not access camera';
      setCameraError(errorMessage);
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
      setShowCamera(false);
      setVideoReady(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current) {
      if (videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setShowCamera(false);
      setVideoReady(false);
      setIsCapturing(false);
      setFlashEnabled(false);
    }
  };

  const toggleFlash = async () => {
    try {
      const stream = streamRef.current;
      if (!stream) return;
      
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      
      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any]
        });
        setFlashEnabled(!flashEnabled);
      } else {
        toast({
          title: 'Flash not available',
          description: 'Your device does not support camera flash',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error toggling flash:', error);
      toast({
        title: 'Flash error',
        description: 'Could not toggle camera flash',
        variant: 'destructive',
      });
    }
  };

  const [captureSuccess, setCaptureSuccess] = useState(false);

  const captureImage = async () => {
    if (videoRef.current && !isCapturing) {
      try {
        setIsCapturing(true);
        const canvas = document.createElement('canvas');
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Draw the current video frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert to data URL and add to images array
          const imageDataUrl = canvas.toDataURL('image/jpeg');
          setImages(prev => [...prev, imageDataUrl]);
          
          // Show success feedback with flash and checkmark
          setCaptureSuccess(true);
          await new Promise(resolve => setTimeout(resolve, 800));
          setCaptureSuccess(false);
          
          // Keep camera open for more photos - don't close
          // stopCamera();
          
          // Show success toast
          toast({
            title: '✓ Photo captured',
            description: `${images.length + 1} photo${images.length + 1 !== 1 ? 's' : ''} ready to submit`,
          });
        }
      } catch (error) {
        console.error('Error capturing image:', error);
        toast({
          title: 'Error',
          description: 'Failed to capture image',
          variant: 'destructive',
        });
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (images.length === 0) {
      toast({
        title: "Missing Photo",
        description: "Please upload a photo of the littered area.",
        variant: "destructive",
      })
      return
    }

    if (!location) {
      toast({
        title: "Missing Location",
        description: "Location is required to submit a complaint.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const complaint: Complaint = {
        id: Date.now().toString(),
        images: images, // Save all captured images
        image: images[0], // Keep first image for backwards compatibility
        latitude: location.lat,
        longitude: location.lng,
        description,
        timestamp: new Date().toISOString(),
        status: "Submitted",
      }

      const existing = JSON.parse(localStorage.getItem("complaints") || "[]")
      localStorage.setItem("complaints", JSON.stringify([...existing, complaint]))

      toast({
        title: "Success!",
        description: "Your complaint has been submitted successfully.",
      })

      setIsSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
        <header className="bg-emerald-700 text-white py-4">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2 text-emerald-100 hover:text-white w-fit">
              <ArrowLeft className="w-5 h-5" />
              <span>Back Home</span>
            </Link>
          </div>
        </header>
        <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Complaint Submitted Successfully!</h2>
            <p className="text-gray-600 mb-6">Thank you for helping keep our community clean. Your report has been received.</p>
            <div className="space-x-4">
              <Button asChild variant="outline">
                <Link href="/">Back to Home</Link>
              </Button>
              <Button asChild>
                <Link href="/report">Submit Another Report</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="bg-emerald-700 text-white py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-emerald-100 hover:text-white w-fit">
            <ArrowLeft className="w-5 h-5" />
            <span>Back Home</span>
          </Link>
        </div>
      </header>

      {/* Form Section */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Waste</h1>
        <p className="text-gray-600 mb-8">Help us keep our community clean by reporting littered areas.</p>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location - Moved First */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900">
                <MapPin className="w-4 h-4 inline mr-2" />
                Location *
              </label>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                {locationLoading ? (
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Getting your location...</span>
                  </div>
                ) : location ? (
                  <div className="space-y-4">
                    <div>
                      <p className="font-medium text-gray-900">📍 Location Captured</p>
                      <p className="text-sm text-gray-600">Latitude: {location.lat.toFixed(6)}</p>
                      <p className="text-sm text-gray-600">Longitude: {location.lng.toFixed(6)}</p>
                    </div>
                    <MapDisplay latitude={location.lat} longitude={location.lng}></MapDisplay>
                  </div>
                ) : (
                  <p className="text-red-600 text-sm">Unable to access location</p>
                )}
              </div>
            </div>

            {/* Photo Upload - Disabled until location is obtained */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900">
                <Camera className="w-4 h-4 inline mr-2" />
                Photo of Littered Area *{" "}
                {!location && <span className="text-xs text-red-600">(Location required first)</span>}
              </label>
              
              {showCamera ? (
                <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
                  {/* Camera view container */}
                  <div className="relative w-full aspect-[9/16] max-h-[70vh] bg-black">
                    {/* Video feed */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Success checkmark animation */}
                    {captureSuccess && (
                      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                        <div className="relative">
                          <div className="absolute inset-0 w-20 h-20 -left-10 -top-10 rounded-full bg-emerald-500/30 animate-ping"></div>
                          <div className="relative w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Top bar with controls */}
                    <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
                      {/* Left side controls */}
                      <div className="flex items-center gap-2">
                        {/* Close button */}
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="p-2.5 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-all"
                          title="Close camera"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        
                        {/* Flash toggle button */}
                        <button
                          type="button"
                          onClick={toggleFlash}
                          className={`p-2.5 rounded-full backdrop-blur-sm transition-all ${
                            flashEnabled 
                              ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                              : 'bg-black/50 text-white hover:bg-black/70'
                          }`}
                          title={flashEnabled ? 'Turn off flash' : 'Turn on flash'}
                        >
                          {flashEnabled ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M11.19 1.36a1 1 0 0 1 1.62 0l2.63 3.54 4.38.38a1 1 0 0 1 .82 1.45l-2.24 4.03 2.24 4.03a1 1 0 0 1-.82 1.45l-4.38.38-2.63 3.54a1 1 0 0 1-1.62 0l-2.63-3.54-4.38-.38a1 1 0 0 1-.82-1.45l2.24-4.03-2.24-4.03a1 1 0 0 1 .82-1.45l4.38-.38 2.63-3.54Z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      
                      {/* Photo counter badge */}
                      {images.length > 0 && (
                        <div className="px-4 py-2 rounded-full bg-emerald-500 text-white font-semibold text-sm shadow-lg flex items-center gap-2">
                          <Camera className="w-4 h-4" />
                          {images.length}
                        </div>
                      )}
                    </div>
                    
                    {/* Bottom controls */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                      <div className="flex items-center justify-center gap-8">
                        {/* Spacer for symmetry */}
                        <div className="w-14"></div>
                        
                        {/* Capture button */}
                        <button
                          type="button"
                          onClick={captureImage}
                          disabled={isCapturing}
                          className={`relative transition-transform ${
                            isCapturing ? 'scale-95' : 'hover:scale-105 active:scale-95'
                          }`}
                          title="Take photo"
                        >
                          {/* Outer ring */}
                          <div className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center">
                            {/* Inner button */}
                            <div className={`w-16 h-16 rounded-full transition-all ${
                              isCapturing ? 'bg-gray-300' : 'bg-white'
                            }`}>
                              {isCapturing && (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="w-3 h-3 bg-gray-600 rounded-full animate-pulse"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                        
                        {/* Done button (right side) */}
                        <button
                          type="button"
                          onClick={stopCamera}
                          disabled={images.length === 0}
                          className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                            images.length > 0
                              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg'
                              : 'bg-white/20 text-white/50 cursor-not-allowed'
                          }`}
                          title={images.length > 0 ? 'Done' : 'Take at least one photo'}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Help text */}
                      {/* <div className="text-center mt-4">
                        <p className="text-white text-sm font-medium drop-shadow-lg">
                          {images.length === 0 ? 'Tap to capture' : `${images.length} photo${images.length !== 1 ? 's' : ''} • Tap ✓ when done`}
                        </p>
                      </div> */}
                    </div>
                    
                    {/* Loading state overlay */}
                    {!videoReady && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
                        <div className="text-center">
                          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
                          <p className="text-white font-medium">Starting camera...</p>
                          <p className="text-white/60 text-sm mt-2">Please allow camera access</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {cameraError && (
                    <div className="p-4 bg-red-50 border-t border-red-200">
                      <p className="text-red-600 text-sm font-medium">{cameraError}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center transition border-emerald-300">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={!location || locationLoading}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className={`cursor-pointer block p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${
                            !location ? "opacity-50 pointer-events-none" : ""
                          }`}
                        >
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Upload className="w-6 h-6 text-gray-500" />
                            <span className="text-sm font-medium">Upload from device</span>
                            <span className="text-xs text-gray-500">JPG, PNG up to 5MB</span>
                          </div>
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={startCamera}
                        disabled={!location || locationLoading}
                        className={`flex-1 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex flex-col items-center justify-center space-y-2 ${
                          !location ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <Camera className="w-6 h-6 text-gray-500" />
                        <span className="text-sm font-medium">Take a photo</span>
                        <span className="text-xs text-gray-500">Use your camera</span>
                      </button>
                    </div>
                  </div>
                  {images.length > 0 ? (
                    <div className="mt-4">
                      <div className="grid grid-cols-2 gap-3">
                        {images.map((img, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={img}
                              alt={`Capture ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => setImages(prev => prev.filter((_, i) => i !== index))}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-center space-x-4 mt-4">
                        <button
                          type="button"
                          onClick={() => setImages([])}
                          className="text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                          Remove all
                        </button>
                        <button
                          type="button"
                          onClick={startCamera}
                          className="text-sm text-emerald-600 hover:text-emerald-800 font-medium"
                        >
                          {images.length > 0 ? 'Add more photos' : 'Take photos'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-4">
                      <Camera className={`w-8 h-8 mx-auto ${location ? "text-emerald-600" : "text-gray-400"}`} />
                      <p className={`text-center font-medium ${location ? "text-gray-900" : "text-gray-500"}`}>
                        {location ? "Click to upload or drag and drop" : "Enable location to upload photo"}
                      </p>
                      <p className="text-sm text-gray-500 text-center">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Description */}
            <div className="space-y-3">
              <label htmlFor="description" className="block text-sm font-semibold text-gray-900">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the waste type, area conditions, or any additional details..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                rows={4}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={loading || !location || images.length === 0}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Report"
                )}
              </Button>
              <Link href="/" className="flex-1">
                <Button type="button" variant="outline" className="w-full bg-transparent">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      </section>
    </main>
  )
}
