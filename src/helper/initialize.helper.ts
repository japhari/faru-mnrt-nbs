import * as apiConf from '../config/config.json';
import * as mediatorRegisterConfig from '../config/mediator.json';
import * as mediatorLocalConfig from '../config/mediator.local.json';
import * as medUtils from 'openhim-mediator-utils';
import * as winston from 'winston';
import { nbsService } from '../services/nbs.service';

// Ensure winston has at least a console transport to avoid memory warning
winston.configure({
  transports: [
    new (winston.transports as any).Console({
      level: 'info',
    }),
  ],
});

function mergeConfig(newConfig: any) {
  const base = (mediatorLocalConfig as any).config;
  if (!newConfig) return base;
  return {
    ...base,
    ...newConfig,
    schedule: { ...base.schedule, ...(newConfig.schedule || {}) },
    request: { ...base.request, ...(newConfig.request || {}) },
    storage: { ...base.storage, ...(newConfig.storage || {}) },
    seeding: newConfig.seeding ?? base.seeding,
    sources: newConfig.sources ?? base.sources,
  };
}

export function start() {
  if (apiConf.register) {
    medUtils.registerMediator(apiConf.api, mediatorRegisterConfig, (err: any) => {
      if (err) {
        winston.error('Failed to register NBS mediator, using local config');
        nbsService.setConfig((mediatorLocalConfig as any).config);
        nbsService.startScheduler().catch((e) => {
          winston.error('Failed to start NBS scheduler with local config');
          console.error(e);
        });
        return;
      }

      apiConf.api.urn = mediatorRegisterConfig.urn;
      medUtils.fetchConfig(apiConf.api, (fetchErr: any, newConfig: any) => {
        if (fetchErr) {
          winston.error('Failed to fetch NBS config, using local config');
          nbsService.setConfig((mediatorLocalConfig as any).config);
        } else {
          nbsService.setConfig(mergeConfig(newConfig));
        }

        nbsService.startScheduler().catch((e) => {
          winston.error('Failed to start NBS scheduler');
          console.error(e);
        });

        if (apiConf.heartbeat) {
          const nbsEmitter = medUtils.activateHeartbeat(apiConf.api);
          nbsEmitter.on('config', (updatedConfig: any) => {
            nbsService.setConfig(mergeConfig(updatedConfig));
            nbsService.startScheduler().catch((e) => {
              winston.error('Failed to restart NBS scheduler after config update');
              console.error(e);
            });
          });
        }
      });
    });
  } else {
    // Local-only run: skip OpenHIM registration and use local mediator.json
    winston.info('Starting NBS mediator with local configuration (registration disabled)');
    nbsService.setConfig((mediatorLocalConfig as any).config);
    nbsService.startScheduler().catch((e) => {
      winston.error('Failed to start NBS scheduler with local config');
      console.error(e);
      process.exit(1);
    });
  }
}
