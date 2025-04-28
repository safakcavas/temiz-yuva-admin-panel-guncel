/**
 * Tarih biçimlendirme yardımcı fonksiyonları
 */

/**
 * ISO 8601 formatındaki bir tarihi okunabilir formata dönüştürür
 * @param dateString ISO 8601 formatında tarih string'i
 * @param showTime Saat bilgisinin gösterilip gösterilmeyeceği
 * @returns Formatlanmış tarih string'i
 */
export const formatDate = (dateString: string, showTime = false): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // Geçerli bir tarih değilse
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    };
    
    if (showTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    return date.toLocaleDateString('tr-TR', options);
  } catch (err) {
    // Hata durumunda orjinal string'i döndür
    console.error('Tarih formatlanırken hata:', err);
    return dateString;
  }
};

/**
 * Kısa tarih formatı (gün.ay.yıl)
 * @param dateString ISO 8601 formatında tarih string'i
 * @returns Kısa formatlı tarih string'i
 */
export const formatShortDate = (dateString: string): string => {
  return formatDate(dateString, false);
};

/**
 * Uzun tarih formatı (gün.ay.yıl saat:dakika)
 * @param dateString ISO 8601 formatında tarih string'i
 * @returns Uzun formatlı tarih string'i
 */
export const formatLongDate = (dateString: string): string => {
  return formatDate(dateString, true);
};

/**
 * Geçen süreyi hesaplar (örn: "2 saat önce", "3 gün önce")
 * @param dateString ISO 8601 formatında tarih string'i
 * @returns Geçen süre string'i
 */
export const timeAgo = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    
    // Geçerli bir tarih değilse
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (secondsAgo < 60) {
      return 'Az önce';
    }
    
    const minutesAgo = Math.floor(secondsAgo / 60);
    if (minutesAgo < 60) {
      return `${minutesAgo} dakika önce`;
    }
    
    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo < 24) {
      return `${hoursAgo} saat önce`;
    }
    
    const daysAgo = Math.floor(hoursAgo / 24);
    if (daysAgo < 30) {
      return `${daysAgo} gün önce`;
    }
    
    const monthsAgo = Math.floor(daysAgo / 30);
    if (monthsAgo < 12) {
      return `${monthsAgo} ay önce`;
    }
    
    const yearsAgo = Math.floor(monthsAgo / 12);
    return `${yearsAgo} yıl önce`;
  } catch (err) {
    console.error('Tarih hesaplanırken hata:', err);
    return dateString;
  }
};

/**
 * İki tarih arasındaki farkı gün cinsinden hesaplar
 * @param startDate Başlangıç tarihi
 * @param endDate Bitiş tarihi (varsayılan: şimdi)
 * @returns Gün cinsinden fark
 */
export const daysBetween = (startDate: string, endDate?: string): number => {
  try {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    // Geçerli bir tarih değilse
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0;
    }
    
    // Sadece tarih kısmını al (saat olmadan)
    const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    
    // Milisaniye farkını gün cinsine çevir
    const diffTime = Math.abs(endDateOnly.getTime() - startDateOnly.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (err) {
    console.error('Tarih hesaplanırken hata:', err);
    return 0;
  }
}; 