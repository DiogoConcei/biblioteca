import { useEffect, useState } from "react";
import { IntegrateFormProps } from "../../types/components.interfaces";
import { FaCheckCircle } from "react-icons/fa";
import "./NativeImages.css";

export default function NativeImages({
  setImageSrc,
  archivesPath,
  literatureForm,
  setFormData,
}: IntegrateFormProps) {
  const [covers, setCovers] = useState<string[]>([]);
  const [isCheck, setIsCheck] = useState<number>();

  useEffect(() => {
    const timer = setTimeout(() => {
      (async () => {
        try {
          const data = await window.electron.manga.coverDinamic(
            archivesPath,
            literatureForm
          );

          setCovers(data);
        } catch (error) {
          console.error("Erro ao carregar série:", error);
        }
      })();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const handleClick = async (cover: string, index: number) => {
    setIsCheck((prevState) => (prevState === index ? null : index));

    setFormData((formData) => ({
      ...formData,
      cover_path: cover,
    }));
  };

  return (
    <section className="content">
      <div className="nativeImageContainer">
        {covers.map((cover, index) => (
          <button
            onClick={() => handleClick(cover, index)}
            className={`dinamicButton ${
              isCheck === index ? "selectCover" : ""
            }`}
            key={index}
          >
            <img
              src={`data:image/webp;base64,${cover}`}
              className={`dinamicCover ${isCheck === index ? "check" : ""}`}
              alt="Cover da série"
            />
            <span className="checkContainer">
              <FaCheckCircle
                className={`checkIcon ${isCheck === index ? "choose" : ""}`}
              />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
