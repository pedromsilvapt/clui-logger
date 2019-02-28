import { LiveAreaInterface } from 'clui-live';
import { SharedLogger, SharedLoggerInterface } from './internal';
import { Backend } from './Backends/Backend';
import { LiveLoggerInterface, LiveLogger } from './internal';
import { LoggerUtils } from './internal';

export interface LiveSharedLoggerInterface extends SharedLoggerInterface {
    begin () : this;

    end () : this;

    update ( fn : () => unknown ) : this;

    clear () : this;

    close () : this;
}

export class LiveSharedLogger extends SharedLogger implements LiveSharedLoggerInterface {
    protected updating = 0;

    protected area : LiveAreaInterface;

    constructor ( backend : Backend = null, prefix : string = null, area : LiveAreaInterface = null ) {
        super( backend, prefix );
        
        if ( this.backend && this.backend.createLive ) {
            this.area = this.backend.createLive();
        }
    }
    
    // Override
    log ( key : string, level : string, message : string, data ?: object ) : this {
        if ( this.updating === 0 ) {
            this.update( () => super.log( key, level, message, data ) );
        } else {
            super.log( key, level, message, data );
        }

        return this;
    }
    
    // Override
    shared () : LiveSharedLoggerInterface {
        return this;
    }

    // Override
    service ( key : string ) : LiveLoggerInterface {
        return new LiveLogger( this.backend, LoggerUtils.join( this.prefix, key ), this.area );
    }

    // Override
    live () : LiveSharedLoggerInterface {
        return this;
    }
    
    // Override
    static () : SharedLoggerInterface {
        return new SharedLogger( this.backend, this.prefix )
    }

    begin () : this {
        this.updating++;

        if ( this.updating === 1 && this.backend.beginLive ) {
            this.backend.beginLive( this.area );
        }

        return this;
    }
    
    end () : this {
        if ( this.updating > 0 ) {
            this.updating--;

            if ( this.updating === 0 && this.backend.endLive ) {
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
        if ( this.backend.clear ) {
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