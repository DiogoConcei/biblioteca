import { MdFormatListBulletedAdd } from "react-icons/md";
import { CollectionButtonProps } from "../../types/components.interfaces";
import { Collection } from "../../types/collections.interfaces";
import { useEffect, useState } from "react";
import "./CollectionButton.css";

export default function CollectionButton({ dataPath }: CollectionButtonProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isAdd, setIsAdd] = useState<boolean>(false);

  useEffect(() => {
    const getData = async () => {
      const collectionsData =
        await window.electron.collections.getCollections();
      setCollections(collectionsData);
    };

    getData();
  });

  const filterCollections = [...collections]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 3);

  const onToggle = () => {
    setIsAdd((prevState) => !prevState);
  };

  const toCollection = async (
    e: React.MouseEvent<HTMLButtonElement>,
    collectionName: string
  ) => {
    window.electron.collections.serieToCollection(dataPath);
  };

  return (
    <div>
      <button className="collection" onClick={onToggle}>
        <MdFormatListBulletedAdd />
        Coleção
      </button>

      {isAdd && (
        <ul className="dropdown-list">
          {filterCollections.map((collection) => (
            <li key={collection.name} className="dropdown-item">
              <button
                className="dropdown-option"
                onClick={(e) => toCollection(e, collection.name)}>
                {collection.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
