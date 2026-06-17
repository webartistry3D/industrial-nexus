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
exports.GeofencingController = void 0;
const common_1 = require("@nestjs/common");
const geofencing_service_1 = require("./geofencing.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
class GPSUpdateDto {
}
let GeofencingController = class GeofencingController {
    constructor(geofencingService) {
        this.geofencingService = geofencingService;
    }
    async processGPSUpdate(tripId, gpsUpdate) {
        return this.geofencingService.processGPSUpdate(tripId, gpsUpdate);
    }
};
exports.GeofencingController = GeofencingController;
__decorate([
    (0, common_1.Post)('trips/:tripId/gps'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.OPERATIONS, client_1.UserRole.DRIVER),
    __param(0, (0, common_1.Param)('tripId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, GPSUpdateDto]),
    __metadata("design:returntype", Promise)
], GeofencingController.prototype, "processGPSUpdate", null);
exports.GeofencingController = GeofencingController = __decorate([
    (0, common_1.Controller)('geofencing'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [geofencing_service_1.GeofencingService])
], GeofencingController);
//# sourceMappingURL=geofencing.controller.js.map