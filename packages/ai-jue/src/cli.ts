#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { handler as initHandler, builder as initBuilder, describe as initDescribe, command as initCommandStr } from './commands/init';
import { handler as applyHandler, builder as applyBuilder, describe as applyDescribe, command as applyCommandStr } from './commands/apply';
import { handler as createPresetHandler, builder as createPresetBuilder, describe as createPresetDescribe, command as createPresetCommandStr } from './commands/create-preset';
import { handler as checkHandler, builder as checkBuilder, describe as checkDescribe, command as checkCommandStr } from './commands/check';
import { handler as validateHandler, builder as validateBuilder, describe as validateDescribe, command as validateCommandStr } from './commands/validate';
import { handler as listHandler, builder as listBuilder, describe as listDescribe, command as listCommandStr } from './commands/list';
import { logger, LogLevel } from './logger';

yargs(hideBin(process.argv))
  .option('verbose', {
      alias: 'v',
      type: 'boolean',
      description: 'Run with verbose logging'
  })
  .middleware((argv) => {
      if (argv.verbose) {
          logger.setLevel(LogLevel.DEBUG);
          logger.debug('Verbose mode enabled');
      }
  })
  .command(initCommandStr, initDescribe, initBuilder as any, initHandler)
  .command(applyCommandStr, applyDescribe, applyBuilder as any, applyHandler)
  .command(createPresetCommandStr, createPresetDescribe, createPresetBuilder as any, createPresetHandler)
  .command(checkCommandStr, checkDescribe, checkBuilder as any, checkHandler)
  .command(validateCommandStr, validateDescribe, validateBuilder as any, validateHandler)
  .command(listCommandStr, listDescribe, listBuilder as any, listHandler)
  .demandCommand(1, 'You need at least one command before moving on')
  .help()
  .argv;