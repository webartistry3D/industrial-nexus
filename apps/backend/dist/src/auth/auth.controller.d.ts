import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Request } from 'express';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto, req: Request): Promise<import("./dto/token-response.dto").TokenResponseDto>;
    register(registerDto: RegisterDto): Promise<import("./dto/token-response.dto").TokenResponseDto>;
    refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<import("./dto/token-response.dto").TokenResponseDto>;
    logout(user: {
        userId: string;
    }, refreshToken: string, req: Request): Promise<{
        message: string;
    }>;
}
