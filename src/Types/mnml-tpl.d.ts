declare module "mnml-tpl" {
    export default function tpl ( pattern : string ) : ( locals : object ) => string;
}