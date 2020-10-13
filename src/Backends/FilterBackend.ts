import { LiveArea, LiveAreaInterface } from 'clui-live';
import { Backend } from './Backend';

export class LogPredicateParseError extends Error { }

export enum PatternLogLevel {
    GreaterThan = 0,
    GreaterThanEqual = 1,
    Equal = 2,
    LessThanEqual = 3,
    LessThan = 4,
    Different = 5
}

const LOG_LEVELS = [ 'debug', 'info', 'warn', 'error', 'fatal' ];

export class LogPredicate {
    public static PATTERN = /(!)?(<=|<|=|>=|>|!=)?(debug|warn|info|error|fatal)?\s*(\[[a-zA-Z0-9\-_\*.\/]*\])?/;

    public static operatorsToEnum : { [ op : string ] : PatternLogLevel } = {
        '<': PatternLogLevel.LessThan,
        '<=': PatternLogLevel.LessThanEqual,
        '>=': PatternLogLevel.GreaterThanEqual,
        '>': PatternLogLevel.GreaterThan,
        '=': PatternLogLevel.Equal,
        '!=': PatternLogLevel.Different,
    };

    public static parse ( input : string | LogPredicate ) : LogPredicate {
        if ( !input ) {
            throw new LogPredicateParseError( 'Value is null' );
        }
        
        if ( typeof input === 'string' ) {
            const match = input.match( this.PATTERN );

            if ( !match ) {
                throw new LogPredicateParseError( 'Log Pattern is not a valid format.' );
            }

            const negative = match[ 1 ] == '!';

            const levelRel = match[ 2 ] ? LogPredicate.operatorsToEnum[ match[ 2 ] ] : PatternLogLevel.GreaterThanEqual;

            const level = match[ 3 ] || 'debug';

            let namespace = match[ 4 ] ? new RegExp( match[ 4 ].slice( 1, -1 ).replace( /\//, '\/' ).replace( /\*/, '(.*)' ) ) : null;

            return new LogPredicate( levelRel, level, namespace, negative );
        } else {
            return input;
        }
    }

    public static tryParse ( input : string | LogPredicate ) : LogPredicate {
        try {
            return LogPredicate.parse( input );
        } catch ( error ) {
            if ( error instanceof LogPredicateParseError ) {
                return null;
            }

            throw error;
        }
    }

    protected comp : PatternLogLevel;

    protected level : string;

    protected namespace : RegExp;

    public readonly negative : boolean;

    constructor ( comp : PatternLogLevel, level : string, namespace : RegExp, negative : boolean = false ) {
        this.comp = comp;
        this.level = level;
        this.namespace = namespace;
        this.negative = negative;
    }

    protected testLevel ( level : string ) : boolean {
        const logLevel = LOG_LEVELS.indexOf( level );
        const targetLevel = LOG_LEVELS.indexOf( this.level );
        
        switch ( this.comp ) {
            case PatternLogLevel.LessThan: return logLevel < targetLevel;
            case PatternLogLevel.LessThanEqual: return logLevel <= targetLevel;
            case PatternLogLevel.Equal: return logLevel == targetLevel;
            case PatternLogLevel.Different: return logLevel != targetLevel;
            case PatternLogLevel.GreaterThan: return logLevel > targetLevel;
            case PatternLogLevel.GreaterThanEqual: return logLevel >= targetLevel;
            default: return false;
        }
    }

    test ( key : string, level : string, message : string, area ?: LiveArea ) : boolean {
        if ( !this.testLevel( level ) ) {
            return false;
        }

        if ( this.namespace != null && ( !key || !this.namespace.test( key ) ) ) {
            return false;
        }

        return true;
    }

    equals ( predicate : LogPredicate ) : boolean {
        return this.level == predicate.level
            && this.comp == predicate.comp
            && this.namespace == predicate.namespace
            && this.negative == predicate.negative;
    }
}

export type LogPredicateLike = LogPredicate | string;

export class FilterBackend<B extends Backend = Backend> implements Backend {
    public readonly base : B;

    public predicates : LogPredicate[];

    public allowEmptyPredicates : boolean = true;

    constructor ( base : B, predicates : LogPredicateLike[] | LogPredicateLike = [] ) {
        if ( !predicates ) {
            predicates = [];
        }

        if ( !( predicates instanceof Array ) ) {
            predicates = [ predicates ];
        }

        this.base = base;
        this.predicates = predicates.map( pred => LogPredicate.parse( pred ) );
    }

    addPredicate ( predicateLike : LogPredicateLike, distinct : boolean = false ) {
        const predicate = LogPredicate.parse( predicateLike );

        if ( distinct && this.predicates.some( pred => pred.equals( predicate ) ) ) {
            return;
        }

        this.predicates.push( predicate );
    }

    test ( key : string, level : string, message : string ) : boolean {
        if ( this.allowEmptyPredicates && this.predicates.length == 0 ) {
            return true;
        }

        let allowed = this.predicates[ 0 ].negative;

        for ( let predicate of this.predicates ) {
            if ( predicate.negative && allowed && predicate.test( key, level, message ) ) {
                allowed = false;
            } else if ( !predicate.negative && !allowed && predicate.test( key, level, message ) ) {
                allowed = true;
            }
        }

        return allowed;
    }

    write ( key : string, level : string, message : string, data ?: object ) : void {
        if ( this.test( key, level, message ) ) {
            this.base.write( key, level, message, data );
        }
    }

    clear ? () : void {
        if ( this.base.clear ) {
            return this.base.clear();
        }
    }
    
    createLive ? () : LiveArea {
        if ( this.base.createLive ) {
            return this.base.createLive();
        }
    }

    beginLive ? ( area : LiveAreaInterface ) : void {
        if ( this.base.beginLive ) {
            this.base.beginLive( area );
        }
    }

    endLive ? () : void {
        if ( this.base.endLive ) {
            this.base.endLive();
        }
    }
}