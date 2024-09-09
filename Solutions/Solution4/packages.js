import { openDatabase, getCachedData, cacheData } from './cache.js';

let pyodide;
let ds_sst;

$(document).ready(async function () {
    pyodide = await loadPyodide();
    await pyodide.loadPackage(['matplotlib', 'numpy', 'micropip']);
    const micropip = pyodide.pyimport("micropip");
    await micropip.install('setuptools');
    await micropip.install('xarray');
    await micropip.install('requests');
    await micropip.install('zarr');
    console.log("Packages loaded");
});

async function loadData() {
    const db = await openDatabase();
    const cacheKey = 'dataset';  // Modify this based on specific dataset parameters
    
    // Check if data is cached
    let cachedData = await getCachedData(db, cacheKey);

    if (cachedData) {
        // Use cached data
        console.log("Using cached data");
        ds_sst = pyodide.pyimport('xarray').open_dataset(pyodide.toPy(cachedData));
    } else {
        // Load data from the server and cache it
        console.log("Loading data from server");
        let pythonCode = `
        import xarray as xr
        import requests
        import zarr
        from zarr.storage import BaseStore, KVStore

        class HTTPStore(BaseStore):
            def __init__(self, url):
                self.url = url.rstrip('/') + '/'

            def __getitem__(self, key):
                r = requests.get(self.url + key)
                r.raise_for_status()
                return r.content

        store = HTTPStore('http://localhost:9000/testbucket/output.zarr/')
        kvstore = KVStore(store)
        ds_sst = xr.open_zarr(kvstore, consolidated=True)
        ds_sst_data = ds_sst.to_dict()
        `;
        await pyodide.runPythonAsync(pythonCode);
        ds_sst = pyodide.globals.get('ds_sst');
        const ds_sst_data = pyodide.globals.get('ds_sst_data').toJs();

        // Cache the data
        await cacheData(db, cacheKey, ds_sst_data);
    }

    console.log("Data loaded");
}

async function processAndPlot() {
    let selectedVariable = document.getElementById('variable-select').value;
    let timeStart = document.getElementById('time-start').value;
    let timeEnd = document.getElementById('time-end').value;
    let latitude = document.getElementById('latitude').value;
    let longitude = document.getElementById('longitude').value;

    let pythonCode = `
    from js import document
    import io
    import base64
    import matplotlib.pyplot as plt
    import numpy as np
    import xarray as xr
    import time
  
    # Start timing the execution
    start_time = time.time()

    plt.rcParams['figure.figsize'] = 12, 6

    variable_timeseries = ds_sst['${selectedVariable}'].sel(
        time=slice('${timeStart}', '${timeEnd}'),
        latitude=${latitude},
        longitude=${longitude}
    ).load()

    fig, ax = plt.subplots()
    variable_timeseries.plot(ax=ax, label='${selectedVariable} Timeseries')

    buf = io.BytesIO()
    fig.savefig(buf, format='png')
    buf.seek(0)
    img_str = "data:image/png;base64," + base64.b64encode(buf.read()).decode('utf-8')
    buf.close()
                                
    html_str = f'<img src="{img_str}" />'
    document.getElementById('plot').innerHTML = html_str

    data = variable_timeseries.data

    document.getElementById('rasterdata').innerText = f"Selected Variable: ${selectedVariable}"
    raster_data_min = np.min(data)
    raster_data_max = np.max(data)
    raster_data_mean = np.mean(data)
    raster_data_median = np.median(data)
    raster_data_std = np.std(data)
    raster_data_variance = np.var(data)
    raster_data_sum = np.sum(data)

    document.getElementById('raster-min').innerText = f"Min: {raster_data_min}"
    document.getElementById('raster-max').innerText = f"Max: {raster_data_max}"
    document.getElementById('raster-mean').innerText = f"Mean: {raster_data_mean}"
    document.getElementById('raster-median').innerText = f"Median: {raster_data_median}"
    document.getElementById('raster-std').innerText = f"Standard Deviation: {raster_data_std}"
    document.getElementById('raster-variance').innerText = f"Variance: {raster_data_variance}"
    document.getElementById('raster-sum').innerText = f"Sum: {raster_data_sum}"
    
    # End timing the execution
    end_time = time.time()
    execution_time = end_time - start_time

    # Display the execution time
    document.getElementById('execution-time').innerText = f"Execution Time: {execution_time:.2f} seconds"
    `;
    await pyodide.runPythonAsync(pythonCode);
    console.log("Processing and plotting completed");
}

function openModal(content) {
    document.getElementById('modal-body').innerHTML = content;
    document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

window.onclick = function (event) {
    if (event.target == document.getElementById('modal')) {
        closeModal();
    }
};


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