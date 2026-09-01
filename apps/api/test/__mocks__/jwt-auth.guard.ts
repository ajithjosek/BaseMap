import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    // Inject a mock user so @CurrentUser() works
    request.user = {
      userId: '550e8400-e29b-41d4-a716-446655440001',
      email: 'test@example.com',
      tenantId: '550e8400-e29b-41d4-a716-446655440000',
    };
    return true;
  }
}
