import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  root() {
    return {
      service: 'VonHelm API',
      status: 'ok',
      message:
        'This URL is the backend only. Deploy apps/web on Vercel for the login screen.',
      endpoints: {
        authConfig: '/api/auth/config',
        login: 'POST /api/auth/login',
      },
    };
  }
}
