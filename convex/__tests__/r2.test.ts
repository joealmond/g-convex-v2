import { test, expect, describe } from 'vitest';
import { formatR2Url } from '../r2';

describe('Cloudflare R2 URL Proxy formatter', () => {
  
  test('Virtual Hosted-Style URL is rewritten to Path-Style', () => {
    // AWS SDK defaults to this format: https://bucket.endpoint.com/key
    const bucket = 'g-matrix';
    const signedUrl = 'https://g-matrix.059b88471a81c454f0d235d85176131d.r2.cloudflarestorage.com/image-123.jpg?X-Amz-Signature=abc';
    
    const formattedUrl = formatR2Url(signedUrl, bucket);
    
    // Cloudflare REQUIRES Path-Style format: https://endpoint.com/bucket/key
    expect(formattedUrl).toBe('https://059b88471a81c454f0d235d85176131d.r2.cloudflarestorage.com/g-matrix/image-123.jpg?X-Amz-Signature=abc');
  });

  test('Already Path-Style URLs are left unmodified', () => {
    // If AWS SDK correctly obeyed forcePathStyle (which it sometimes ignores with presigners)
    const bucket = 'g-matrix';
    const signedUrl = 'https://059b88471a81c454f0d235d85176131d.r2.cloudflarestorage.com/g-matrix/image-123.jpg?X-Amz-Signature=abc';
    
    const formattedUrl = formatR2Url(signedUrl, bucket);
    
    // Should remain entirely unchanged
    expect(formattedUrl).toBe(signedUrl);
  });
});
