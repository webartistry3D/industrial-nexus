"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KittingController = void 0;
const common_1 = require("@nestjs/common");
const kitting_service_1 = require("./kitting.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
class StartKittingDto {
}
class ProgressKittingDto {
}
class VerifyBarcodeDto {
}
let KittingController = class KittingController {
    constructor(kittingService) {
        this.kittingService = kittingService;
    }
    startKitting(dto, user) {
        return this.kittingService.startKitting(dto.orderId, user.userId);
    }
    progressKitting(orderId, dto, user) {
        return this.kittingService.progressKitting(orderId, user.userId, dto);
    }
    completeKitting(orderId, user) {
        return this.kittingService.completeKitting(orderId, user.userId);
    }
    getKittingLogs(orderId) {
        return this.kittingService.getKittingLogs(orderId);
    }
    verifyBarcode(orderId, dto, user) {
        return this.kittingService.verifyBarcode(orderId, user.userId, dto.barcode);
    }
};
exports.KittingController = KittingController;
__decorate([
    (0, common_1.Post)('start'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.OPERATIONS),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [StartKittingDto, Object]),
    __metadata("design:returntype", void 0)
], KittingController.prototype, "startKitting", null);
__decorate([
    (0, common_1.Post)(':orderId/progress'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.OPERATIONS),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ProgressKittingDto, Object]),
    __metadata("design:returntype", void 0)
], KittingController.prototype, "progressKitting", null);
__decorate([
    (0, common_1.Post)(':orderId/complete'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.OPERATIONS),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], KittingController.prototype, "completeKitting", null);
__decorate([
    (0, common_1.Get)(':orderId/logs'),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], KittingController.prototype, "getKittingLogs", null);
__decorate([
    (0, common_1.Post)(':orderId/verify-barcode'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.OPERATIONS),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, VerifyBarcodeDto, Object]),
    __metadata("design:returntype", void 0)
], KittingController.prototype, "verifyBarcode", null);
exports.KittingController = KittingController = __decorate([
    (0, common_1.Controller)('kitting'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [kitting_service_1.KittingService])
], KittingController);
//# sourceMappingURL=kitting.controller.js.map