export interface DTOResponse <T> {
    code?: number;
    message?:string;
    data?: T;
}