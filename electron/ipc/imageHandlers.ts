import { IpcMain } from 'electron';
import ImageManager from '../services/processing/ImageManager';
import { APIResponse } from '../types/electron-auxiliar.interfaces';

export default function imageHandlers(ipcMain: IpcMain) {
  const imageManager = new ImageManager();

  ipcMain.handle(
    'image:get-cover-gallery',
    async (_event, coverGalleryPath: string): Promise<APIResponse<string[]>> => {
      try {
        const data = await imageManager.getSerieCoverGallery(coverGalleryPath);
        return { success: true, data: data };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },
  );

  ipcMain.handle(
    'image:add-cover',
    async (
      _event,
      coverGalleryPath: string,
      sourcePath: string,
    ): Promise<APIResponse<string>> => {
      try {
        const mediaUrl = await imageManager.addToCoverGallery(
          coverGalleryPath,
          sourcePath,
        );
        return { success: true, data: mediaUrl };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },
  );
}
