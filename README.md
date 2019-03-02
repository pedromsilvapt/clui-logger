# clui-logger
> Easy to use logger for both small and serious apps that writes both to the terminal and to files

## Installation
```shell
npm install --save clui-logger
```

## Usage
```typescript
import { Logger, MultiBackend, ConsoleBackend, FileBackend } from 'clui-logger';

const logger = new Logger( new MultiBackend( [
    new ConsoleBackend(),
    new FileBackend( 'test/log.log' )
] ) );

// Any type of log can have a payload
logger.debug( 'Debug log message' );
logger.info( 'Info log message' );
logger.warn( 'Warn log message' );
logger.error( 'Error log message' );
logger.fatal( 'Fatal error with a payload', new Error() );

logger.service( 'clui-logger' ).info( 'Prefixed info message' );

// Create an auto-updating log message: on the console rewrites the previous line, and on a file just appends the new message
const live = logger.live();

live.info( 'Progress 0/3' );
live.info( 'Progress 1/3' );
live.info( 'Progress 2/3' );
live.info( 'Progress 3/3' );

logger.shared().info( 'clui-logger/shared', 'Shared loggers can have variable prefixes' );
logger.shared().info( 'clui-logger', 'A different prefix' );

// Service loggers can create a hierarchy
logger.service( 'clui-logger' ).service( 'shared' ).info( 'This log is associated with the service clui-logger/shared' );
```