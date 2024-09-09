// Open (or create) a database
function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MyDatabase', 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore('MyObjectStore', { keyPath: 'id' });
        };

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            reject('Error opening database: ' + event.target.errorCode);
        };
    });
}

// Add data to the database
function addData(db, storeName, data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(data);

        request.onsuccess = () => {
            resolve(true);
        };

        request.onerror = (event) => {
            reject('Error adding data: ' + event.target.errorCode);
        };
    });
}

// Retrieve data from the database
function getData(db, storeName, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            reject('Error retrieving data: ' + event.target.errorCode);
        };
    });
}

// Example usage
openDatabase().then(db => {
    const data = { id: '123', name: 'MyData' };
    
    addData(db, 'MyObjectStore', data)
        .then(() => console.log('Data added successfully'))
        .catch(err => console.error(err));

    getData(db, 'MyObjectStore', '123')
        .then(result => console.log('Data retrieved:', result))
        .catch(err => console.error(err));
}).catch(err => console.error(err));
