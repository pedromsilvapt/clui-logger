import { Backend } from './Backend';
import { LiveContainerInterface, LiveAreaInterface, LiveContainer, LiveArea } from 'clui-live';
import chalk from 'chalk';

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

    container : LiveContainerInterface;

    area : LiveAreaInterface = null;

    inspector ( data : any ) { return ''; }

    format ( key : string, level : string, message : string, data ?: object ) {
        const color = this.levelColors[ level ];

        const levelString = color( `${ level }` ) + ' '.repeat( this.levelsLength + 1 - level.length );

        if ( key != null ) {
            return levelString + '[' + chalk.green( `${ key }` ) + '] ' + message + ' ' + ( data ? chalk.grey( this.inspector( data ) ) : '' );
        } else {
            return levelString + message + ' ' + ( data ? chalk.grey( this.inspector( data ) ) : '' );
        }
    }

    write ( key : string, level : string, message : string, data ?: object ) : void {
        const output = this.format( key, level, message, data );

        if ( this.area === null ) {
            console.log( output );
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
        if ( this.container == null ) {
            this.container = new LiveContainer().hook();
        }

        return this.container.createLiveArea();
    }

    beginLive ( area : LiveAreaInterface ) : void {
        this.area = area;

        this.area.clear();
    }

    endLive () : void {
        this.area = null;
    }
}