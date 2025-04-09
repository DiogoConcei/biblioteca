import { useEffect, useState } from "react";
import { LiteratureChapter, Literatures } from "../types/series.interfaces";

export default function useSerie(serieName: string) {
  const [serie, setSerie] = useState<Literatures | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function getSerie() {
      setError(null);

      try {
        const data = await window.electron.manga.getManga(serieName);

        if (data) {
          setSerie(data);
        } else if (!data.chapters || data.chapters.length === 0) {
          setError("Nenhum capítulo encontrado");
        } else {
          setError("Nenhum dado foi encontrado para a série.");
        }
      } catch {
        setError("Falha ao recuperar série. Tente novamente");
      } finally {
        setTimeout(() => setLoading(false), 100);
      }
    }

    getSerie();
  }, [serieName]);

  async function updateSerie(path: string, newValue: any): Promise<void> {
    const keys = path.split(".");
    setSerie((prevSerie) => {
      if (!prevSerie) return prevSerie;
      const updated = { ...prevSerie };
      let current: any = updated;

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = newValue;

      return updated;
    });
  }

  async function updateChapters(
    paths: string | string[],
    newValue: any
  ): Promise<void> {
    const pathList = Array.isArray(paths) ? paths : [paths];

    setSerie((prev) => {
      if (!prev) return prev;

      const updatedChapters = [...prev.chapters];

      for (const path of pathList) {
        const keys = path.split(".");

        if (keys[0] !== "chapters") continue;

        // Subtrai 1 para converter de 1-based para 0-based
        const chapterIndex = Number(keys[1]) - 1;
        if (
          Number.isNaN(chapterIndex) ||
          chapterIndex < 0 ||
          chapterIndex >= updatedChapters.length
        )
          continue;

        const chapterCopy = { ...updatedChapters[chapterIndex] } as any;

        if (keys.length === 2) {
          updatedChapters[chapterIndex] = newValue;
          continue;
        }

        let target = chapterCopy;
        for (let i = 2; i < keys.length - 1; i++) {
          target[keys[i]] = { ...target[keys[i]] };
          target = target[keys[i]];
        }

        target[keys[keys.length - 1]] = newValue;
        updatedChapters[chapterIndex] = chapterCopy as LiteratureChapter;
      }

      return {
        ...prev,
        chapters: updatedChapters,
      };
    });
  }

  return { serie, updateSerie, updateChapters, error, loading };
}
