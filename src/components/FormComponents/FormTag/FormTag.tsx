// import "./FormTag.css";
// import { useState } from "react";
// import { FormTagProps } from "../../../types/components.interfaces";
// import { CiShoppingTag } from "react-icons/ci";

// export default function FormTag({
//   handleDataChange,
//   setFormData,
// }: FormTagProps) {
//   const [tags, setTags] = useState<string[]>([]);

//   const addTags = () => {
//     setFormData((prevData) => ({
//       ...prevData,
//       tags: [...prevData.tags, ...tags],
//     }));
//     setTags([]);
//     handleDataChange("tags", tags.join(","));
//   };

//   const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const value = e.target.value;
//     const tagArray = value.split(",").map((tag) => tag.trim());
//     setTags(tagArray);
//   };

//   return (
//     <div>
//       <div className="form-tag">
//         <h2 className="form-subtitle">Tags: </h2>

//         <div className="form-tag-input">
//           <input
//             type="text"
//             placeholder="Digite tags separadas por vírgula"
//             onChange={handleTagInput}
//             onKeyDown={(e) => {
//               if (e.key === "Enter") {
//                 e.preventDefault();
//                 addTags();
//               }
//             }}
//           />
//         </div>

//         <div className="form-tag-preview">
//           <h3 className="form-subtitle">Tags Inseridas:</h3>
//           <ul className="tag-list">
//             {tags.map((tag, tagIndex) => (
//               <li key={tagIndex}>
//                 <CiShoppingTag />
//                 {tag}
//               </li>
//             ))}
//           </ul>
//         </div>
//       </div>
//     </div>
//   );
// }
