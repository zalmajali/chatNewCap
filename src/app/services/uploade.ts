import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { FilePicker,PickedFile  } from '@capawesome/capacitor-file-picker';
import { Filesystem, Directory  } from '@capacitor/filesystem';

// ✅ إصلاح 1: تعريف الـ interface خارج الـ class
export interface UploadResult {
  success: boolean;
  fileName: string;
  response?: any;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UploadService {

  private readonly uploadUrl = 'https://dev.taqnyat.sa/API/uploadeFile.php';

  constructor(private http: HttpClient) {}

  // ==================== 1. التقاط صورة من الكاميرا ====================
  async takePhoto(): Promise<UploadResult> {
    try {
      // ✅ إصلاح 2: استخدام getPhoto بدل takePhoto، وحذف allowEditing
      const photo = await Camera.getPhoto({
        quality: 90,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        correctOrientation: true,
      });

      const fileName = `photo_${Date.now()}.jpg`;
      return await this.uploadFromUri(photo.webPath!, fileName, 'image/jpeg');
    } catch (error: any) {
      alert('خطأ في takePhoto:'+error);
      return { success: false, fileName: '', error: error.message || 'فشل التقاط الصورة' };
    }
  }

  // ==================== 2. اختيار صورة من المعرض ====================
  async chooseFromGallery(): Promise<UploadResult> {
    try {
      // ✅ إصلاح 3: getPhoto مع source Photos بدل chooseFromGallery
      const photo = await Camera.getPhoto({
        quality: 90,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        correctOrientation: true,
      });

      const fileName = `media_${Date.now()}.jpg`;
      return await this.uploadFromUri(photo.webPath!, fileName, 'image/jpeg');
    } catch (error: any) {
      alert('خطأ في chooseFromGallery:'+ error);
      return { success: false, fileName: '', error: error.message || 'فشل اختيار من المعرض' };
    }
  }

  // ==================== 3. اختيار ملفات متعددة ====================
  async pickDocuments(allowMultiple: boolean = true): Promise<UploadResult[]> {
    try {
      const result = await FilePicker.pickFiles({
        types: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'image/*',
          'video/*'
        ],
        limit: allowMultiple ? 10 : 1,
        readData: false
      });

      const uploaded: UploadResult[] = [];

      for (const file of result.files) {
        const blob = await this.fileToBlob(file);
        const res = await this.uploadBlob(blob, file.name || `file_${Date.now()}`);
        uploaded.push(res);
      }

      return uploaded;
    } catch (error: any) {
      alert('خطأ في pickDocuments:'+JSON.stringify(error));
      return [{ success: false, fileName: '', error: error.message || 'فشل اختيار الملفات' }];
    }
  }
async pickVideo(allowMultiple: boolean = false): Promise<UploadResult[]> {
  try {
    const result = await FilePicker.pickFiles({
      types: ['video/*'],
      limit: allowMultiple ? 5 : 1,
      readData: false // ✅ false على الجهاز
    });

    const uploaded: UploadResult[] = [];

    for (const file of result.files) {
      let blob: Blob;
      const path = file.path ?? (file as any)['webPath'] ?? '';

      console.log('مسار الفيديو:', path);
      console.log('حجم الفيديو:', ((file.size || 0) / 1024 / 1024).toFixed(2) + ' MB');

      if (!path) {
        uploaded.push({ success: false, fileName: '', error: 'مسار الفيديو غير موجود' });
        continue;
      }

      try {
        // ✅ الحل الصح على الجهاز - استخدم Capacitor Filesystem
      
        
        const fileRead = await Filesystem.readFile({
          path: path,
        });

        const base64 = fileRead.data as string;
        const byteCharacters = atob(base64);
        const byteArray = new Uint8Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArray[i] = byteCharacters.charCodeAt(i);
        }
        blob = new Blob([byteArray], { type: file.mimeType || 'video/mp4' });

      } catch (fsError) {
        console.log('Filesystem فشل، جرب fetch:', fsError);
        // fallback للبراوزر
        const res = await fetch(path);
        blob = await res.blob();
      }

      const ext = file.name?.split('.').pop() || 'mp4';
      const fileName = `video_${Date.now()}.${ext}`;
      const res = await this.uploadBlob(blob, fileName, file.mimeType || 'video/mp4');
      uploaded.push(res);
    }

    return uploaded;

  } catch (error: any) {
    console.error('خطأ في pickVideo:', error);
    return [{ success: false, fileName: '', error: error.message || 'فشل اختيار الفيديو' }];
  }
}
  // ====================== دوال داخلية ======================
  private async uploadFromUri(webPath: string, fileName: string, mimeType: string): Promise<UploadResult> {
    const response = await fetch(webPath);
    const blob = await response.blob();
    return this.uploadBlob(blob, fileName, mimeType);
  }

  private async uploadBlob(blob: Blob, fileName: string, mimeType?: string): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', blob, fileName);

    try {
      const response = await fetch(this.uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      const result = await response.json();
      return { success: true, fileName, response: result };
    } catch (error: any) {
      console.error(`❌ فشل رفع ${fileName}:`, error);
      return { success: false, fileName, error: error.message };
    }
  }

  private async fileToBlob(file: PickedFile): Promise<Blob> {
    if (file.blob) return file.blob;

    const path = (file as any)['webPath'] ?? file.path ?? '';
    if (!path) throw new Error('مسار الملف غير موجود');

    const res = await fetch(path);
    if (!res.ok) throw new Error(`فشل fetch: ${res.status}`);
    return res.blob();
  }
}