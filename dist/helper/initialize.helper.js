"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = start;
const apiConf = __importStar(require("../config/config.json"));
const mediatorConfig = __importStar(require("../config/mediator.json"));
const medUtils = __importStar(require("openhim-mediator-utils"));
const winston = __importStar(require("winston"));
const nbs_service_1 = require("../services/nbs.service");
winston.configure({
    transports: [
        new winston.transports.Console({
            level: 'info',
        }),
    ],
});
function start() {
    if (apiConf.register) {
        medUtils.registerMediator(apiConf.api, mediatorConfig, (err) => {
            if (err) {
                winston.error('Failed to register NBS mediator, using local config');
                nbs_service_1.nbsService.setConfig(mediatorConfig.config);
                nbs_service_1.nbsService.startScheduler().catch((e) => {
                    winston.error('Failed to start NBS scheduler with local config');
                    console.error(e);
                });
                return;
            }
            apiConf.api.urn = mediatorConfig.urn;
            medUtils.fetchConfig(apiConf.api, (fetchErr, newConfig) => {
                if (fetchErr) {
                    winston.error('Failed to fetch NBS config, using local config');
                    nbs_service_1.nbsService.setConfig(mediatorConfig.config);
                }
                else {
                    nbs_service_1.nbsService.setConfig(newConfig);
                }
                nbs_service_1.nbsService.startScheduler().catch((e) => {
                    winston.error('Failed to start NBS scheduler');
                    console.error(e);
                });
                if (apiConf.heartbeat) {
                    const nbsEmitter = medUtils.activateHeartbeat(apiConf.api);
                    nbsEmitter.on('config', (updatedConfig) => {
                        nbs_service_1.nbsService.setConfig(updatedConfig);
                        nbs_service_1.nbsService.startScheduler().catch((e) => {
                            winston.error('Failed to restart NBS scheduler after config update');
                            console.error(e);
                        });
                    });
                }
            });
        });
    }
    else {
        winston.info('Starting NBS mediator with local configuration (registration disabled)');
        nbs_service_1.nbsService.setConfig(mediatorConfig.config);
        nbs_service_1.nbsService.startScheduler().catch((e) => {
            winston.error('Failed to start NBS scheduler with local config');
            console.error(e);
            process.exit(1);
        });
    }
}
//# sourceMappingURL=initialize.helper.js.map