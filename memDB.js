/**
 * memDB - Simple Array & Object based in memory Database
 * 
 * @param {String} primKey Items primary key property / field 
 * @return {Proxy} Database handle with exposed method / features
 * 
 * Features
 * - set            => Add item(s)
 * - get            => Get item(s)
 * - update         => Update existing item(s)
 * - getAll         => Get all table entries
 * - delete         => Delete matching item(s)
 * - deleteAll      => Delete the table with all entries
 * - use            => select and change to table context helper
 * 
 * Usage
 * =====
 * 
 * Initialize
 * ----------
 * db = memDB()             // primary key "id"
 * db = memDB('name')       // primary key "name"
 * 
 * Use / Select table
 * ------------------
 * users = db.use("users")  // Just to skip table parameter for each method...
 * 
 * Add items
 * ---------
 * db.set(table, {...})
 * db.set(table, [{...}, {...}])
 * users.set({...})
 * 
 * Retrieve items
 * --------------
 * db.get(table, <primKeyValue>)
 * db.get(table, [<primKey1>, <primKey2>, ...])     // OR filter
 * db.get(table, {prop: val})
 * db.get(table, {prop1: val1, prop2: val2})        // AND filter
 * db.get(table, [<primKey1>, {[prop]: val}, ...])  // mixed primKey and prop => val filters
 * 
 * Delete items 
 * ------------
 * db.delete(table, <getFilter>)        // Delete matching items from given table
 * users.delete(<getFilter)             // Delete matching items from current table
 * db.get(table, <getFilter>).delete()  // Delete retrieved items
 * 
 * Update existing items
 * ---------------------
 * db.update(table, <getFilter>, (item) => { <Do something with item here> }))
 * users.update(<GetFilter>, (item) => { <Do something with item here> }))
 * 
 * Get all table items
 * -------------------
 * db.getAll(table)
 * users.getAll()
 * 
 * Delete table with all contents
 * ------------------------------
 * db.deleteAll(table)
 * users.deleteAll()
 */
memDB = (primKey = 'id') => {
    const
    db = {},
    // minimizing by remove repetitive strings and names :)
    //forEach = 'forEach', 
    //inputStringOrArrayToArray = (arg) => [].concat(arg),

    /**
     * delete item helper
     * 
     * @param {String} dbTable Name of items db table
     * @param {Object} item Table entry to delete
     * @return {Void}
     */
    deleteItem = (dbTable, item) => dbTable.splice(dbTable.indexOf(item), 1),

    /**
     * Add item(s) to table
     * 
     * @param {String} table Database table destination
     * @param {Object|Array} obj Item(s) to add
     * @return {Void}
     */
    _set = (table, obj) => {
        if(!Array.isArray(db[table])) {
            db[table] = []
        }
        obj = [].concat(obj)
        db[table].push(...obj)
    },

    /**
     * Get item(s) from database table
     * 
     * @param {String} table Database table to get from
     * @param {String|Object|Array} Filter by primKey String value or Object prop => val &-matching patterns or Array of filters
     * @return {Array} Matching items with a delete helper to remove matching items by chaining
     */
    _get = (table, key) => {
        key = [].concat(key)
        key.forEach((val, index) => {
            if(typeof val == 'string' || typeof val == 'number') {
                key[index] = { [primKey]: val }
            }
        })
        let result = db[table].filter(item => key.some(keyObj => Object.entries(keyObj).every(([index, value]) => item[index] == value)))
        return Object.defineProperty(result, 'delete', { value: () => {
            result.forEach(item => deleteItem(db[table], item)) // add delete helper
        }})
    },

    /**
     * Retrieve all table entries
     * 
     * @param {String} table Database table to get
     * @return {Array} All items
     */
    _getAll = (table) => db[table],

    /**
     * Update existing items
     * 
     * @param {String} table Database table to update items
     * @param {String|Object|Array} key Get() compatible filter
     * @param {Callable} callback Function to execute on each item to update
     * @return {Void}
     */
    _update = (table, key, callback) => {
        get(table, key).forEach(item => callback(item))
    },

    /**
     * Delete item(s) from table
     * 
     * @param {String} table Database table to delete from
     * @param {String|Object|Array} key Get() compatible filter
     * @return {Void} 
     */
    _delete = (table, key) => {
        get(table, key).forEach(item => deleteItem(db[table], item))
    },

    /**
     * Delete the table with all entries
     * 
     * @param {String} table Database table to delete
     * @return {Void}
     */
    _deleteAll = (table) => delete db[table],

    /**
     * Select a table 
     * MySQL like "select" to simplify interaction with given table
     * 
     * @param {String} table Database table to select
     * @return {Proxy} Proxy prepared to interact with given table
     */
    _use = (table)  => new Proxy(table ? db[table] : db, {
        get: (target, prop) => {
            if(features[prop]) {
                return (...args) => table ? features[prop].call(null, table, ...args) : features[prop](...args)    
            }
            return target[prop]
        }
    }),

    /**
     * @param {Object} features Mapping of public methods
     */
    features = { set: _set, get: _get, getAll: _getAll, update: _update, delete: _delete, deleteAll: _deleteAll, use: _use }

    // return proxied database handle 
    return _use()
}
