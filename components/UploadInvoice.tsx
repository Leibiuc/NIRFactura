"use client";

import { useState } from "react";
import { cn, Button, ErrorMessage, Text } from "@/components/ui";

interface Props {
  onFileSelect: (file: File) => void;
  loading: boolean;
  error?: string;
}

const ACCEPTED = ".jpg,.jpeg,.png,.pdf";
const MAX_MB = parseInt(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB ?? "10", 10);

export default function UploadInvoice({ onFileSelect, loading, error }: Props) {
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>();

  function handleFile(file: File) {
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`Fisierul depaseste limita de ${MAX_MB}MB.`);
      return;
    }
    setSelectedFile(file.name);
    onFileSelect(file);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="w-full">
      <Button
        as="label"
        htmlFor="invoice-upload"
        variant="card"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-10 text-center transition-colors",
          dragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-blue-400 hover:bg-gray-50",
          loading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          id="invoice-upload"
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={onInputChange}
          disabled={loading}
        />
        <div className="flex flex-col items-center gap-3">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          {loading ? (
            <Text
              variant="body"
              className="text-blue-600 font-medium animate-pulse"
            >
              Procesam factura...
            </Text>
          ) : selectedFile ? (
            <Text variant="body" className="text-green-600 font-medium">
              {selectedFile}
            </Text>
          ) : (
            <>
              <Text variant="body" className="text-gray-600 font-medium">
                Incarca factura
              </Text>
              <Text variant="muted">
                JPG, PNG sau PDF &mdash; max {MAX_MB}MB
              </Text>
            </>
          )}
        </div>
      </Button>
      {error && <ErrorMessage className="mt-2">{error}</ErrorMessage>}
    </div>
  );
}
