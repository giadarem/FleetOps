/**
 * @interface IDAO
 * @description Interfaccia generica che definisce il contratto base per le operazioni CRUD.
 * Si colloca nel livello DAO dell’architettura e garantisce una struttura uniforme
 * per l’accesso ai dati delle diverse entità applicative.
 *
 * @template T Tipo dell’entità gestita dal DAO.
 * @template ID Tipo dell’identificativo primario dell’entità.
 */
export interface IDAO<T, ID> {
    /**
     * @method create
     * @description Inserisce una nuova entità nel sistema di persistenza.
     *
     * @param obj Dati dell’entità da creare.
     * @returns Entità creata.
     */
    create(obj: any): Promise<T>;
    
    /**
     * @method delete
     * @description Elimina un’entità tramite il suo identificativo.
     *
     * @param id Identificativo dell’entità da eliminare.
     * @returns True se l’eliminazione è avvenuta, false altrimenti.
     */
    delete(id: ID): Promise<boolean>;
    
    /**
     * @method update
     * @description Aggiorna i dati di un’entità esistente.
     *
     * @param id Identificativo dell’entità da aggiornare.
     * @param obj Dati da applicare all’entità.
     * @returns True se l’aggiornamento è avvenuto, false altrimenti.
     */
    update(id: ID, obj: any): Promise<boolean>;
    
    /**
     * @method fetchSingle
     * @description Recupera una singola entità tramite il suo identificativo.
     *
     * @param id Identificativo dell’entità da recuperare.
     * @returns Entità trovata oppure null se non esiste.
     */
    fetchSingle(id: ID): Promise<T | null>;
    
    /**
     * @method fetchAll
     * @description Recupera tutte le entità disponibili nel sistema di persistenza.
     *
     * @returns Lista completa delle entità gestite.
     */
    fetchAll(): Promise<T[]>;
}