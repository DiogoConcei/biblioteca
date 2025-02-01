import "./CostumizeImage.css";
import { MdOutlineImage } from "react-icons/md";
import { useState } from "react";

export default function CostumizeImage() {
  const [imageSrc, setImageSrc] = useState<string>();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="cover-container">
      <p className="cover-title">Capa de exibição</p>
      <div
        className=" image-upload"
        onClick={() => document.getElementById("fileInput")?.click()}>
        {imageSrc ? (
          <img src={imageSrc} alt="Preview" className="cover-preview" />
        ) : (
          <span className="alert">
            <MdOutlineImage className="insert-image" />
          </span>
        )}
        <input
          id="fileInput"
          type="file"
          accept="image/*"
          className="file-input"
          onChange={handleImageChange}
        />
      </div>
    </div>
  );
}
