import { LiveArea, LiveAreaInterface } from 'clui-live'

export interface Backend {
    write ( key : string, level : string, message : string, data ?: object ) : void;

    clear ? () : void;

    createLive ? () : LiveArea;

    beginLive ? ( area : LiveAreaInterface ) : void;

    endLive ? () : void;
}