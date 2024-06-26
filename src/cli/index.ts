import { CommandModule } from 'yargs';
import yargs from 'yargs/yargs';

import updateCommand from '../commands/update/index.js';

export function setupCli() {
  const commands = [updateCommand];

  const cli = yargs(process.argv.slice(2));

  cli.command(commands as unknown as CommandModule[]);

  cli
    .help()
    .check((argv) => {
      return commands.some((command) => argv._.includes(command.name));
    })
    .parse();

  return cli;
}

export default setupCli;
