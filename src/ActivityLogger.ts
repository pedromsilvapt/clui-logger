import { LiveLoggerInterface, LoggerInterface } from './internal';
import { Stopwatch } from 'data-stopwatch';
import chalk from 'chalk';

export interface ActivityLoggerHFPArea {
    key : string;
    area : LiveLoggerInterface;
    timeout : any;
    acquired : number;
}

export interface ActivityLoggerHFP {
    pattern : RegExp;
    keyer ?: ( match : RegExpMatchArray ) => string;
    maxTtl ?: number;
    areas : Map<string, ActivityLoggerHFPArea>;
}

export interface ActivityLoggerFilter<A> {
    ( activity : A ) : boolean;
}

export interface Activity {
    hfp ?: ActivityLoggerHFP,
    live ?: LiveLoggerInterface,
    stopwatch ?: Stopwatch,
}

export abstract class ActivityLogger<A extends Activity, P = RegExp, M = string[]> {
    logger : LoggerInterface;

    protected skip : ActivityLoggerFilter<A>;

    protected highFrequencyPatterns : ActivityLoggerHFP[] = [];

    /**
     * Controls how many seconds a high frequency pattern will be available to be rewritten.
     * After this timeouts, the live area responsible for this pattern will be automatically
     * closed and any new requests will create a new one
     */
    public highFrequencyMaxTtl : number = 60;

    constructor ( logger : LoggerInterface, skip ?: ActivityLoggerFilter<A> ) {
        this.logger = logger;
        this.skip = skip;
    }

    protected abstract findHighFrequencyPattern ( activity : A ) : ActivityLoggerHFP;

    protected abstract matchHighFrequencyPattern ( pattern : ActivityLoggerHFP, activity : A ) : string[];

    protected abstract logBeginActivity ( activity : A ) : void;

    protected abstract logEndActivity ( activity : A ) : void;

    protected acquireHFPLiveArea ( hfp : ActivityLoggerHFP, activity : A ) : LiveLoggerInterface {
        const match = this.matchHighFrequencyPattern( hfp, activity )

        const key = hfp.keyer ? hfp.keyer( match ) : ( match[ 1 ] || match[ 0 ] );

        let existingArea = hfp.areas.get( key );

        if ( existingArea == null ) {
            existingArea = { key: key, area: this.logger.live(), timeout: null, acquired: 1 };

            hfp.areas.set( key, existingArea );
        } else {
            existingArea.acquired += 1;
        }

        return existingArea.area;
    }

    protected releaseHFPLiveArea ( hfp : ActivityLoggerHFP, activity : A ) {
        const match = this.matchHighFrequencyPattern( hfp, activity );

        const key = hfp.keyer ? hfp.keyer( match ) : ( match[ 1 ] || match[ 0 ] );

        let existingArea = hfp.areas.get( key );

        if ( existingArea ) {
            existingArea.acquired -= 1;

            if ( existingArea.acquired == 0 ) {
                if ( existingArea.timeout != null ) {
                    clearTimeout( existingArea.timeout );
                }

                existingArea.timeout = setTimeout( () => {
                    existingArea.timeout = null;

                    if ( existingArea.acquired == 0 ) {
                        hfp.areas.delete( existingArea.key );

                        existingArea.area.close();
                    }
                }, ( hfp.maxTtl || this.highFrequencyMaxTtl ) * 1000 );
            }
        }
    }

    registerHighFrequencyPattern ( pattern : RegExp, keyer : ( match : string[] ) => string = null, maxTtl : number = null ) {
        this.highFrequencyPatterns.push( { pattern, keyer, maxTtl, areas: new Map() } );
    }

    begin ( activity : A ) {
        if ( !this.skip || !this.skip( activity ) ) {
            const hfp = this.findHighFrequencyPattern( activity );

            const live = hfp ? this.acquireHFPLiveArea( hfp, activity ) : this.logger.live();

            activity.hfp = hfp;
            activity.live = live;
            activity.stopwatch = new Stopwatch().resume();

            this.logBeginActivity( activity );
        }
    }

    end ( activity : A ) {
        if ( activity.live ) {
            this.logEndActivity( activity );
            
            if ( activity.hfp != null ) {
                this.releaseHFPLiveArea( activity.hfp, activity );
            } else {
                activity.live.close();
            }
        }
    }
}

export interface Request { 
    method?: string;
    url?: string;
    activity ?: HttpActivity;
}

export interface Response { 
    statusCode?: number;
}

export interface HttpActivity extends Activity {
    req: Request;
    res: Response;
}

export class HttpRequestLogger extends ActivityLogger<HttpActivity> {
    protected logBeginActivity ( action : HttpActivity ) : void {
        const { req, live } = action;

        live.info( `${ chalk.green( req.method.toUpperCase() ) } ${ chalk.grey( req.url ) } ${ chalk.grey( 'running...' ) }` );
    }

    protected logEndActivity ( activity: HttpActivity ) : void {
        const { req, res, stopwatch, live } = activity;

        const statusCode = res.statusCode >= 200 && res.statusCode <= 299
            ? chalk.grey( res.statusCode.toString() )
            : chalk.red( res.statusCode.toString() );

        live.info( `${ chalk.green( req.method.toUpperCase() ) } ${ chalk.cyan( req.url ) } ${ statusCode } ${ stopwatch.readHumanized() }` )
    }

    protected findHighFrequencyPattern ( activity : HttpActivity ) : ActivityLoggerHFP {
        for ( const pattern of this.highFrequencyPatterns ) {
            const url : string = activity.req.url;

            if ( pattern.pattern.test( url ) ) {
                return pattern;
            }
        }

        return null;
    }

    protected matchHighFrequencyPattern ( pattern : ActivityLoggerHFP, activity : HttpActivity ) {
        const url : string = activity.req.url;

        return url.match( pattern.pattern );
    }

    before () {
        return ( req : Request, res : Response, next : Function ) => {
            const activity : HttpActivity = { req, res };

            this.begin( activity );

            req.activity = activity;

            return next();
        };
    }

    after () {
        return ( req : Request, res : Response ) => {
            if ( req.activity ) {
                this.end( req.activity );

                req.activity = null;
            }
        };
    }
}