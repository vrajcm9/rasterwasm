let pyodide;
let ds_sst;
let startTime;
let package_loading_time;
let data_loading_time;
let processing_time;

function showDataLoader() {
    const dataLoader = document.getElementById("data-loader");
    dataLoader.classList.remove("hidden");
}

// Function to hide the data loader
function hideDataLoader() {
    const dataLoader = document.getElementById("data-loader");
    dataLoader.classList.add("hidden");
}   


$(document).ready(function () {
    // Hide the page load spinner once the page is fully loaded
    const pageLoader = document.getElementById("page-loader");
    pageLoader.classList.add("hidden");

    // Function to show the data loader
    
});

$(document).ready(async function () {
    showDataLoader();
    startTime = new Date().getTime();
    pyodide = await loadPyodide();
    await pyodide.loadPackage(['matplotlib', 'numpy', 'micropip']);
    const micropip = pyodide.pyimport("micropip");
    await micropip.install('setuptools');
    await micropip.install('xarray');
    await micropip.install('requests');
    await micropip.install('zarr');
    console.log("Packages loaded");

    endTime = new Date().getTime();

    package_loading_time = (endTime - startTime)/1000;
    console.log("Time taken to load packages: " + package_loading_time + "s");
    $("#package-loading-time").text("Package Loading Time: " + package_loading_time + " seconds");
    hideDataLoader();
});


async function loadData() {
    showDataLoader();
    let pythonCode = `
    from js import document
    import xarray as xr
    import requests
    import zarr
    from zarr.storage import BaseStore, KVStore
    import time

    xr.set_options(display_style="html")
    # Start timing the execution
    start_time = time.time()

    class HTTPStore(BaseStore):
        def __init__(self, url):
            self.url = url.rstrip('/') + '/'

        def __getitem__(self, key):
            r = requests.get(self.url + key)
            r.raise_for_status()
            return r.content

        def __setitem__(self, key, value):
            raise NotImplementedError("HTTPStore is read-only")

        def __delitem__(self, key):
            raise NotImplementedError("HTTPStore is read-only")

        def __contains__(self, key):
            async def check_key():
                response = await fetch(self.url + key, {'method': 'HEAD'})
                return response.status == 200

            return asyncio.run(check_key())

        def __len__(self):
            raise NotImplementedError("HTTPStore does not support len")

        def __iter__(self):
            raise NotImplementedError("HTTPStore does not support iteration")

    store = HTTPStore('http://localhost:9000/testbucket/output.zarr/')
    
    #kvstore = KVStore(store)
    ds_sst = xr.open_zarr(store, consolidated=True)

    # End timing the execution
    end_time = time.time()
    loading_time = end_time - start_time

    ${data_loading_time} = loading_time
    # Print the execution time
    print(f"Data loading execution time: {loading_time:.2f} seconds")
    document.getElementById('data-loading-time').innerText = f" Data Loading Time: {loading_time:.2f} seconds"
    `;
    await pyodide.runPythonAsync(pythonCode);
    ds_sst = pyodide.globals.get('ds_sst');
    console.log("Data loaded");
    hideDataLoader();
}

async function processAndPlot() {
    showDataLoader();
    raster_library();
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
    processor = RasterProcessor(data)

    # Print various statistics of the data
    raster_data_min = processor.min().data
    raster_data_max = processor.max().data
    raster_data_mean = processor.mean().data
    raster_data_median = processor.median().data
    raster_data_std = processor.std().data
    raster_data_variance = processor.var().data
    raster_data_sum = processor.sum().data

    document.getElementById('rasterdata').innerText = f"Selected Variable: ${selectedVariable}"
    

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

    ${processing_time} = execution_time

    # Display the execution time
    document.getElementById('processing-time').innerText = f"Processing Time: {execution_time:.2f} seconds"

    `;
    await pyodide.runPythonAsync(pythonCode);
    console.log("Processing and plotting completed");
    totalTime();
    hideDataLoader();
}

function totalTime() {
    var totalTime = package_loading_time + data_loading_time + processing_time;

    console.log(totalTime);
    $("#total-time").text("Total Time: " + totalTime + " seconds");
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


