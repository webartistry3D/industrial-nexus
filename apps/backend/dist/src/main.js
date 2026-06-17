"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.enableCors({
        origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003'],
        credentials: true,
    });
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('PORT', 3001);
    await app.listen(port);
    console.log(`Industrial Nexus API running on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map