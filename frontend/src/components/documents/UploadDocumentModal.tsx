import React, { useState, useRef } from 'react';
import { documentService } from '../../services/documentService';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UploadDocumentModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingState, setProcessingState] = useState<'idle' | 'uploading' | 'processing' | 'ready' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

  const validateAndSelectFile = (file: File) => {
    setErrorMessage(null);
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setErrorMessage('Only PDF documents are supported (.pdf).');
      return false;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage('File size exceeds the 50 MB limit.');
      return false;
    }
    setSelectedFile(file);
    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setProcessingState('uploading');
      setUploadProgress(10);

      await documentService.uploadDocument(selectedFile, (progress) => {
        setUploadProgress(progress);
        if (progress >= 100) {
          setProcessingState('processing');
        }
      });

      // Show processing briefly then ready
      setProcessingState('ready');
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 900);

    } catch (err: any) {
      setProcessingState('error');
      setErrorMessage(err.message || 'Upload failed. Please check backend connection.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    setSelectedFile(null);
    setUploadProgress(0);
    setProcessingState('idle');
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg border border-stone-200 shadow-xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-stone-900">Upload Research Document</h2>
            <p className="text-xs text-stone-500">Add a PDF document to your research collection.</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="text-stone-400 hover:text-stone-600 p-1 rounded hover:bg-stone-100 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200/80 rounded-md flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Dropzone */}
          {!selectedFile ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-stone-800 bg-stone-50'
                  : 'border-stone-200 hover:border-stone-400 bg-stone-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-600 mx-auto flex items-center justify-center mb-3">
                <UploadCloud className="w-5 h-5 text-stone-700" />
              </div>
              <div className="text-xs font-medium text-stone-900 mb-1">
                Drop your PDF here, or <span className="underline underline-offset-2">browse</span>
              </div>
              <div className="text-[11px] text-stone-500">
                PDF documents up to 50 MB supported
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3.5 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-stone-900 truncate max-w-xs">
                      {selectedFile.name}
                    </div>
                    <div className="text-[11px] text-stone-500 font-mono">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>
                </div>

                {!isUploading && (
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-stone-400 hover:text-stone-700 p-1"
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Upload Progress & Status */}
              {isUploading && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] text-stone-600">
                    <span>
                      {processingState === 'uploading' && `Uploading (${uploadProgress}%)...`}
                      {processingState === 'processing' && 'Processing & indexing document...'}
                      {processingState === 'ready' && 'Document ready!'}
                    </span>
                    <span className="font-mono">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-stone-800 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {processingState === 'ready' && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 pt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Document uploaded and verified in storage!</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-stone-50/70 border-t border-stone-100 flex items-center justify-end gap-2">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="px-3 py-1.5 rounded-md border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading || processingState === 'ready'}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 shadow-2xs"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {processingState === 'uploading' ? 'Uploading...' : 'Processing...'}
              </>
            ) : (
              'Upload Document'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
