import { LiveAreaInterface } from 'clui-live';
import { Logger, LoggerInterface, LoggerUtils } from './internal';
import { Backend } from './Backends/Backend';
import { LiveSharedLogger } from './internal';
import { SharedLoggerInterface } from './internal';

export interface LiveLoggerInterface extends LoggerInterface {
    begin () : this;

    end () : this;

    update ( fn : () => unknown ) : this;

    clear () : this;

    close () : this;
}

export class LiveLogger extends Logger implements LiveLoggerInterface {
    protected updating = 0;

    protected area : LiveAreaInterface;

    backend : Backend;

    constructor ( root : Backend, prefix : string, area : LiveAreaInterface = null ) {
        super( root, prefix );

        this.area = area;

        if ( this.backend && this.backend.createLive ) {
            this.area = this.backend.createLive();
        }
    }

    // Override
    log ( level : string, message : string, data ?: object ) : this {
        if ( this.updating === 0 ) {
            this.update( () => super.log( level, message, data ) );
        } else {
            super.log( level, message, data );
        }

        return this;
    }

    // Override
    shared () : LiveSharedLogger {
        return new LiveSharedLogger( this.backend, this.prefix, this.area );
    }

    // Override
    service ( key : string ) : LiveLogger {
        return new LiveLogger( this.backend, LoggerUtils.join( this.prefix, key ), this.area );
    }

    // Override
    live () : LiveLogger {
        return this;
    }

    // Override
    static () : Logger {
        return new Logger( this.backend, this.prefix );
    }

    begin () : this {
        this.updating++;

        if ( this.updating === 1 && this.backend != null && this.backend.beginLive ) {
            this.backend.beginLive( this.area );
        }

        return this;
    }
    
    end () : this {
        if ( this.updating > 0 ) {
            this.updating--;

            if ( this.updating === 0 && this.backend != null && this.backend.endLive ) {
                this.backend.endLive();
            }
        }

        return this;
    }

    update ( fn : () => unknown ) : this {
        this.begin();

        try {
            fn();
        } finally {
            this.end();
        }

        return this;
    }

    clear () : this {
        if ( this.backend != null && this.backend.clear ) {
            if ( this.updating == 0 ) {
                this.update( () => this.backend.clear() );
            } else {
                this.backend.clear();
            }
        }

        return this;
    }

    close () : this {
        this.area.close();

        // TODO Decide maybe? or maybe not?
        // this.updating = 0;

        return this;
    }
}



