import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/utils/rate-limit';

export function middleware(request: NextRequest) {
  // APIルートに対してのみレート制限を適用
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const rateLimitResponse = rateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
