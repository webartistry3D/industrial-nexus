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
exports.WeightWatchController = void 0;
const common_1 = require("@nestjs/common");
const weight_watch_service_1 = require("./weight-watch.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
class ValidateWeightDto {
}
let WeightWatchController = class WeightWatchController {
    constructor(weightWatchService) {
        this.weightWatchService = weightWatchService;
    }
    async validateWeight(validateDto) {
        return this.weightWatchService.validateTripWeight(validateDto.cargoWeight, validateDto.vehicleId, validateDto.handlingTags);
    }
    getWeightAlerts() {
        return this.weightWatchService.getWeightAlerts();
    }
};
exports.WeightWatchController = WeightWatchController;
__decorate([
    (0, common_1.Post)('validate'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.OPERATIONS),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ValidateWeightDto]),
    __metadata("design:returntype", Promise)
], WeightWatchController.prototype, "validateWeight", null);
__decorate([
    (0, common_1.Get)('alerts'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.OPERATIONS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WeightWatchController.prototype, "getWeightAlerts", null);
exports.WeightWatchController = WeightWatchController = __decorate([
    (0, common_1.Controller)('weight-watch'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [weight_watch_service_1.WeightWatchService])
], WeightWatchController);
//# sourceMappingURL=weight-watch.controller.js.map