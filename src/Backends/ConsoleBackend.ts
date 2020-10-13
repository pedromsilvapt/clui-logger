import { Backend } from './Backend';
import { LiveAreaInterface, LiveArea } from 'clui-live';
import chalk from 'chalk';
import format from 'date-fns/format';

export const TIMESTAMP_SHORT = 'HH:mm:ss';
export const TIMESTAMP_SHORT_PAD = 8;

export const TIMESTAMP_LONG = 'HH:mm:ss, do MMM yyyy';
export const TIMESTAMP_LONG_PAD = 21;

export class ConsoleBackend implements Backend {
    levels = [ 'debug', 'info', 'warn', 'error', 'fatal' ];

    levelColors : { [ level: string ] : Function } = {
        'debug': chalk.grey,
        'info': chalk.cyan,
        'warn': chalk.yellow,
        'error': chalk.red,
        'fatal': chalk.magenta
    };

    levelsLength : number = Math.max( ...this.levels.map( level => level.length ) );

    areaClear : boolean = true;

    area : LiveAreaInterface = null;

    // When != null, prefix each message with the timestamp in the this format
    timestampFormat : string = null;

    timestampPadLength : number = 0;

    constructor ( timestampFormat : string = null ) {
        this.timestampFormat = timestampFormat;
    }

    inspector ( data : any ) { return ''; }

    format ( key : string, level : string, message : string, data ?: object ) {
        const color = this.levelColors[ level ];

        const levelString = color( `${ level }` ) + ' '.repeat( this.levelsLength + 1 - level.length );

        const prefixTimestamp = this.timestampFormat != null
            ? chalk.grey( format( Date.now(), this.timestampFormat ).padEnd( this.timestampPadLength, ' ' ) + ' ' )
            : '';

        const prefixService = key != null
            ? '[' + chalk.green( `${ key }` ) + '] '
            : '';

        return prefixTimestamp + levelString + prefixService + message + ' ' + ( data ? chalk.grey( this.inspector( data ) ) : '' );
    }

    write ( key : string, level : string, message : string, data ?: object ) : void {
        const output = this.format( key, level, message, data );

        if ( this.area === null ) {
            console.log( output );
        } else if ( this.areaClear ) {
            this.area.write( output );

            this.areaClear = false;
        } else {
            this.area.append( output );
        }
    }

    clear () : void {
        if ( this.area != null ) {
            this.area.clear();
        }
    }
    
    createLive () : LiveArea {
        return new LiveArea().hook();
    }

    beginLive ( area : LiveAreaInterface ) : void {
        this.area = area;

        this.areaClear = true;
    }

    endLive () : void {
        this.area = null;
    }
}