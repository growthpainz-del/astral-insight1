
import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, Loader2, Check, AlertTriangle, FileImage } from "lucide-react";
import { UploadFile } from "@/integrations/Core";
import { Card as CardEntity } from '@/entities/Card';

export default function BulkImageUploader({ deckId, onUploadComplete, onClose }) {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingCards, setIsCreatingCards] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = (newFiles) => {
    const acceptedImageFiles = Array.from(newFiles).filter(file => file.type.startsWith('image/'));
    setFiles(prev => {
        const currentFiles = [...prev];
        for (const file of acceptedImageFiles) {
            if (!currentFiles.some(f => f.name === file.name && f.size === file.size)) {
                currentFiles.push(file);
            }
        }
        return currentFiles;
    });
    setError(null);
    setUploadProgress(0);
  };
  
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, []);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = ""; // Reset input value
    }
  };
  
  const onButtonClick = () => {
    inputRef.current?.click();
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setIsCreatingCards(false);
    setError(null);
    setUploadProgress(0);

    try {
      const uploadPromises = files.map(file => UploadFile({ file }));
      const results = await Promise.all(uploadPromises);
      const uploadedUrls = results.map((res, index) => ({ url: res.file_url, name: files[index].name }));
      
      setUploadProgress(50);
      setIsUploading(false);
      setIsCreatingCards(true);

      const newCardsData = uploadedUrls.map(({ url, name }) => {
        const nameMatch = name.match(/^(?:(\d+)[-.\s]*)?(.+?)\.\w+$/i);
        let cardName = name.replace(/\.\w+$/, '');
        let cardNumber = null;

        if (nameMatch) {
          cardNumber = nameMatch[1] ? parseInt(nameMatch[1], 10) : null;
          cardName = nameMatch[2].replace(/[-_]/g, ' ').trim();
        } else {
             cardName = name.replace(/\.\w+$/, '').replace(/[-_]/g, ' ').trim();
        }

        return {
          deck_id: deckId,
          name: cardName,
          number: cardNumber,
          image_url: url,
        };
      });

      if (newCardsData.length > 0) {
        await CardEntity.bulkCreate(newCardsData);
      }

      setUploadProgress(100);
      setIsCreatingCards(false);
      onUploadComplete();
      setFiles([]);
      
    } catch (e) {
      setError('An error occurred during upload or card creation. Please check console for details.');
      console.error(e);
      setIsUploading(false);
      setIsCreatingCards(false);
      setUploadProgress(0);
    }
  };

  return (
    <>
      <div
        onDragEnter={handleDrag}
        className="relative" // Container for drop overlay
      >
        <div
          onClick={onButtonClick}
          className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                     ${isDragActive ? 'border-purple-400 bg-white/10' : 'border-white/20 bg-white/5'}
                     hover:bg-white/10 hover:border-purple-400 mb-4`}
        >
            <input
                ref={inputRef}
                type="file"
                multiple
                onChange={handleChange}
                className="hidden"
                accept="image/*"
            />
            <Upload className="w-8 h-8 mb-2 text-gray-400" />
            <p className="mb-2 text-sm text-gray-400">
                <span className="font-semibold">Click to browse</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, GIF, WEBP</p>
        </div>
        
        {isDragActive && (
          <div
            className="absolute inset-0 w-full h-full"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          ></div>
        )}
      </div>

      {files.length > 0 && (
          <div className="mb-4">
              <h4 className="font-semibold text-purple-200 mb-2">{files.length} File(s) selected:</h4>
              <div className="max-h-40 overflow-y-auto rounded-md border border-white/10 bg-black/20 p-2 text-sm text-gray-300">
                  {files.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 py-1 border-b border-white/5 last:border-b-0">
                          <FileImage className="h-4 w-4 text-purple-400 flex-shrink-0" />
                          <span className="truncate">{file.name}</span>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {error && (
          <p className="text-sm text-center text-red-400 flex items-center justify-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4" /> {error}
          </p>
      )}

      {(isUploading || isCreatingCards || uploadProgress === 100) && (
        <div className="space-y-2 mb-4">
          {(isUploading || isCreatingCards) &&
            <p className="text-sm text-center text-purple-300">
              {isUploading ? `Uploading ${files.length} images...` : `Creating ${files.length} cards...`}
            </p>
          }
          <Progress value={uploadProgress} className="w-full" />
          {uploadProgress === 100 && !error && !isCreatingCards && !isUploading && files.length === 0 && (
            <p className="text-sm text-center text-green-400 flex items-center justify-center gap-2"><Check /> Complete! Cards created successfully.</p>
          )}
        </div>
      )}
      
      <div className="mt-4">
        <Button
          onClick={handleUpload}
          disabled={isUploading || isCreatingCards || files.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {(isUploading || isCreatingCards) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin inline-block" />
              Processing...
            </>
          ) : (
            `Upload ${files.length} Image(s) & Create Cards`
          )}
        </Button>
      </div>
    </>
  );
}
