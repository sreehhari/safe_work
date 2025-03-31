"use client";
import { useState } from "react";

export default function UploadComponent() {
    const [file, setFile] = useState<File | null>(null);
    const [missingGearCount, setMissingGearCount] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleUpload = async (endpoint: string) => {
        if (!file) return;

        setProcessing(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`http://127.0.0.1:8000${endpoint}`, {
                method: "POST",
                body: formData,  // ✅ Don't set headers manually
            });

            if (!res.ok) throw new Error("Failed to process file");

            const data = await res.json();
            setMissingGearCount(data.workers_without_gear);
        } catch (error) {
            console.error("Upload error:", error);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="flex flex-col items-center p-4">
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <button onClick={() => handleUpload("/detect/image")} className="bg-blue-500 text-white p-2 mt-2">
                Detect Image
            </button>
            <button onClick={() => handleUpload("/detect/video")} className="bg-green-500 text-white p-2 mt-2">
                Detect Video
            </button>
            {processing && <p>Processing...</p>}
            {missingGearCount !== null && (
                <p className="mt-4 text-red-500 text-lg font-bold">
                    Workers Without Gear: {missingGearCount}
                </p>
            )}
        </div>
    );
}
