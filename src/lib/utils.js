import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
} 


export const isIframe = window.self !== window.top;

export function getThumbnailUrl(url, width = 300) {
  if (!url || typeof url !== 'string') return url;
  
  if (url.includes('/storage/v1/object/public/')) {
    if (url.includes('?')) return url; 
    return url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + `?width=${width}&resize=contain`;
  }
  
  return url;
}