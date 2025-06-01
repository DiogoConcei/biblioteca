import { useState } from 'react';
import { List } from 'lucide-react';

import { CollectionButtonProps } from '../../types/components.interfaces';
import useCollection from '../../hooks/useCollection';

import './CollectionButton.scss';

export default function CollectionButton({ dataPath }: CollectionButtonProps) {
  const { collections, addToCollection } = useCollection();

  const [isAdd, setIsAdd] = useState<boolean>(false);

  const filterCollections = [...collections]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  const onToggle = () => {
    setIsAdd(prevState => !prevState);
  };

  return (
    <div>
      <button className="collection" onClick={onToggle}>
        <List />
        Coleção
      </button>

      {isAdd && (
        <ul className="dropdown-list">
          {filterCollections.map(collection => (
            <li key={collection.name} className="dropdown-item">
              <button
                className="dropdown-option"
                onClick={e => addToCollection(e, collection.name, dataPath)}
              >
                {collection.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
