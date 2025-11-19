'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { storage, databases, STORAGE_BUCKET_ID, DATABASE_ID, UPLOADS_COLLECTION_ID } from '@/lib/appwrite';
import { ID } from 'appwrite';

interface Upload {
  $id: string;
  imageUrl: string;
  fileName: string;
  uploadedAt: string;
  username: string;
}

export default function DashboardPage() {
  const { isAuthenticated, username, logout } = useAuth();
  const router = useRouter();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [selectedImage, setSelectedImage] = useState<Upload | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else {
      loadUploads();
    }
  }, [isAuthenticated, router]);

  const loadUploads = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        UPLOADS_COLLECTION_ID
      );
      setUploads(response.documents as unknown as Upload[]);
    } catch (err) {
      console.error('Error loading uploads:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
      setError('Please upload only JPG or PNG images');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // Upload file to Appwrite Storage
      const uploadedFile = await storage.createFile(
        STORAGE_BUCKET_ID,
        ID.unique(),
        file
      );

      // Get file URL
      const fileUrl = storage.getFileView(STORAGE_BUCKET_ID, uploadedFile.$id);

      // Save metadata to database
      const document = await databases.createDocument(
        DATABASE_ID,
        UPLOADS_COLLECTION_ID,
        ID.unique(),
        {
          imageUrl: fileUrl.href,
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
          username: username,
          fileId: uploadedFile.$id
        }
      );

      // Add to uploads list
      const newUpload: Upload = {
        $id: document.$id,
        imageUrl: fileUrl.href,
        fileName: file.name,
        uploadedAt: document.uploadedAt,
        username: username
      };

      setUploads([newUpload, ...uploads]);
      setSelectedImage(newUpload);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image. Please check your Appwrite configuration.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Recent Uploads</h2>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Logout
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">Logged in as: {username}</p>
        </div>

        {/* Uploads List */}
        <div className="flex-1 overflow-y-auto">
          {uploads.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No uploads yet
            </div>
          ) : (
            <div className="p-2">
              {uploads.map((upload) => (
                <button
                  key={upload.$id}
                  onClick={() => setSelectedImage(upload)}
                  className={`w-full text-left p-3 mb-2 rounded-lg transition ${
                    selectedImage?.$id === upload.$id
                      ? 'bg-indigo-50 border border-indigo-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={upload.imageUrl}
                      alt={upload.fileName}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {upload.fileName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(upload.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 p-4">
          <h1 className="text-2xl font-bold text-gray-800">Image Uploader</h1>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {!selectedImage ? (
            <div className="flex items-center justify-center h-full">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <div className="border-4 border-dashed border-gray-300 rounded-2xl p-16 hover:border-indigo-400 transition">
                  <div className="text-center">
                    <div className="text-6xl text-gray-400 mb-4">+</div>
                    <p className="text-xl text-gray-600 mb-2">
                      {isUploading ? 'Uploading...' : 'Click to upload image'}
                    </p>
                    <p className="text-sm text-gray-500">
                      JPG or PNG files only
                    </p>
                  </div>
                </div>
              </label>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">{selectedImage.fileName}</h3>
                    <p className="text-sm text-gray-500">
                      Uploaded on {new Date(selectedImage.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                      Close
                    </button>
                    <label className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer inline-block">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                      {isUploading ? 'Uploading...' : 'Upload New'}
                    </label>
                  </div>
                </div>
                <div className="p-8">
                  <img
                    src={selectedImage.imageUrl}
                    alt={selectedImage.fileName}
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}