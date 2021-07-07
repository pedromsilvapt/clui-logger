import { Backend } from './Backends/Backend';
import { LiveLoggerInterface, LiveLogger } from './internal';
import { SharedLoggerInterface, SharedLogger } from './internal';

export class LoggerUtils {
    public static join ( ...paths : string[] ) : string {
        paths = paths.filter( p => !!p );

        if ( paths.length == 0 ) {
            return null;
        }

        return paths.join( '/' );
    }
}

export interface LoggerInterface {
    log ( level : string, message : string, data ?: any ) : this;

    debug ( message : string, data ?: any ) : this;

    info ( message : string, data ?: any ) : this;

    warn ( message : string, data ?: any ) : this;

    error ( message : string, data ?: any ) : this;

    fatal ( message : string, data ?: any ) : this;

    live () : LiveLoggerInterface;

    static () : LoggerInterface;

    shared () : SharedLoggerInterface;

    service ( key : string ) : LoggerInterface;
}

export class Logger implements LoggerInterface {
    public prefix : string = null;

    public backend : Backend;

    constructor ( backend : Backend = null, prefix : string = null ) {
        this.backend = backend;
        this.prefix = prefix;
    }

    log ( level : string, message : string, data ?: any ) : this {
        if ( this.backend != null ) {
            this.backend.write( this.prefix, level, message, data );
        }

        return this;
    }

    debug ( message : string, data ?: any ) : this {
        return this.log( 'debug', message, data );
    }

    info ( message : string, data ?: any ) : this {
        return this.log( 'info', message, data );
    }

    warn ( message : string, data ?: any ) : this {
        return this.log( 'warn', message, data );
    }

    error ( message : string, data ?: any ) : this {
        return this.log( 'error', message, data );
    }

    fatal ( message : string, data ?: any ) : this {
        return this.log( 'fatal', message, data );
    }

    service ( key : string ) : Logger {
        return new Logger( this.backend, LoggerUtils.join( this.prefix, key ) );
    }

    shared () : SharedLogger {
        return new SharedLogger( this.backend, this.prefix );
    }

    live () : LiveLogger {
        return new LiveLogger( this.backend, this.prefix );
    }

    static () : Logger {
        return this;
    }
}