"use client";

import React, { useRef, useState } from "react";
import { upload } from "@imagekit/next";
import { Button } from "./button";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageKitUploadProps {
    onSuccess: (url: string) => void;
    onUploadStart?: () => void;
    onUploadError?: (err: any) => void;
    folder?: string;
    buttonText?: string;
    accept?: string;
    value?: string;
    onClear?: () => void;
}

const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "";
const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "";

/**
 * ImageKitUpload Component
 * Handles direct file uploads to ImageKit.io using the Next.js SDK.
 * 
 * @param onSuccess - Callback called with the uploaded file URL
 * @param onUploadStart - Callback called when upload begins
 * @param onUploadError - Callback called if upload fails
 * @param folder - ImageKit folder to upload to
 * @param buttonText - Text to display on the upload button
 * @param accept - File types to accept
 * @param value - Currently uploaded file URL (for preview)
 * @param onClear - Callback to clear the selection
 */
export function ImageKitUpload({
    onSuccess,
    onUploadStart,
    onUploadError,
    folder = "/recruiter-verifications",
    buttonText = "Upload Document",
    accept = "application/pdf,image/*",
    value,
    onClear,
}: ImageKitUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset the input so the same file can be selected again if cleared
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        try {
            setIsUploading(true);
            onUploadStart?.();

            // Get authentication parameters from the server
            const authRes = await fetch("/api/imagekit/auth");
            if (!authRes.ok) throw new Error("ImageKit authentication failed");
            const { signature, expire, token } = await authRes.json();

            // Upload the file with authentication parameters
            const result = await upload({
                file,
                fileName: file.name,
                folder,
                publicKey,
                signature,
                expire,
                token,
            });

            if (result && result.url) {
                onSuccess(result.url);
                toast.success("File uploaded successfully");
            } else {
                throw new Error("Upload succeeded but no URL was returned");
            }
        } catch (err: any) {
            console.error("Upload Error:", err);
            toast.error(err.message || "Upload failed. Please try again.");
            onUploadError?.(err);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            {value ? (
                <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm truncate max-w-[200px] sm:max-w-[300px]">
                            {value.split("/").pop()}
                        </span>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={onClear}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div className="relative">
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept={accept}
                        onChange={handleFileChange}
                        disabled={isUploading}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full h-24 border-dashed border-2 flex flex-col gap-2 hover:bg-muted/50 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                <span>Uploading...</span>
                            </>
                        ) : (
                            <>
                                <Upload className="h-6 w-6 text-muted-foreground" />
                                <span className="font-medium">{buttonText}</span>
                                <span className="text-xs text-muted-foreground font-normal">
                                    PDF, JPG, PNG (Max 5MB)
                                </span>
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}