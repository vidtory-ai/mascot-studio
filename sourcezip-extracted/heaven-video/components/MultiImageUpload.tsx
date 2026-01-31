import React from 'react';

interface MultiImageUploadProps {
  label: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
  id: string;
}

export const MultiImageUpload: React.FC<MultiImageUploadProps> = ({ label, files, onFilesChange, id }) => {

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      onFilesChange([...files, ...newFiles]);
    }
     // Reset the input value to allow selecting the same file again
    e.target.value = '';
  };

  const handleRemove = (indexToRemove: number) => {
    onFilesChange(files.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div>
      <span className="block text-md font-bold text-cyan-400 mb-2">
        {label}
      </span>
      <div className="p-2 bg-slate-800 border border-slate-700">
        {files.length > 0 &&
            <div className="grid grid-cols-3 gap-2 mb-2">
            {files.map((file, index) => {
                const previewUrl = URL.createObjectURL(file);
                return (
                <div key={`${file.name}-${index}`} className="relative">
                    <img src={previewUrl} alt="Preview" className="w-full h-20 object-cover border border-slate-600" />
                    <button
                    onClick={() => handleRemove(index)}
                    className="absolute -top-1 -right-1 bg-red-600 text-white h-5 w-5 flex items-center justify-center text-xs font-bold hover:bg-red-700 transition-transform transform hover:scale-110"
                    aria-label="Remove image"
                    >
                    &times;
                    </button>
                </div>
                );
            })}
            </div>
        }
        <label
          htmlFor={id}
          className="cursor-pointer bg-slate-700 border-2 border-dashed border-slate-500 p-3 text-gray-300 hover:bg-slate-600 hover:border-solid transition-all duration-200 text-center flex items-center justify-center w-full"
        >
          <i className="fas fa-plus mr-2 text-cyan-500"></i>
          <span className='text-sm font-semibold'>Add Image(s)</span>
        </label>
        <input
          id={id}
          type="file"
          accept="image/*"
          multiple // Allow multiple file selection
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
};
