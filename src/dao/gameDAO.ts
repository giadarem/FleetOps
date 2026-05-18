import { IGameDAO } from './IgameDAO';
import Game from '../models/game';
import { Transaction, Op } from 'sequelize';
import User from '../models/User';
import { GameStatus } from '../enum/gameStatus';

/**
 * @class GameDAO
 * @description DAO responsabile dell’accesso ai dati dell’entità Game tramite Sequelize.
 * Si colloca nel livello DAO dell’architettura e incapsula le operazioni di persistenza,
 * ricerca e aggiornamento delle partite, incluse quelle eseguite in transazione.
 */
export class GameDAO implements IGameDAO {
    
    /**
     * @method create
     * @description Crea una nuova partita nel database.
     *
     * @param obj Dati della partita da salvare.
     * @returns Partita creata.
     */
    public async create(obj: any): Promise<Game> {
        return await Game.create(obj);
    }

    /**
     * @method fetchSingle
     * @description Recupera una singola partita tramite il suo identificativo.
     * Supporta l’esecuzione in transazione e l’eventuale lock della riga per operazioni atomiche.
     *
     * @param id Identificativo della partita da recuperare.
     * @param transaction Transazione Sequelize opzionale.
     * @param lock Indica se applicare un lock alla riga recuperata.
     * @returns Partita trovata oppure null se non esiste.
     */
    public async fetchSingle(
        id: string,
        transaction?: Transaction,
        lock: boolean = false
    ): Promise<Game | null> {
        return await Game.findByPk(id, {
            transaction,
            lock: lock || undefined
        });
    }

    /**
     * @method fetchAll
     * @description Recupera tutte le partite presenti nel database.
     *
     * @returns Lista completa delle partite.
     */
    public async fetchAll(): Promise<Game[]> {
        return await Game.findAll();
    }

    /**
     * @method delete
     * @description Elimina una partita dal database tramite il suo identificativo.
     *
     * @param id Identificativo della partita da eliminare.
     * @returns True se la partita è stata eliminata, false altrimenti.
     */
    public async delete(id: string): Promise<boolean> {
        const deleted = await Game.destroy({ where: { id } });
        return deleted > 0;
    }

    /**
     * @method update
     * @description Aggiorna i dati di una partita esistente.
     *
     * @param id Identificativo della partita da aggiornare.
     * @param obj Dati da applicare alla partita.
     * @returns True se almeno una riga è stata aggiornata, false altrimenti.
     */
    public async update(id: string, obj: any): Promise<boolean> {
        const [updated] = await Game.update(obj, { where: { id } });
        return updated > 0;
    }

    /**
     * @method findActiveByUserId
     * @description Cerca una partita attiva associata a un utente.
     * Controlla sia il ruolo di primo giocatore sia quello di secondo giocatore,
     * con supporto opzionale a transazioni e lock per garantire consistenza.
     *
     * @param userId Identificativo dell’utente coinvolto nella partita.
     * @param transaction Transazione Sequelize opzionale.
     * @param lock Indica se applicare un lock alla riga recuperata.
     * @returns Partita attiva trovata oppure null se l’utente non ha partite attive.
     */
    public async findActiveByUserId(
        userId: string,
        transaction?: Transaction,
        lock: boolean = false
    ): Promise<Game | null> {
        return await Game.findOne({
            where: {
                [Op.or]: [
                    { player1Id: userId },
                    { player2Id: userId }
                ],
                status: GameStatus.ACTIVE
            },
            transaction,
            lock: lock || undefined
        });
    }

    /**
     * @method createWithTransaction
     * @description Crea una nuova partita all’interno di una transazione Sequelize.
     * Viene utilizzato quando la creazione della partita deve essere atomica rispetto
     * ad altre operazioni di scrittura correlate.
     *
     * @param gameData Dati della partita da creare.
     * @param transaction Transazione Sequelize da utilizzare.
     * @returns Partita creata.
     */
    public async createWithTransaction(gameData: any, transaction: Transaction): Promise<Game> {
        return await Game.create(gameData, { transaction });
    }

    /**
     * @method updateStateWithTransaction
     * @description Salva lo stato aggiornato di una partita, eventualmente all’interno di una transazione.
     * Centralizza la persistenza dell’istanza Game già modificata dai livelli superiori.
     *
     * @param game Istanza della partita da salvare.
     * @param transaction Transazione Sequelize opzionale.
     * @returns Partita aggiornata.
     */
    public async updateStateWithTransaction(game: Game, transaction?: Transaction): Promise<Game> {
        return await game.save({ transaction });
    }


    /**
     * @method fetchUserGamesWithEmails
     * @description Recupera lo storico delle partite associate a un utente includendo le email dei partecipanti.
     * Esegue l’eager-loading delle relazioni con gli utenti coinvolti nella partita,
     * così da restituire dati già arricchiti per la consultazione lato service/controller.
     *
     * @param userId Identificativo dell’utente di cui recuperare le partite.
     * @returns Lista delle partite dell’utente con le email dei giocatori e dell’eventuale vincitore.
     */
    public async fetchUserGamesWithEmails(userId: string): Promise<Game[]> {
        // Importa User e Op in cima al file gameDAO.ts se non ci sono:
        // import { Op } from 'sequelize';
        // import User from '../models/User';
        
        return await Game.findAll({
            where: {
                [Op.or]: [{ player1Id: userId }, { player2Id: userId }]
            },
            include: [
                { model: User, as: 'Player1', attributes: ['email'] },
                { model: User, as: 'Player2', attributes: ['email'] },
                { model: User, as: 'Winner', attributes: ['email'] }
            ],
            order: [['createdAt', 'DESC']]
        });
    }
}