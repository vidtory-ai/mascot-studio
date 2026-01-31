import React from 'react';

interface ImageUploadProps {
  label: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  id: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ label, file, onFileChange, id }) => {
  const previewUrl = file ? URL.createObjectURL(file) : null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileChange(e.target.files[0]);
    } else {
      onFileChange(null);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    const fileInput = document.getElementById(id) as HTMLInputElement;
    if(fileInput) fileInput.value = "";
    onFileChange(null);
  };

  return (
    <div>
      <span className="block text-sm font-bold text-gray-700 mb-1">
        {label}
      </span>
      <div className="flex items-center gap-4">
        {previewUrl && (
          <div className="relative flex-shrink-0">
            <img src={previewUrl} alt="Preview" className="w-20 h-20 object-cover rounded-lg border-2 border-gray-300 shadow-sm" />
            <button
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-red-500 text-white h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-transform transform hover:scale-110"
              aria-label="Remove image"
            >
              &times;
            </button>
          </div>
        )}
        <label
          htmlFor={id}
          className="cursor-pointer bg-yellow-100 border-2 border-dashed border-yellow-400 p-3 text-gray-700 hover:bg-yellow-200 hover:border-yellow-500 hover:border-solid transition-all duration-200 text-center flex-grow flex flex-col items-center justify-center h-20 rounded-lg"
        >
          <i className="fas fa-upload mb-1 text-yellow-600"></i>
          <span className='text-sm font-semibold'>{file ? 'Change Image' : 'Choose Image'}</span>
        </label>
        <input
          id={id}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
};