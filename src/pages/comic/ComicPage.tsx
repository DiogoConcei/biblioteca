import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Comic, ComicEdition } from "../../types/comic.interfaces";
import "./ComicPage.css";

export default function ComicPage() {
  const [comicData, setComicData] = useState<Comic | null>(null);
  const { comic_name } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      (async () => {
        try {
          const comic = await window.electron.comic.getComic(comic_name);
          setComicData(comic);
        } catch (e) {
          console.error(`Erro ao carregar quadrinho: ${e}`);
        }
      })();
    }, 0);

    return () => clearTimeout(timer);
  }, [comic_name]);

  if (!comicData) return;

  const openChapter = async (
    e: React.MouseEvent<HTMLDivElement>,
    comic: Comic,
    chapter: ComicEdition
  ) => {
    e.stopPropagation();

    const { name: serieName, id: serieId } = comic;
    const { name: chapterName, id: chapterId, page, isRead } = chapter;

    const safeOpen = await window.electron.download.checkDownload(
      serieName,
      chapterId
    );

    if (safeOpen) {
      navigate(
        `/${serieName}/${serieId}/${chapterName}/${chapterId}/${page.lastPageRead}/${isRead}`
      );
    } else {
      await window.electron.download.singleDownload(
        comicData.dataPath,
        chapterId
      );
      navigate(
        `/${serieName}/${serieId}/${chapterName}/${chapterId}/${page.lastPageRead}/${isRead}`
      );
    }
  };

  return (
    <section className="comicEditions">
      {comicData.chapters.map((comicEdition) => (
        <div
          key={comicEdition.id}
          className="comicContainer"
          onClick={(e) => openChapter(e, comicData, comicEdition)}
        >
          <img
            className="comicCover"
            src={`data:image/webp;base64,${comicEdition.coverPath}`}
            alt={`Capa do quadrinho ${comicEdition.name}`}
          />
          <p className="editionName">{comicEdition.name}</p>
        </div>
      ))}
    </section>
  );
}
