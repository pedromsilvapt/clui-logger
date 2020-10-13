import { Backend } from './Backend';
import path from 'path';
import fs from 'fs';
import makeDir from 'make-dir';
import tpl from 'mnml-tpl';
import { format } from "date-fns";
import stripAnsi from 'strip-ansi';
import { Semaphore } from 'data-semaphore';

export class FileBackend implements Backend {
    pattern : string;

    patternFactory : Function;

    protected lastFile : string;

    stream : fs.WriteStream;

    protected streamChangeSemaphore : Semaphore;

    constructor ( pattern : string ) {
        this.pattern = pattern;

        this.patternFactory = tpl( this.pattern );

        this.streamChangeSemaphore = new Semaphore( 1 );
    }

    protected getLocals () {
        const now = new Date();

        const locals = { 
            D: format( now, 'D' ),
            DD: format( now, 'DD' ), 
            M: format( now, 'M' ), 
            MM: format( now, 'MM' ), 
            Y: format( now, 'Y' ), 
            YY: format( now, 'YY' ),
            YYYY: format( now, 'YYYY' )
        };

        return locals;
    }

    protected writeRaw ( data : object ) : void {
        const file = this.patternFactory( this.getLocals() );
        
        if ( this.lastFile != file ) {
            this.lastFile = null;
        }

        if ( this.lastFile == null ) {
            this.streamChangeSemaphore.use( async () => {
                // Since we're using a semaphore, calls can be paused in a queue
                // And once resolved, the value of lastFile (which was != file
                // when they were initially called) might have changed.
                // As such we must check inside the semaphore as well
                if ( this.lastFile != file ) {
                    if ( this.stream ) {
                        this.stream.close();
                    }

                    await makeDir( path.dirname( file ) );
    
                    this.stream = fs.createWriteStream( file, { flags: 'a', encoding: 'utf8' } );
        
                    this.lastFile = file;
                }

                this.stream.write( JSON.stringify( data ) + '\n' );
            } ).catch( error => console.error( error ) );
        } else {
            this.stream.write( JSON.stringify( data ) + '\n' );
        }
    }

    write ( key : string, level : string, message : string, data ?: object ) : void {
        const timestamp = new Date().toISOString();

        this.writeRaw( { 
            timestamp, level, key, message: stripAnsi( message ), data
        } );
    }
}