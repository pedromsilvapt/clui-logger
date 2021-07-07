import { Backend } from './Backends/Backend';
import { LoggerInterface, LoggerUtils, Logger } from './internal';
import { LiveSharedLoggerInterface, LiveSharedLogger } from './internal';

export interface SharedLoggerInterface {
    backend : Backend;

    log ( key : string, level : string, message : string, data ?: any ) : this;

    debug ( key : string, message : string, data ?: any ) : this;

    info ( key : string, message : string, data ?: any ) : this;

    warn ( key : string, message : string, data ?: any ) : this;

    error ( key : string, message : string, data ?: any ) : this;

    fatal ( key : string, message : string, data ?: any ) : this;

    shared () : SharedLoggerInterface;

    service ( key : string ) : LoggerInterface;

    live () : LiveSharedLoggerInterface;
    
    static () : SharedLoggerInterface;
}

export class SharedLogger implements SharedLoggerInterface {
    public prefix : string = null;

    public backend : Backend;

    constructor ( backend : Backend = null, prefix : string = null ) {
        this.backend = backend;
        this.prefix = prefix;
    }

    log ( key : string, level : string, message : string, data ?: any ) : this {
        if ( this.backend != null ) {
            this.backend.write( LoggerUtils.join( this.prefix, key ), level, message, data );
        }

        return this;
    }

    debug ( key : string, message : string, data ?: any ) : this {
        return this.log( key, 'debug', message, data );
    }

    info ( key : string, message : string, data ?: any ) : this {
        return this.log( key, 'info', message, data );
    }

    warn ( key : string, message : string, data ?: any ) : this {
        return this.log( key, 'warn', message, data );
    }

    error ( key : string, message : string, data ?: any ) : this {
        return this.log( key, 'error', message, data );
    }

    fatal ( key : string, message : string, data ?: any ) : this {
        return this.log( key, 'fatal', message, data );
    }

    shared () : SharedLogger {
        return this;
    }

    service ( key : string ) : Logger {
        return new Logger( this.backend, LoggerUtils.join( this.prefix, key ) );
    }

    live () : LiveSharedLogger {
        return new LiveSharedLogger( this.backend, this.prefix )
    }
    
    static () : SharedLogger {
        return this;
    }
}
