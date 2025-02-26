import "./FormTag.css";
import { useState } from "react";
import { FormTagProps } from "../../../types/components.interfaces";
import { CiShoppingTag } from "react-icons/ci";

export default function FormTag({ setFormData }: FormTagProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [typingTimeout, setTypingTimeout] = useState<number | null>(null);

  const addTags = () => {
    setFormData((prevData) => ({
      ...prevData,
      tags: tags,
    }));
  };

  const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const tagArray = value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag !== "");

    setTags(tagArray);

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const timeoutId = window.setTimeout(() => {
      addTags();
    }, 1000);
    setTypingTimeout(timeoutId);
  };

  return (
    <div>
      <div className="form-tag">
        <h2 className="form-subtitle">Tags: </h2>

        <div className="form-tag-input">
          <input
            type="text"
            placeholder="Digite tags separadas por vírgula"
            onChange={handleTagInput}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (typingTimeout) {
                  clearTimeout(typingTimeout);
                  setTypingTimeout(null);
                }
                addTags();
              }
            }}
            onBlur={() => {
              if (typingTimeout) {
                clearTimeout(typingTimeout);
                setTypingTimeout(null);
              }
              addTags();
            }}
          />
        </div>

        <div className="form-tag-preview">
          <h3 className="form-subtitle">Tags Inseridas:</h3>
          <ul className="tag-list">
            {tags.map((tag, tagIndex) => (
              <li key={tagIndex}>
                <span>
                  <CiShoppingTag />
                  {tag}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
