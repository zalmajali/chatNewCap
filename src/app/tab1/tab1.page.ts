import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/angular/standalone';
import { UploadService, UploadResult } from '../services/uploade';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton],
})
export class Tab1Page {
  constructor(private uploadService: UploadService) {}

  // 1. كاميرا
  async testTakePhoto() {
    const result: UploadResult = await this.uploadService.takePhoto();
    if (result.success) {
      alert(`✅ تم رفع الصورة: ${result.fileName}`);
    } else {
      alert(`❌ فشل: ${result.error}`);
    }
  }

  // 2. معرض - ✅ إصلاح: ترجع UploadResult مش UploadResult[]
  async testChooseFromGallery() {
    const result: UploadResult = await this.uploadService.chooseFromGallery();
    if (result.success) {
      alert(`✅ تم رفع الصورة: ${result.fileName}`);
    } else {
      alert(`❌ فشل: ${result.error}`);
    }
  }
async testPickVideo() {
  const results: UploadResult[] = await this.uploadService.pickVideo(false);
  if (results[0].success) {
    alert(`✅ تم رفع الفيديو: ${results[0].fileName}`);
  } else {
    alert(`❌ فشل: ${results[0].error}`);
  }
}
  // 3. ملفات متعددة
  async testPickDocuments() {
    const results: UploadResult[] = await this.uploadService.pickDocuments(true);
    const success = results.filter(r => r.success).length;
    const fail = results.filter(r => !r.success).length;
    alert(`✅ نجح: ${success} | ❌ فشل: ${fail}`);
  }
}