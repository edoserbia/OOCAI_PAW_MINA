import { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import { ComponentConfig } from '@/lib/templateConfigs'
import { ChevronDown, ChevronUp, X, PlusCircle } from 'lucide-react'

interface ComponentProps extends Omit<ComponentConfig, 'type'> {
  value: string | string[] | Array<{
    characterId: string;
    characterName: string;
    content: string;
  }>;
  onChange: (value: string | string[] | Array<{
    characterId: string;
    characterName: string;
    content: string;
  }>) => void;
  characters?: Array<{ id: string; name: string; avatar: string }>;
}

export function TextInput({ id, title, width, height, placeholder, value, onChange }: ComponentProps) {
  return (
    <div className="mb-4 w-full">
      <label htmlFor={id} className="block text-sm font-medium text-white mb-2">
        {title}
      </label>
      <div className="relative w-full">
        <textarea
          id={id}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none scrollbar-hide"
          style={{ height: `${height || 100}px` }}
        />
      </div>
    </div>
  )
}

export function CharacterSelection({ id, title, options = [], value, onChange }: ComponentProps) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-white mb-2">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => {
              const newValue = Array.isArray(value) ? value : []
              const index = newValue.indexOf(option)
              if (index > -1) {
                newValue.splice(index, 1)
              } else {
                newValue.push(option)
              }
              onChange(newValue)
            }}
            className={`w-12 h-12 rounded-full ${
              Array.isArray(value) && value.includes(option) ? 'bg-amber-500' : 'bg-gray-600'
            } flex items-center justify-center text-white text-sm`}
          >
            {option[0]}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ImageUpload({ id, title, width, height, value, onChange }: ComponentProps) {
  const [previewUrl, setPreviewUrl] = useState(value as string || '')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
        onChange(file.name)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-white mb-2">{title}</h3>
      <div className="flex items-center space-x-4">
        <label className="cursor-pointer bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600">
          Upload Image
          <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
        </label>
        {previewUrl && (
          <div style={{ width: `${width || 200}px`, height: `${height || 200}px` }} className="relative">
            <Image src={previewUrl} alt="Preview" layout="fill" objectFit="cover" className="rounded-lg" />
          </div>
        )}
      </div>
    </div>
  )
}

export function MusicSelection({ id, title, value, onChange, width }: ComponentProps) {
  const [selectedMusic, setSelectedMusic] = useState<string | null>(value as string || null);

  useEffect(() => {
    console.log('MusicSelection value changed:', {
      id,
      value,
      selectedMusic
    });
  }, [id, value, selectedMusic]);

  return (
    <div className="mb-4" style={{ width: `${width || '100%'}` }}>
      <label htmlFor={id} className="block text-sm font-medium text-white mb-2">
        {title}
      </label>
      <div className="relative w-full">
        <select
          id={id}
          value={selectedMusic || ''}
          onChange={(e) => {
            const newValue = e.target.value;
            console.log('MusicSelection onChange:', {
              id,
              newValue,
              previousValue: selectedMusic
            });
            setSelectedMusic(newValue);
            onChange(newValue);
          }}
          className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">Select background music</option>
          <option value="1">Energetic Music</option>
          <option value="2">Decent Music</option>
          <option value="3">Kind-hearted Music</option>
          <option value="4">Charming Music</option>
          <option value="5">Confident Music</option>
          <option value="6">Sweet Music</option>
        </select>
      </div>
    </div>
  );
}

export function VoiceSelection({ id, title, options = [], value, onChange }: ComponentProps) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium text-white mb-2">{title}</h3>
      <select
        id={id}
        value={value as string}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        <option value="">Select character voice</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

export function OpeningLineInput({ id, title, width, height, placeholder, value, onChange, characters = [], maxOpeningLines = 5, minOpeningLines = 1 }: ComponentProps) {
  const [openingLines, setOpeningLines] = useState<Array<{
    characterId: string;
    characterName: string;
    content: string;
  }>>([]);

  // 初始化开场白列表
  useEffect(() => {
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && 'characterId' in value[0]) {
      setOpeningLines(value as Array<{
        characterId: string;
        characterName: string;
        content: string;
      }>);
    } else if (!openingLines.length) {
      // 如果没有开场白，添加一个默认的
      setOpeningLines([{
        characterId: characters[0]?.id || '',
        characterName: characters[0]?.name || 'Narrator',
        content: ''
      }]);
    }
  }, [value, characters]);

  const allCharacters = useMemo(() => {
    const hasNarrator = characters.some(char => char.name === 'Narrator');
    if (!hasNarrator) {
      return [{ id: 'narrator', name: 'Narrator', avatar: '' }, ...characters];
    }
    return characters;
  }, [characters]);

  const handleCharacterSelect = (index: number, characterId: string) => {
    const character = allCharacters.find(c => c.id === characterId);
    if (character) {
      const newLines = [...openingLines];
      newLines[index] = {
        ...newLines[index],
        characterId: character.id,
        characterName: character.name
      };
      setOpeningLines(newLines);
      onChange(newLines);
    }
  };

  const handleContentChange = (index: number, content: string) => {
    const newLines = [...openingLines];
    newLines[index] = {
      ...newLines[index],
      content
    };
    setOpeningLines(newLines);
    onChange(newLines);
  };

  const addOpeningLine = () => {
    if (openingLines.length < maxOpeningLines) {
      const newLine = {
        characterId: characters[0]?.id || '',
        characterName: characters[0]?.name || 'Narrator',
        content: ''
      };
      setOpeningLines([...openingLines, newLine]);
      onChange([...openingLines, newLine]);
    }
  };

  const removeOpeningLine = (index: number) => {
    if (openingLines.length > minOpeningLines) {
      const newLines = openingLines.filter((_, i) => i !== index);
      setOpeningLines(newLines);
      onChange(newLines);
    }
  };

  return (
    <div className="mb-4 w-full">
      <label className="block text-sm font-medium text-white mb-2">
        {title}
      </label>
      <div className="space-y-4">
        {openingLines.map((line, index) => (
          <div key={index} className="relative space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <select
                  value={line.characterId}
                  onChange={(e) => handleCharacterSelect(index, e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {allCharacters.map((character) => (
                    <option key={character.id} value={character.id}>
                      {character.name}
                    </option>
                  ))}
                </select>
              </div>
              {openingLines.length > minOpeningLines && (
                <button
                  onClick={() => removeOpeningLine(index)}
                  className="p-2 text-red-500 hover:text-red-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <textarea
              value={line.content}
              onChange={(e) => handleContentChange(index, e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none scrollbar-hide"
              style={{ height: `${height || 100}px` }}
            />
          </div>
        ))}
        {openingLines.length < maxOpeningLines && (
          <button
            onClick={addOpeningLine}
            className="w-full mt-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Add Opening Line</span>
          </button>
        )}
      </div>
    </div>
  );
}

