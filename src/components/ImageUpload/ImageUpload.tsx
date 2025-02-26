import "./ImageUpload.css";
import { MdOutlineImage } from "react-icons/md";
import { CostumizeImageProps } from "../../types/components.interfaces";

export default function ImageUpload({
  handleDataChange,
  setImageSrc,
  imageSrc,
  formSteps,
}: CostumizeImageProps) {
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        setImageSrc(result);
        const image_path = await window.electron.webUtilities.getPathForFile(
          file
        );
        handleDataChange("cover_path", image_path);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`cover-container ${formSteps ? "clear" : ""}`}>
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
