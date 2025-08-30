import { Controller } from 'react-hook-form';
import { FormControllerProps } from '../../../../types/auxiliar.interfaces';
import { useState } from 'react';
import './CollectionsField.scss';

export default function CollectionsField({ control }: FormControllerProps) {
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [availableCollections, setAvailableCollections] = useState([]);
  const [newCollection, setNewCollection] = useState('');

  return (
    <Controller
      name="metadata.collections"
      control={control}
      render={({ field }) => {
        const handleCheckboxChange = (collection: string, checked: boolean) => {
          const updated = checked
            ? [...field.value, collection]
            : field.value.filter((c: string) => c !== collection);
          field.onChange(updated);
        };

        const handleButtonClick = () => {
          if (
            isCreatingCollection &&
            newCollection &&
            !availableCollections.includes(newCollection)
          ) {
            field.onChange([...field.value, newCollection]);
            setAvailableCollections([...availableCollections, newCollection]);
            setNewCollection('');
          }
          setIsCreatingCollection(!isCreatingCollection);
        };

        return (
          <div className="form-collection-container">
            <h2 className="form-subtitle">Incluir na coleção:</h2>
            <div className="form-collection">
              {availableCollections.map((collection, index) => (
                <span key={index}>
                  <input
                    type="checkbox"
                    value={collection}
                    checked={field.value.includes(collection)}
                    onChange={(e) =>
                      handleCheckboxChange(collection, e.target.checked)
                    }
                  />
                  <label>{collection}</label>
                </span>
              ))}
            </div>

            {isCreatingCollection && (
              <input
                type="text"
                value={newCollection}
                placeholder="Digite o nome da nova coleção"
                onChange={(e) => setNewCollection(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleButtonClick()}
              />
            )}

            <button type="button" onClick={handleButtonClick}>
              {isCreatingCollection ? 'Salvar Coleção' : 'Adicionar coleção'}
            </button>
          </div>
        );
      }}
    />
  );
}
