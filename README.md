## Introduzione

Il seguente progetto è stato sviluppato come parte dell’esame di **Programmazione Avanzata** per l’A.A. **2024/2025**, presso l’**Università Politecnica delle Marche**, all’interno del Corso di Laurea Magistrale in **Ingegneria Informatica e dell’Automazione (LM-32)**.

Il progetto propone un sistema backend per la gestione del gioco della **Battaglia Navale**, consentendo agli utenti autenticati di giocare sia contro altri utenti reali, nella modalità **PvP**, sia contro un avversario gestito automaticamente dal sistema, nella modalità **PvE**.

Il sistema supporta la presenza di più partite contemporaneamente, garantendo però che ciascun utente possa partecipare attivamente a una sola partita alla volta. Questa scelta consente di mantenere una gestione coerente dello stato di gioco e di evitare conflitti tra partite attive associate allo stesso utente.

Il backend gestisce l’intero ciclo di vita della partita: autenticazione degli utenti, controllo del credito token, creazione della partita, esecuzione delle mosse, aggiornamento dello stato, salvataggio dello storico, abbandono della partita, conclusione della partita e aggiornamento del punteggio dei giocatori.

L’applicazione è stata sviluppata utilizzando **Node.js**, **TypeScript**, **Express**, **Sequelize** e **PostgreSQL**. L’autenticazione degli utenti è basata su **JWT**, mentre l’ambiente di esecuzione è stato predisposto tramite **Docker** e **Docker Compose**, così da semplificare la configurazione e l’avvio del progetto.

Dal punto di vista progettuale, il backend segue un’architettura a livelli:

```text
Routes → Middleware → Controller → Service → Repository → DAO → Model
```


## Obiettivi di progetto

L’obiettivo principale del progetto è la realizzazione di un backend REST per la gestione del gioco della **Battaglia Navale**, sviluppato secondo le specifiche dell’esame di **Programmazione Avanzata**.

Il sistema deve permettere a utenti autenticati di giocare partite di Battaglia Navale in due modalità differenti:

- **PvP**, ovvero una partita tra due utenti reali;
- **PvE**, ovvero una partita tra un utente reale e un avversario gestito automaticamente dal sistema.

Il backend deve inoltre garantire una corretta gestione degli utenti, delle partite, del credito token, dello stato di gioco e dello storico delle mosse, mantenendo la coerenza dei dati anche durante operazioni complesse.

Gli obiettivi specifici del progetto sono:

- implementare un sistema di **autenticazione tramite JWT**, in modo da proteggere le rotte riservate agli utenti autenticati;
- gestire due ruoli applicativi distinti, `USER` e `ADMIN`;
- consentire agli utenti con ruolo `USER` di creare partite, effettuare mosse, abbandonare partite e consultare storico e stato del gioco;
- consentire agli utenti con ruolo `ADMIN` di ricaricare il credito token degli utenti, creare partite, effettuare mosse, abbandonare partite e consultare storico e stato del gioco;
- gestire un sistema di **credito token**, in cui la creazione di una partita e l’esecuzione di una mossa hanno un costo;
- impedire che un utente possa partecipare contemporaneamente a più di una partita attiva;
- supportare la creazione di partite tra due utenti reali nella modalità **PvP**;
- supportare la creazione di partite contro il sistema nella modalità **PvE**;
- gestire automaticamente il comportamento dell’avversario nella modalità PvE;
- salvare lo **storico delle mosse**, in un file JSON, effettuate durante una partita;
- mantenere aggiornato lo **stato della partita**, compreso il turno corrente, il vincitore e la conclusione della partita;
- gestire l’abbandono di una partita e l’assegnazione del vincitore;
- aggiornare il punteggio degli utenti e fornire una classifica generale;
- centralizzare la gestione degli errori applicativi;



## Struttura del progetto

Il progetto è organizzato seguendo un’architettura a livelli, con una separazione chiara tra gestione delle rotte, middleware, controller, logica applicativa, accesso ai dati e modelli del database.

La struttura principale del progetto è la seguente:

```text
.
├── src/
│   ├── config/
│   ├── controllers/
│   ├── dao/
│   ├── enum/
│   ├── middlewares/
│   ├── models/
│   ├── patterns/
│   ├── repository/
│   ├── routes/
│   ├── services/
│   ├── types/
│   ├── utils/
│   └── index.ts
│
├── sql/
│   ├── 00_migration.sql
│   └── 01_seed.sql
│
├── tests/
|
├── jwt/
|
├── .env
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
├── package-lock.json
├── tsconfig.json
├── jest.config.js
└── README.md
```




## Pattern utilizzati

All’interno del progetto sono stati adottati diversi pattern architetturali e progettuali con l’obiettivo di organizzare il codice in modo modulare, leggibile e manutenibile.

L’utilizzo dei pattern consente di separare le responsabilità tra i vari componenti del backend, evitando di concentrare tutta la logica in un unico punto e rendendo il sistema più semplice da estendere, testare e modificare.

I principali pattern e principi applicati nel progetto sono:

- Model-Controller-Service;
- Repository;
- DAO;
- Dependency Injection;
- Unit of Work;
- Singleton;
- Factory;
- Chain of Responsibility;
- Classe base astratta;
- Enum.

---

### Model-Controller-Service

Il pattern **Model-Controller-Service** è un pattern architetturale utilizzato nello sviluppo di applicazioni backend modulari.

A differenza del classico pattern **MVC** (*Model-View-Controller*), non prevede la presenza delle viste, poiché il progetto espone API REST e non pagine HTML renderizzate lato server. L’attenzione è quindi posta sulla gestione delle richieste HTTP, sulla logica applicativa e sull’interazione con il database.

Nel progetto di **Battaglia Navale**, questo pattern viene applicato attraverso tre componenti principali: **Model**, **Controller** e **Service**.

#### Model

Il **Model** rappresenta la struttura dati dell’applicazione e definisce le entità persistenti salvate nel database.

Nel progetto i principali modelli sono:

- `User`;
- `Game`.

Il modello `User` rappresenta gli utenti registrati nel sistema e contiene informazioni come email, password cifrata, ruolo, credito token residuo e punteggio.

Il modello `Game` rappresenta invece una partita e contiene informazioni come tipologia di partita, giocatori coinvolti, stato della partita, vincitore e stato completo del gioco.

I modelli interagiscono con il database PostgreSQL tramite **Sequelize**, ORM che permette di astrarre parte della logica SQL sottostante e di lavorare con classi e metodi TypeScript più vicini alla logica applicativa.

Questa scelta consente di mantenere il codice più ordinato e di evitare l’utilizzo diretto di query SQL nei livelli superiori dell’applicazione.

#### Controller

Il **Controller** è il componente responsabile della gestione delle richieste HTTP in ingresso.

Nel progetto sono presenti controller dedicati alle principali aree funzionali:

- `AuthController`;
- `UserController`;
- `GameController`.

Il controller riceve la richiesta dal client, legge eventuali parametri, body e informazioni dell’utente autenticato, e inoltra i dati necessari al service corrispondente.

Ad esempio, il `GameController` non contiene direttamente la logica per creare una partita, eseguire una mossa o abbandonare una partita, ma delega queste operazioni ai service dedicati.

In questo modo il controller rimane uno strato leggero, occupandosi principalmente della comunicazione tra client e applicazione.

#### Service

Il **Service** è il componente in cui risiede la logica di business dell’applicazione.

Nel progetto i service principali sono:

- `AuthService`;
- `UserService`;
- `BaseGameService`;
- `PvPGameService`;
- `PvEGameService`.

I service gestiscono le operazioni più complesse del sistema, come:

- autenticazione dell’utente;
- generazione del JWT;
- controllo del credito token;
- creazione delle partite;
- validazione della griglia e della configurazione delle navi;
- controllo di una sola partita attiva per utente;
- gestione delle mosse;
- aggiornamento dello storico;
- verifica della vittoria;
- assegnazione dei punti;
- abbandono della partita;
- gestione delle transazioni.

Nel caso della logica di gioco, il progetto utilizza un service base, `BaseGameService`, che contiene funzionalità comuni alle partite PvP e PvE.

Le classi `PvPGameService` e `PvEGameService` specializzano poi il comportamento in base alla modalità di gioco.

Il Service Layer si interfaccia con le Repository, evitando di accedere direttamente ai DAO o ai model Sequelize.

---

### Repository

Il **Repository** è un pattern architetturale che introduce uno strato di astrazione tra la logica di business e la persistenza dei dati.

Nel progetto di **Battaglia Navale**, il Repository è collocato tra il **Service Layer** e il **DAO Layer**.

```text
Service → Repository → DAO → Model
```

I repository principali sono:

- `UserRepository`;
- `GameRepository`.

Il loro compito è fornire al Service Layer metodi più espressivi e orientati al dominio applicativo.

Ad esempio, un service non deve conoscere direttamente come viene costruita una query Sequelize per recuperare un utente, una partita o una classifica. Al contrario, richiama metodi del repository che rappresentano operazioni più vicine alla logica del progetto.

Esempi di metodi concettuali sono:

```text
getUserById
getUserByEmail
getActiveGameByUserId
createGame
updateGame
getGlobalLeaderboard
```

Nel progetto, il Repository permette quindi di mantenere pulita la logica applicativa, nascondendo i dettagli tecnici dell’accesso ai dati.

Questa scelta è utile perché:

- separa la logica di business dalla persistenza;
- rende i service più leggibili;
- evita dipendenze dirette tra service e Sequelize;
- semplifica eventuali modifiche future al livello dati.

---

### DAO

Il **DAO** (*Data Access Object*) è un pattern strutturale che ha lo scopo di isolare la logica di accesso al database dal resto dell’applicazione.

Nel progetto di **Battaglia Navale**, il DAO rappresenta il livello più vicino ai modelli Sequelize e si occupa delle operazioni concrete sulle entità persistenti.

I DAO principali del progetto sono:

- `UserDAO`;
- `GameDAO`.

Sono inoltre presenti interfacce dedicate:

- `IDAO`;
- `IuserDAO`;
- `IgameDAO`.

La presenza delle interfacce permette di definire un contratto comune per le operazioni di accesso ai dati. In questo modo le classi concrete devono rispettare una struttura precisa, rendendo il codice più ordinato e più facilmente estendibile.

Nel progetto, il DAO espone operazioni di base come:

- ricerca tramite identificativo;
- ricerca tramite condizioni;
- creazione di un nuovo record;
- aggiornamento di un record esistente;
- recupero di più record;
- salvataggio delle modifiche sul database.

Ogni DAO è associato a uno specifico modello Sequelize:

```text
UserDAO → User Model
GameDAO → Game Model
```

Il DAO non contiene logica applicativa.

Il suo compito non è decidere se una mossa sia valida, se un utente possa creare una partita o se un giocatore abbia vinto. Queste decisioni appartengono al livello Service.

Il DAO si limita invece a fornire un accesso semplice e diretto alle tabelle del database.

Nel progetto, questo pattern è utile perché evita di scrivere query Sequelize direttamente nei service.

In questo modo, la logica di business rimane separata dalla logica di persistenza.

Il flusso seguito è:

```text
Service → Repository → DAO → Model Sequelize → Database PostgreSQL
```

Questa separazione rende il progetto più modulare, perché eventuali modifiche al modo in cui i dati vengono letti o salvati possono essere gestite nel DAO senza modificare la logica applicativa.

---

### Dependency Injection

La **Dependency Injection** è un principio di progettazione che consiste nel fornire a una classe le proprie dipendenze dall’esterno, invece di crearle direttamente al suo interno.

Questo approccio permette di ottenere codice più modulare, più semplice da testare e più facile da modificare.

Nel progetto di **Battaglia Navale**, questo principio viene applicato soprattutto nei controller, che ricevono i rispettivi service tramite costruttore.

Esempio concettuale:

```ts
export class UserController {
    constructor(private readonly userService: UserService) {}

    getProfile = async (req: Request, res: Response) => {
        // utilizzo del service
    };
}
```

In questo esempio il controller non crea direttamente un’istanza del service al proprio interno, ma la riceve come dipendenza.

Questo rende esplicito il fatto che `UserController` dipende da `UserService`.

Lo stesso principio può essere applicato anche ad altri componenti del progetto, come i service che utilizzano repository per accedere ai dati.

La Dependency Injection è utile perché:

- riduce l’accoppiamento tra classi;
- rende più chiara la struttura delle dipendenze;
- facilita eventuali test unitari;
- permette di sostituire una dipendenza senza modificare in modo profondo la classe che la utilizza.

Nel progetto non è stato utilizzato un framework esterno di Dependency Injection, ma il principio viene comunque applicato nella costruzione dei componenti principali.

---

### Unit of Work

Il pattern **Unit of Work** permette di coordinare più operazioni su entità diverse all’interno di un’unica unità logica di lavoro.

Nel progetto di **Battaglia Navale**, questo concetto viene applicato tramite l’utilizzo delle **transazioni Sequelize**.

Le transazioni sono state introdotte nelle operazioni critiche, cioè in quelle operazioni che modificano più dati contemporaneamente e che devono essere completate interamente oppure annullate del tutto.

Esempi di operazioni critiche nel progetto sono:

- creazione di una partita;
- esecuzione di una mossa PvP;
- esecuzione di una mossa PvE;
- abbandono di una partita.

Durante queste operazioni possono essere modificati contemporaneamente diversi dati, ad esempio:

- saldo token dell’utente;
- stato della partita;
- turno corrente;
- storico delle mosse;
- plance di gioco;
- vincitore;
- punteggio degli utenti.

Senza una transazione, il database potrebbe rimanere in uno stato incoerente.

Ad esempio, durante la creazione di una partita potrebbe accadere che:

1. il sistema scala i token all’utente;
2. la creazione della partita fallisce;
3. l’utente perde credito senza ottenere una partita valida.

Per evitare questo problema, le operazioni vengono eseguite all’interno di una transazione.

Il comportamento è il seguente:

- se tutte le operazioni hanno successo, viene eseguito il `commit`;
- se una qualsiasi operazione fallisce, viene eseguito il `rollback`.

In questo modo il database viene aggiornato solo se l’intera operazione va a buon fine.

Nel progetto non è presente una classe separata chiamata `UnitOfWork`, ma il principio del pattern viene applicato direttamente nei service tramite le transazioni Sequelize.

Questa scelta permette di mantenere la coerenza dei dati senza mischiare la logica transazionale con il livello DAO o con i controller.

---

### Singleton

Il **Singleton** è un pattern creazionale che garantisce l’esistenza di una sola istanza di una risorsa condivisa durante l’intero ciclo di vita dell’applicazione.

Nel progetto di **Battaglia Navale**, questo concetto è applicato alla configurazione della connessione al database.

La connessione Sequelize è definita in un unico file:

```text
src/config/database.ts
```

Questa istanza viene poi importata e riutilizzata dai model e dai componenti che devono interagire con il database.

Lo scopo è evitare che l’applicazione crei più connessioni indipendenti a PostgreSQL.

Centralizzare la connessione permette di:

- avere un unico punto di configurazione del database;
- riutilizzare la stessa istanza Sequelize;
- semplificare la gestione delle transazioni;
- evitare duplicazione di codice;
- rendere più chiaro il ciclo di vita della connessione.

Nel progetto non è implementato un Singleton classico con costruttore privato e metodo `getInstance`, ma viene adottato un comportamento equivalente: l’applicazione utilizza una singola istanza condivisa di Sequelize.

Questa scelta è particolarmente adatta in un backend Express, perché la connessione al database deve essere configurata una volta sola e poi riutilizzata durante tutta l’esecuzione del server.

---

### Factory

Il **Factory Pattern** è un pattern creazionale che consente di centralizzare la creazione di oggetti, separando la logica di costruzione dal resto dell’applicazione.

Nel progetto di **Battaglia Navale**, questo pattern viene utilizzato per la gestione degli errori applicativi tramite:

```text
src/patterns/ErrorFactory.ts
```

L’`ErrorFactory` ha il compito di generare errori coerenti e standardizzati.

Ogni errore prodotto dalla factory contiene informazioni come:

- messaggio dell’errore;
- status code HTTP;
- tipologia dell’errore.

Questo permette di evitare la creazione manuale di errori diversi in più punti del codice.

Esempi di errori gestiti sono:

- utente non trovato;
- partita non trovata;
- credenziali non valide;
- token mancante;
- token non valido;
- credito insufficiente;
- accesso non autorizzato;
- mossa non valida;
- partita non attiva;
- errore interno del server.

Il flusso concettuale è il seguente:

```text
Service / Middleware
        ↓
ErrorFactory
        ↓
Errore applicativo
        ↓
ErrorHandler
        ↓
Risposta JSON al client
```

Questa soluzione rende la gestione degli errori più uniforme e più semplice da mantenere.

Se in futuro fosse necessario aggiungere un nuovo tipo di errore, sarebbe sufficiente estendere la factory senza modificare in modo invasivo tutti i service o i middleware.

Il Factory Pattern è quindi utilizzato per migliorare:

- leggibilità del codice;
- uniformità delle risposte;
- manutenibilità;
- estendibilità della gestione degli errori.

---

### Chain of Responsibility

Il **Chain of Responsibility** è un pattern comportamentale che consente di far attraversare una richiesta a una catena di handler.

Ogni handler può decidere se:

- elaborare la richiesta;
- aggiungere informazioni alla richiesta;
- bloccare il flusso;
- passare la richiesta al gestore successivo.

Nel progetto di **Battaglia Navale**, questo pattern viene applicato tramite il sistema di middleware di **Express.js**.

Ogni middleware rappresenta un nodo della catena e svolge una responsabilità specifica.

Esempio di flusso per una rotta protetta:

```text
POST /api/games/new-game
        ↓
authenticateJWT
        ↓
checkTokenBalance
        ↓
GameController
```

Nel progetto sono presenti middleware dedicati a diverse responsabilità:

- autenticazione;
- autorizzazione;
- controllo del credito token;
- gestione centralizzata degli errori.

#### Middleware di autenticazione

Il middleware di autenticazione verifica che la richiesta contenga un JWT valido.

Se il token è assente o non valido, la richiesta viene interrotta e il backend restituisce un errore di autenticazione.

Questo middleware protegge le rotte che richiedono un utente autenticato, come la creazione di una partita, l’esecuzione di una mossa, l’abbandono e la consultazione dello storico personale.

#### Middleware di autorizzazione

Il middleware di autorizzazione controlla il ruolo dell’utente autenticato.

Nel progetto viene utilizzato per proteggere le rotte riservate agli utenti con ruolo `ADMIN`.

Ad esempio, la rotta per la ricarica dei token può essere eseguita solo da un admin.

Se un utente con ruolo `USER` prova ad accedere a questa funzionalità, la richiesta viene bloccata.

#### Middleware di controllo token

Il middleware di controllo token verifica che l’utente abbia credito sufficiente per eseguire alcune operazioni.

Nel progetto viene utilizzato soprattutto prima della creazione di una nuova partita, perché la creazione ha un costo in token.

Questo controllo permette di bloccare subito le richieste non valide, prima di arrivare alla logica del controller e del service.

#### Middleware di gestione errori

Il middleware globale di gestione errori intercetta gli errori generati nei livelli precedenti dell’applicazione.

Invece di gestire manualmente ogni errore nei controller, gli errori vengono inoltrati al middleware finale, che restituisce una risposta JSON coerente al client.

Questo rende il flusso più pulito e centralizza la gestione delle risposte di errore.

Il Chain of Responsibility permette quindi di organizzare il processo di gestione delle richieste HTTP in modo ordinato e modulare.

Ogni middleware ha una responsabilità precisa e può interrompere la catena se la richiesta non soddisfa i requisiti necessari.

---

### Classe base astratta

Nel progetto è stata utilizzata anche una struttura basata su una classe base per gestire la logica comune delle partite.

La classe principale è:

```text
BaseGameService
```

Da questa classe derivano:

```text
PvPGameService
PvEGameService
```

Questa scelta permette di condividere la logica comune tra le due modalità di gioco, evitando duplicazione di codice.

Il `BaseGameService` contiene funzionalità comuni come:

- validazione della dimensione della griglia;
- validazione della configurazione delle navi;
- controllo dell’utente;
- controllo del credito;
- verifica della presenza di una partita attiva;
- validazione delle coordinate;
- recupero dello storico della partita;
- recupero dello stato della partita;
- gestione dell’abbandono.

Le classi derivate si occupano invece delle differenze specifiche tra le modalità.

`PvPGameService` gestisce la logica delle partite tra due utenti reali, quindi controlla la presenza dell’avversario, il turno corrente, le mosse tra i due giocatori e la vittoria di uno dei partecipanti.

`PvEGameService` gestisce invece la logica delle partite contro l’elaboratore, quindi include la gestione della mossa automatica dell’IA e il caso in cui la partita termini con la vittoria del sistema.

Questa struttura segue il principio del riuso del codice e consente di mantenere separate le parti comuni dalle parti specifiche.

---

### Enum

Nel progetto sono stati utilizzati diversi enum TypeScript per rappresentare valori fissi e controllati.

Gli enum principali sono:

- `GameStatus`;
- `GameType`;
- `MoveResult`;
- `UserRole`;
- `HttpStatus`.

L’utilizzo degli enum evita di scrivere stringhe o numeri direttamente nel codice.

Ad esempio, invece di utilizzare manualmente valori come:

```text
"ACTIVE"
"PVP"
"USER"
```

il progetto utilizza valori centralizzati come:

```ts
GameStatus.ACTIVE
GameType.PVP
UserRole.USER
```

Questo rende il codice più leggibile e riduce il rischio di errori di battitura.

Gli enum sono particolarmente utili per rappresentare:

- gli stati della partita;
- le modalità di gioco;
- i risultati delle mosse;
- i ruoli degli utenti;
- gli status code HTTP.

Centralizzare questi valori permette inoltre di modificare o estendere più facilmente il progetto in futuro.

---

### Riepilogo dei pattern utilizzati

| Pattern | Applicazione nel progetto | Motivazione |
|---|---|---|
| Model-Controller-Service | Model, Controller e Service | Separare dati, richieste HTTP e logica applicativa |
| Repository | `UserRepository`, `GameRepository` | Astrarre l’accesso ai dati rispetto alla logica di business |
| DAO | `UserDAO`, `GameDAO` | Isolare le operazioni concrete sul database |
| Dependency Injection | Controller con service nel costruttore | Rendere esplicite le dipendenze e migliorare modularità |
| Unit of Work | Transazioni Sequelize nei service | Garantire atomicità nelle operazioni critiche |
| Singleton | Istanza condivisa di Sequelize | Evitare connessioni multiple al database |
| Factory | `ErrorFactory` | Centralizzare la creazione degli errori applicativi |
| Chain of Responsibility | Middleware Express | Gestire le richieste tramite una catena di controlli |
| Classe base astratta | `BaseGameService`, `PvPGameService`, `PvEGameService` | Condividere logica comune tra modalità di gioco |
| Enum | Cartella `enum` | Centralizzare valori costanti e ridurre errori |



## Diagrammi UML
### Diagrama dei casi d'uso
Il diagramma dei casi d’uso descrive in modo sintetico le principali funzionalità offerte dal backend e le interazioni tra il sistema e gli attori coinvolti.

Nel progetto sono stati individuati tre attori principali:

- **User non autenticato**, ovvero l’utente non autenticato;
- **User**, ovvero l’utente autenticato con ruolo standard;
- **Admin**, ovvero l’utente autenticato con privilegi amministrativi.

Ogni attore può accedere a un insieme specifico di funzionalità.  
L’utente non autenticato può effettuare il login e consultare alcune informazioni pubbliche, come il profilo utente e la classifica. L’utente autenticato può invece creare partite, effettuare mosse, abbandonare una partita e consultare stato e storico delle proprie partite. L’admin eredita le funzionalità dell’utente standard e dispone inoltre della possibilità di ricaricare il credito token degli utenti.

Il diagramma riportato di seguito rappresenta graficamente questi casi d’uso e mostra quali operazioni sono disponibili per ciascun attore all’interno del sistema.

![Diagramma dei casi d'uso](diagrammi/casi_uso.drawio.png)

### Diagramma E-R
Alla base della progettazione è stato sviluppato un diagramma E-R (**Entity-Relationship**), che rappresenta concettualmente le principali entità del sistema e le relazioni tra di esse. Questo schema ha guidato la definizione delle tabelle del database, dei vincoli e delle connessioni logiche necessarie a supportare le funzionalità previste dal backend.

Nel progetto di **Battaglia Navale**, il modello dati è stato progettato attorno a due entità principali:

- **User**, che rappresenta gli utenti registrati nel sistema;
- **Game**, che rappresenta le partite create dagli utenti.

L’entità `User` contiene le informazioni relative all’utente, come email, password cifrata, ruolo, credito token residuo e punteggio.  
L’entità `Game` contiene invece le informazioni relative alla partita, come tipologia di gioco, giocatori coinvolti, stato della partita, vincitore e stato completo del gioco.

Le relazioni tra `User` e `Game` permettono di modellare i diversi ruoli che un utente può assumere all’interno di una partita:

- un utente può creare o partecipare a una partita come `player1`;
- un utente può partecipare a una partita PvP come `player2`;
- un utente può risultare vincitore di una partita tramite `winnerId`.

Nel caso delle partite PvE, il campo `player2Id` è `null`, poiché l’IA non viene salvata come utente nel database. Inoltre, se una partita PvE è terminata e il campo `winnerId` è `null`, significa che la vittoria è stata assegnata all’IA.

Lo stato dettagliato della partita, incluse plance, navi, turno corrente e storico delle mosse, viene salvato nel campo `gameState` di tipo `JSONB`. Questa scelta permette di rappresentare lo stato della partita come un unico oggetto strutturato, evitando la creazione di molte tabelle aggiuntive per dati che non hanno vita autonoma rispetto alla partita e che vengono letti e aggiornati principalmente insieme.

![Diagramma dei casi d'uso](diagrammi/modello_er.png)



### Struttura del database

Di seguito vengono descritte le principali entità del database utilizzate dal progetto, con i relativi attributi, tipi e significato.

### Entità `User`

| Attributo | Tipo | Descrizione |
|---|---|---|
| `id` | UUID | Identificativo univoco dell’utente |
| `email` | VARCHAR | Email dell’utente, utilizzata per il login |
| `password` | VARCHAR | Password cifrata dell’utente |
| `role` | ENUM | Ruolo dell’utente: `USER` o `ADMIN` |
| `tokenBalance` | DOUBLE | Credito token residuo dell’utente |
| `points` | DOUBLE | Punteggio accumulato dall’utente |
| `createdAt` | TIMESTAMP | Data e ora di creazione del record |
| `updatedAt` | TIMESTAMP | Data e ora dell’ultimo aggiornamento del record |

### Entità `Game`

| Attributo | Tipo | Descrizione |
|---|---|---|
| `id` | UUID | Identificativo univoco della partita |
| `type` | ENUM | Tipologia della partita: `PVP` o `PVE` |
| `player1Id` | UUID | Identificativo dell’utente che crea/partecipa come primo giocatore |
| `player2Id` | UUID / NULL | Identificativo del secondo giocatore nelle partite PvP; `null` nelle partite PvE |
| `status` | ENUM | Stato della partita, ad esempio `ACTIVE`, `FINISHED` o `ABANDONED` |
| `winnerId` | UUID / NULL | Identificativo dell’utente vincitore; `null` se la partita è attiva o se in PvE vince l’IA |
| `gameState` | JSONB | Stato completo della partita, incluse plance, navi, turno corrente e storico mosse |
| `createdAt` | TIMESTAMP | Data e ora di creazione della partita |
| `updatedAt` | TIMESTAMP | Data e ora dell’ultimo aggiornamento della partita |

### Relazioni principali

| Relazione | Chiave esterna | Descrizione |
|---|---|---|
| `crea` | `Games.player1Id` | Un utente può creare o partecipare come primo giocatore a più partite |
| `partecipa` | `Games.player2Id` | Un utente può partecipare come secondo giocatore a più partite PvP |
| `vince` | `Games.winnerId` | Un utente può risultare vincitore di più partite |

## Diagrammi delle sequenze
### POST `/api/auth/login`
![Diagramma sequenze](diagrammi/auth.png)

### GET `/api/users/profile/:id`
![Diagramma sequenze](diagrammi/profilo_utente.png)

### GET `/api/users/leaderboard`
![Diagramma sequenze](diagrammi/classifica_utenti.png)

### PATCH `/api/users/balance`
![Diagramma sequenze](diagrammi/ricarica_token.png)

### POST `/api/games/new-game`
![Diagramma sequenze](diagrammi/new_game.png)

### POST `/api/games/:id/move`
![Diagramma sequenze](diagrammi/move.png)

### PATCH `/api/games/:id/abandon`
![Diagramma sequenze](diagrammi/abbandona_partita.png)

### GET `/api/games/:id/history-game`
![Diagramma sequenze](diagrammi/history_game.png)

### GET `/api/games/:id/state-game`
![Diagramma sequenze](diagrammi/state-game.png)

### GET `/api/games/my-history`
![Diagramma sequenze](diagrammi/storico_user.png)



## Rotte API
## Rotte API

| HTTP | Endpoint | Descrizione | JWT | Ruolo |
|---|---|---|---|---|
| POST | `/api/auth/login` | Autenticazione dell’utente tramite email e password. | ❌ | Tutti |
| GET | `/api/users/profile/:id` | Recupera il profilo pubblico di un utente. | ❌ | Tutti |
| GET | `/api/users/leaderboard` | Recupera la classifica degli utenti ordinata per punteggio. | ❌ | Tutti |
| PATCH | `/api/users/balance` | Ricarica il credito token di un utente. | ✅ | Admin |
| POST | `/api/games/new-game` | Crea una nuova partita PvP o PvE. | ✅ | User, Admin |
| POST | `/api/games/:id/move` | Permette di effettuare una mossa in una partita attiva. | ✅ | User, Admin |
| PATCH | `/api/games/:id/abandon` | Permette di abbandonare una partita attiva. | ✅ | User, Admin |
| GET | `/api/games/:id/history-game` | Recupera lo storico delle mosse di una specifica partita. | ✅ | User, Admin |
| GET | `/api/games/:id/state-game` | Recupera lo stato corrente di una specifica partita. | ✅ | User, Admin |
| GET | `/api/games/my-history` | Recupera lo storico delle partite dell’utente autenticato. | ✅ | User, Admin |

> Le rotte contrassegnate con ✅ richiedono l’header `Authorization: Bearer <token>`.  
> Gli utenti con ruolo `ADMIN` possono eseguire tutte le operazioni disponibili per gli utenti `USER`, oltre alla ricarica dei token.





In questa sezione vengono descritte le rotte disponibili nel backend, specificando per ciascuna il metodo HTTP, l’endpoint, gli eventuali header richiesti, il body della richiesta e un esempio di risposta.

---

### POST `/api/auth/login`

Effettua l’autenticazione dell’utente tramite email e password.  
Se le credenziali sono corrette, il backend restituisce un token JWT da utilizzare nelle rotte protette.

#### Richiesta

```http
POST /api/auth/login
Content-Type: application/json
```

#### Body

```json
{
  "email": "player1@fleetops.com",
  "password": "password123"
}
```

#### Risposta

```json
{
  "token": "jwt-token",
  "user": {
    "id": "b0000000-0000-0000-0000-000000000001",
    "email": "player1@fleetops.com",
    "role": "USER",
    "tokenBalance": 10,
    "points": 0
  }
}
```

---

### GET `/api/users/profile/:id`

Restituisce il profilo pubblico di un utente tramite il suo identificativo.

Questa rotta non richiede autenticazione.

#### Richiesta

```http
GET /api/users/profile/b0000000-0000-0000-0000-000000000001
```

#### Parametri

| Parametro | Tipo | Descrizione |
|---|---|---|
| `id` | UUID | Identificativo dell’utente da cercare |

#### Risposta

```json
{
  "id": "b0000000-0000-0000-0000-000000000001",
  "email": "player1@fleetops.com",
  "role": "USER",
  "tokenBalance": 10,
  "points": 1
}
```

---

### GET `/api/users/leaderboard`

Restituisce la classifica degli utenti ordinata in base al punteggio.

Questa rotta non richiede autenticazione.

#### Richiesta

```http
GET /api/users/leaderboard
```

#### Risposta

```json
[
  {
    "id": "b0000000-0000-0000-0000-000000000001",
    "email": "player1@fleetops.com",
    "role": "USER",
    "tokenBalance": 9.75,
    "points": 2
  },
  {
    "id": "b0000000-0000-0000-0000-000000000002",
    "email": "player2@fleetops.com",
    "role": "USER",
    "tokenBalance": 8.5,
    "points": 1
  }
]
```

---

### PATCH `/api/users/balance`

Permette a un utente con ruolo `ADMIN` di ricaricare il credito token di un utente.

Questa rotta richiede autenticazione tramite JWT e ruolo `ADMIN`.

#### Richiesta

```http
PATCH /api/users/balance
Authorization: Bearer <token-admin>
Content-Type: application/json
```

#### Body

```json
{
  "email": "player1@fleetops.com",
  "amount": 5
}
```

#### Campi del body

| Campo | Tipo | Descrizione |
|---|---|---|
| `email` | string | Email dell’utente a cui ricaricare i token |
| `amount` | number | Quantità di token da aggiungere |

#### Risposta

```json
{
  "message": "Ricarica effettuata con successo",
  "user": {
    "id": "b0000000-0000-0000-0000-000000000001",
    "email": "player1@fleetops.com",
    "role": "USER",
    "tokenBalance": 15,
    "points": 1
  }
}
```

---

### POST `/api/games/new-game`

Crea una nuova partita.  
La partita può essere di tipo `PVP`, contro un altro utente reale, oppure `PVE`, contro l’IA.

Questa rotta richiede autenticazione tramite JWT.  
La creazione di una partita ha un costo di `0.2` token.

La griglia di gioco è sempre **quadrata**: il valore `gridSize` indica sia il numero di righe sia il numero di colonne.  
La dimensione minima consentita è **5x5**, quindi `gridSize` deve essere almeno `5`.

#### Richiesta

```http
POST /api/games/new-game
Authorization: Bearer <token-user>
Content-Type: application/json
```

---

#### Creazione partita PvE

Nel caso di partita PvE non viene specificato un avversario, perché il secondo giocatore è gestito automaticamente dal sistema.

##### Body

```json
{
  "type": "PVE",
  "gridSize": 10,
  "shipConfig": [
    {
      "type": 1,
      "size": 2,
      "count": 1
    },
    {
      "type": 2,
      "size": 3,
      "count": 1
    }
  ]
}
```

##### Campi del body

| Campo | Tipo | Descrizione |
|---|---|---|
| `type` | string | Tipo di partita. In questo caso `PVE` |
| `gridSize` | number | Dimensione della griglia quadrata. Il valore minimo consentito è `5`, quindi la griglia minima è `5x5` |
| `shipConfig` | array | Configurazione delle navi da posizionare sulla plancia |
| `shipConfig.type` | number | Identificativo del tipo di nave |
| `shipConfig.size` | number | Lunghezza della nave |
| `shipConfig.count` | number | Numero di navi di quel tipo |

##### Risposta

```json
{
  "id": "c0000000-0000-0000-0000-000000000001",
  "type": "PVE",
  "player1Id": "b0000000-0000-0000-0000-000000000001",
  "player2Id": null,
  "status": "ACTIVE",
  "winnerId": null,
  "gameState": {
    "configuration": {
      "gridSize": 10,
      "shipTypes": [
        {
          "type": 1,
          "size": 2,
          "count": 1
        },
        {
          "type": 2,
          "size": 3,
          "count": 1
        }
      ]
    },
    "currentTurn": "b0000000-0000-0000-0000-000000000001",
    "history": []
  }
}
```

---

#### Creazione partita PvP

Nel caso di partita PvP viene specificata l’email dell’avversario.

##### Body

```json
{
  "type": "PVP",
  "gridSize": 10,
  "opponentEmail": "player2@fleetops.com",
  "shipConfig": [
    {
      "type": 1,
      "size": 2,
      "count": 1
    },
    {
      "type": 2,
      "size": 3,
      "count": 1
    }
  ]
}
```

##### Campi del body

| Campo | Tipo | Descrizione |
|---|---|---|
| `type` | string | Tipo di partita. In questo caso `PVP` |
| `gridSize` | number | Dimensione della griglia quadrata. Il valore minimo consentito è `5`, quindi la griglia minima è `5x5` |
| `opponentEmail` | string | Email dell’utente avversario |
| `shipConfig` | array | Configurazione delle navi da posizionare sulla plancia |

##### Risposta

```json
{
  "id": "c0000000-0000-0000-0000-000000000002",
  "type": "PVP",
  "player1Id": "b0000000-0000-0000-0000-000000000001",
  "player2Id": "b0000000-0000-0000-0000-000000000002",
  "status": "ACTIVE",
  "winnerId": null,
  "gameState": {
    "configuration": {
      "gridSize": 10,
      "shipTypes": [
        {
          "type": 1,
          "size": 2,
          "count": 1
        },
        {
          "type": 2,
          "size": 3,
          "count": 1
        }
      ]
    },
    "currentTurn": "b0000000-0000-0000-0000-000000000001",
    "history": []
  }
}
```

---

### POST `/api/games/:id/move`

Permette a un utente autenticato di effettuare una mossa in una partita attiva.

Questa rotta richiede autenticazione tramite JWT.  
Ogni mossa ha un costo di `0.025` token.

#### Richiesta

```http
POST /api/games/c0000000-0000-0000-0000-000000000001/move
Authorization: Bearer <token-user>
Content-Type: application/json
```

#### Parametri

| Parametro | Tipo | Descrizione |
|---|---|---|
| `id` | UUID | Identificativo della partita |

#### Body

```json
{
  "x": 3,
  "y": 4
}
```

#### Campi del body

| Campo | Tipo | Descrizione |
|---|---|---|
| `x` | number | Coordinata orizzontale del colpo |
| `y` | number | Coordinata verticale del colpo |

#### Risposta esempio PvP

```json
{
  "result": "HIT",
  "nextTurn": "b0000000-0000-0000-0000-000000000002",
  "gameStatus": "ACTIVE",
  "winner": null
}
```

#### Risposta esempio PvE

Nel caso di partita PvE, dopo la mossa dell’utente, il sistema può generare automaticamente anche la mossa dell’IA.

```json
{
  "userMove": "MISS",
  "iaMove": {
    "playerId": "IA",
    "x": 2,
    "y": 7,
    "result": "HIT",
    "timestamp": "2026-05-12T10:00:00.000Z"
  },
  "currentStatus": "ACTIVE",
  "winner": null
}
```

---

### PATCH `/api/games/:id/abandon`

Permette a un utente autenticato di abbandonare una partita attiva.

Questa rotta richiede autenticazione tramite JWT.

#### Richiesta

```http
PATCH /api/games/c0000000-0000-0000-0000-000000000001/abandon
Authorization: Bearer <token-user>
```

#### Parametri

| Parametro | Tipo | Descrizione |
|---|---|---|
| `id` | UUID | Identificativo della partita da abbandonare |

#### Risposta

```json
{
  "message": "Partita abbandonata con successo.",
  "gameId": "c0000000-0000-0000-0000-000000000001",
  "status": "ABANDONED",
  "winnerId": "b0000000-0000-0000-0000-000000000002"
}
```

---

### GET `/api/games/:id/history-game`

Restituisce lo storico delle mosse di una specifica partita.

Questa rotta richiede autenticazione tramite JWT.

#### Richiesta

```http
GET /api/games/c0000000-0000-0000-0000-000000000001/history-game
Authorization: Bearer <token-user>
```

#### Parametri

| Parametro | Tipo | Descrizione |
|---|---|---|
| `id` | UUID | Identificativo della partita |

#### Risposta

```json
{
  "gameId": "c0000000-0000-0000-0000-000000000001",
  "type": "PVE",
  "player1Id": "b0000000-0000-0000-0000-000000000001",
  "player2Id": null,
  "history": [
    {
      "playerId": "b0000000-0000-0000-0000-000000000001",
      "x": 0,
      "y": 0,
      "result": "MISS",
      "timestamp": "2026-05-12T10:00:00.000Z"
    },
    {
      "playerId": "IA",
      "x": 2,
      "y": 3,
      "result": "HIT",
      "timestamp": "2026-05-12T10:00:01.000Z"
    }
  ]
}
```

---

### GET `/api/games/:id/state-game`

Restituisce lo stato sintetico di una specifica partita.

Questa rotta richiede autenticazione tramite JWT.

#### Richiesta

```http
GET /api/games/c0000000-0000-0000-0000-000000000001/state-game
Authorization: Bearer <token-user>
```

#### Parametri

| Parametro | Tipo | Descrizione |
|---|---|---|
| `id` | UUID | Identificativo della partita |

#### Risposta

```json
{
  "gameId": "c0000000-0000-0000-0000-000000000001",
  "type": "PVE",
  "status": "ACTIVE",
  "currentTurnId": "b0000000-0000-0000-0000-000000000001",
  "currentTurnEmail": "player1@fleetops.com",
  "winnerId": null,
  "winnerEmail": null
}
```

---

### GET `/api/games/my-history`

Restituisce lo storico delle partite dell’utente autenticato.

Questa rotta richiede autenticazione tramite JWT.

#### Richiesta

```http
GET /api/games/my-history
Authorization: Bearer <token-user>
```

#### Risposta

```json
[
  {
    "id": "c0000000-0000-0000-0000-000000000001",
    "type": "PVE",
    "status": "FINISHED",
    "player1": "player1@fleetops.com",
    "player2": "IA",
    "winner": "IA",
    "createdAt": "2026-05-12T10:00:00.000Z"
  },
  {
    "id": "c0000000-0000-0000-0000-000000000002",
    "type": "PVP",
    "status": "ABANDONED",
    "player1": "player1@fleetops.com",
    "player2": "player2@fleetops.com",
    "winner": "player2@fleetops.com",
    "createdAt": "2026-05-12T11:30:00.000Z"
  }
]
```

---

### Header di autenticazione

Le rotte protette richiedono sempre il seguente header:

```http
Authorization: Bearer <token>
```

Il token viene restituito dalla rotta di login:

```http
POST /api/auth/login
```

---

### Esempio di errore

In caso di errore, il backend restituisce una risposta JSON coerente.

```json
{
  "status": 401,
  "message": "Token non valido o mancante"
}
```

Altri esempi di errore possono riguardare:

- credenziali non valide;
- utente non trovato;
- partita non trovata;
- credito insufficiente;
- mossa non valida;
- turno non corretto;
- accesso non autorizzato;
- partita non attiva.




## Configurazione e uso

Questa sezione descrive i passaggi necessari per configurare ed eseguire il progetto in locale tramite **Docker Compose** oppure tramite installazione manuale delle dipendenze.

---

### Prerequisiti

Per eseguire correttamente il progetto è necessario avere installati:

- **Node.js**
- **npm**
- **Docker**
- **Docker Compose**

L’utilizzo consigliato è tramite Docker Compose, poiché permette di avviare sia il backend sia il database PostgreSQL con un unico comando.

---

### Variabili d’ambiente

Il progetto utilizza un file `.env` nella root del progetto per configurare porta applicativa, connessione al database e chiavi JWT.

Esempio di file `.env`:

```env
APP_PORT=

DB_NAME=
DB_USER=
DB_PWD=
DB_HOST=

JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
```

| Variabile | Descrizione |
|---|---|
| `APP_PORT` | Porta su cui viene eseguito il server Express |
| `DB_NAME` | Nome del database PostgreSQL |
| `DB_USER` | Utente PostgreSQL |
| `DB_PWD` | Password dell’utente PostgreSQL |
| `DB_HOST` | Host del database. Con Docker Compose deve essere `db` |
| `JWT_PRIVATE_KEY` | Chiave privata utilizzata per firmare i JWT |
| `JWT_PUBLIC_KEY` | Chiave pubblica utilizzata per verificare i JWT |

Il file `.env` non dovrebbe essere versionato su Git, poiché contiene informazioni sensibili come password del database e chiavi JWT.

---

### Avvio con Docker Compose

Per avviare il progetto tramite Docker Compose, posizionarsi nella root del progetto ed eseguire:

```bash
docker compose up --build
```

Questo comando:

- costruisce l’immagine Docker del backend;
- avvia il container dell’applicazione;
- avvia il container PostgreSQL;
- carica le variabili d’ambiente dal file `.env`;
- monta la cartella `sql/` per l’inizializzazione del database;
- espone il backend sulla porta `3000`;
- espone PostgreSQL sulla porta `5432`.

Una volta avviato, il backend sarà disponibile all’indirizzo:

```text
http://localhost:3000
```

---

### Avvio in background

Per avviare i container lasciando libero il terminale:

```bash
docker compose up --build -d
```

Per visualizzare i log:

```bash
docker compose logs -f
```

Per visualizzare solo i log del backend:

```bash
docker compose logs -f app
```

Per visualizzare solo i log del database:

```bash
docker compose logs -f db
```

---

### Arresto dei container

Per fermare i container senza eliminare i dati del database:

```bash
docker compose down
```

In questo caso il volume del database viene mantenuto, quindi i dati rimangono salvati.

---

### Reset completo del database

Per fermare i container ed eliminare anche il volume del database:

```bash
docker compose down -v
```

Questo comando cancella i dati persistenti di PostgreSQL.

Per ricostruire e riavviare tutto da zero:

```bash
docker compose down -v
docker compose up --build
```

Questa procedura è utile quando si vogliono rieseguire gli script SQL di inizializzazione e seed.

---

### Inizializzazione del database

Il database viene inizializzato tramite gli script SQL presenti nella cartella:

```text
sql/
```

La cartella viene montata nel container PostgreSQL nel percorso:

```text
/docker-entrypoint-initdb.d
```

PostgreSQL esegue automaticamente gli script presenti in questa cartella al primo avvio del database, quando il volume non è ancora stato inizializzato.

La struttura prevista è:

```text
sql/
├── 00_migration.sql
└── 01_seed.sql
```

| File | Funzione |
|---|---|
| `00_migration.sql` | Crea lo schema del database e le tabelle principali |
| `01_seed.sql` | Inserisce dati iniziali utili per il test dell’applicazione |

Se il database è già stato inizializzato, gli script non vengono rieseguiti automaticamente.  
Per rieseguirli è necessario eliminare il volume con:

```bash
docker compose down -v
```

---

### Installazione manuale delle dipendenze

In alternativa all’avvio tramite Docker, è possibile installare le dipendenze localmente:

```bash
npm install
```

Successivamente è possibile avviare il progetto con:

```bash
npm run dev
```

In questo caso è necessario avere un database PostgreSQL già attivo e configurare correttamente le variabili d’ambiente nel file `.env`.

---

### Accesso al database PostgreSQL da Docker

Per entrare nel container del database:

```bash
docker exec -it postgres_db bash
```

Una volta dentro il container, è possibile accedere a PostgreSQL con:

```bash
psql -U postgres -d PA2025
```

Per visualizzare le tabelle presenti nel database:

```sql
\dt
```

Per uscire da `psql`:

```sql
\q
```

---

### Verifica del funzionamento

Dopo l’avvio del progetto, è possibile verificare il funzionamento del backend effettuando una richiesta di login tramite Postman, Thunder Client o strumenti simili.

Esempio:

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json
```

Body:

```json
{
  "email": "player1@fleetops.com",
  "password": "password123"
}
```

Se il backend e il database sono configurati correttamente, la risposta conterrà un token JWT.

Il token restituito dovrà poi essere inserito nelle rotte protette tramite header:

```http
Authorization: Bearer <token>
```

---

### Comandi principali

| Comando | Descrizione |
|---|---|
| `npm install` | Installa le dipendenze del progetto |
| `npm run dev` | Avvia il backend in modalità sviluppo |
| `docker compose up --build` | Avvia backend e database ricostruendo l’immagine |
| `docker compose up --build -d` | Avvia backend e database in background |
| `docker compose down` | Ferma i container senza cancellare il database |
| `docker compose down -v` | Ferma i container e cancella il volume del database |
| `docker compose logs -f` | Mostra i log dei container |
| `docker compose logs -f app` | Mostra i log del backend |
| `docker compose logs -f db` | Mostra i log del database |

---

### Note sull’uso

L’avvio tramite Docker Compose è la modalità consigliata perché garantisce un ambiente coerente e riproducibile.

Il backend viene eseguito all’interno di un container Node.js, mentre il database PostgreSQL viene eseguito in un container separato.  
I due servizi comunicano tramite la rete interna creata automaticamente da Docker Compose.

Il database utilizza un volume Docker in modo da mantenere persistenti i dati anche dopo lo spegnimento dei container.

Per ripartire da un database vuoto è quindi necessario eliminare esplicitamente il volume con:

```bash
docker compose down -v
```
## Autori
Giada Remedia 