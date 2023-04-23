import './internal';
import chalk from 'chalk';

export { Logger, LoggerInterface, LoggerUtils } from './Logger';

export { LiveLogger, LiveLoggerInterface } from './LiveLogger';

export { SharedLogger, SharedLoggerInterface } from './SharedLogger';

export { LiveSharedLogger, LiveSharedLoggerInterface } from './LiveSharedLogger';

export { Backend } from './Backends/Backend';

export { ConsoleBackend } from './Backends/ConsoleBackend';

export { FileBackend } from './Backends/FileBackend';

export { MultiBackend } from './Backends/MultiBackend';

export { FilterBackend, LogPredicate, LogPredicateParseError } from './Backends/FilterBackend';

export { ActivityLogger, Activity, ActivityLoggerHFP, HttpActivity, HttpRequestLogger } from './ActivityLogger';

export function pp(raw: TemplateStringsArray, ...variables: unknown[]) {
    return String.raw({raw}, ...variables.map(value => {
        if (value === null) {
            return chalk.yellow('(null)');
        } else if (typeof value === 'undefined') {
            return chalk.yellow('(undefined)');
        } else if (typeof value === 'string') {
            return chalk.yellow(JSON.stringify(value));
        } else if (typeof value === 'number') {
            return chalk.cyan(value.toString());
        } else if (typeof value === 'boolean') {
            return value ? chalk.green('true') : chalk.red('false');
        } else if (typeof value === 'object') {
            return JSON.stringify(value, null, 2);
        }
    }));
}
