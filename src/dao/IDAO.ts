/**
 * @interface IDAO
 * @description Interfaccia generica per le operazioni CRUD.
 * Utilizza i Generics <T> per essere riutilizzabile con qualsiasi modello 
 */
export interface IDAO<T> {
    create(obj: T): Promise<T | boolean>; 
    delete(id: number | string): Promise<boolean>; 
    update(id: number | string, obj: T): Promise<boolean>; 
    fetchSingle(id: number | string): Promise<T | null>; 
    fetchAll(): Promise<T[]>; 
}