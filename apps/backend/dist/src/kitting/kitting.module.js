"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KittingModule = void 0;
const common_1 = require("@nestjs/common");
const kitting_service_1 = require("./kitting.service");
const kitting_controller_1 = require("./kitting.controller");
const audit_module_1 = require("../audit/audit.module");
let KittingModule = class KittingModule {
};
exports.KittingModule = KittingModule;
exports.KittingModule = KittingModule = __decorate([
    (0, common_1.Module)({
        imports: [audit_module_1.AuditModule],
        controllers: [kitting_controller_1.KittingController],
        providers: [kitting_service_1.KittingService],
        exports: [kitting_service_1.KittingService],
    })
], KittingModule);
//# sourceMappingURL=kitting.module.js.map