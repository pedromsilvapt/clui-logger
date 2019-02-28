import { Backend } from './Backend';
import { LiveArea, LiveAreaInterface } from 'clui-live';

export class MultiBackend implements Backend {
    backends : Backend[] = [];

    protected area : LiveArea = null;

    constructor ( backends : Iterable<Backend> = [] ) {
        this.backends = Array.from( backends );
    }

    addBackend ( backend : Backend ) {
        this.backends.push( backend );

        if ( this.area != null && backend.beginLive ) {
            backend.beginLive( this.area );
        }
    }

    write ( key : string, level : string, message : string, data ?: object ) : void {
        for ( let backend of this.backends ) {
            backend.write( key, level, message, data );
        }
    }
    
    createLive () : LiveArea {
        for ( let backend of this.backends ) {
            if ( backend.createLive ) {
                return backend.createLive();
            }
        }
    }

    beginLive ( area : LiveAreaInterface ) : void {
        for ( let backend of this.backends ) {
            if ( backend.beginLive ) {
                backend.beginLive( area );
            }
        }
    }

    endLive () : void {
        this.area = null;

        for ( let backend of this.backends ) {
            if ( backend.endLive ) {
                backend.endLive();
            }
        }
    }
}