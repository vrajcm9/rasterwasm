let pyodide;
let ds_sst;
 
$(document).ready(async function() {
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

    console.log("Time taken to load packages: " + (endTime - startTime) + "ms");
    $("#package-loading-time").text("Package Loading Time: " + (endTime - startTime)/1000 + " seconds");
});

async function loadData(){
    let pythonCode = `
    import xarray as xr
    import requests
    import zarr
    from zarr.storage import BaseStore, KVStore
    import time

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
    #store = HTTPStore('https://mur-sst.s3.us-west-2.amazonaws.com/zarr-v1/')
    
    kvstore = KVStore(store)
    ds_sst = xr.open_zarr(kvstore, consolidated=True)

    # End timing the execution
    end_time = time.time()
    execution_time = end_time - start_time

    # Print the execution time
    print(f"Data loading execution time: {execution_time:.2f} seconds")
    `
    await pyodide.runPythonAsync(pythonCode);
    ds_sst = pyodide.globals.get('ds_sst');
    console.log("Data loaded");
}

async function processAndPlot(){
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

    t2m_timeseries = ds_sst['t2m'].sel(time = slice('2024-01-01','2024-01-03'),
                                            latitude  = -47,
                                            longitude  = 145
                                        ).load()                                        

    fig, ax = plt.subplots()
    t2m_timeseries.plot(ax=ax, label='T2M Timeseries')

    buf = io.BytesIO()
    fig.savefig(buf, format='png')
    buf.seek(0)
    img_str = "data:image/png;base64," + base64.b64encode(buf.read()).decode('utf-8')
    buf.close()
                                
    html_str = f'<img src="{img_str}" />'
    document.getElementById('plot').innerHTML = html_str

    time_arr = np.array(['2024-01-01', '2024-01-02', '2024-01-03'], dtype='datetime64[ns]')
    latitude = np.array([-47, -46, -45])
    longitude = np.array([144, 145, 146])
    data = np.random.rand(len(time_arr), len(latitude), len(longitude))

    coords = {
        'time': time_arr,
        'latitude': latitude,
        'longitude': longitude
    }

    document.getElementById('rasterdata').innerText = f"test6"
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
    document.getElementById('processing-time').innerText = f"Execution Time: {execution_time:.2f} seconds"
    `
    await pyodide.runPythonAsync(pythonCode);
    console.log("Processing and plotting completed");
}

async function processRasterData(){
    
    let pythonCode = `
    import numpy as np
    import xarray as xr

    class RasterProcessor:
        def __init__(self, data_array, coords=None):
            """
            Initialize the RasterProcessor with a data array and optional coordinates.
            
            Parameters:
            - data_array: A numpy array or xarray.DataArray containing the raster data.
            - coords: A dictionary containing coordinates for the data array if it's a numpy array.
            """
            if isinstance(data_array, np.ndarray):
                if coords is None:
                    raise ValueError("Coordinates must be provided for numpy arrays")
                self.data = xr.DataArray(data_array, coords=coords)
            elif isinstance(data_array, xr.DataArray):
                self.data = data_array
            else:
                raise TypeError("data_array must be a numpy array or xarray DataArray")

        def mean(self, dim=None):
            """
            Calculate the mean of the data.
            
            Parameters:
            - dim: The dimension(s) along which to calculate the mean.
            
            Returns:
            - mean: The mean value(s).
            """
            return self.data.mean(dim=dim)

        def min(self, dim=None):
            """
            Calculate the minimum of the data.
            
            Parameters:
            - dim: The dimension(s) along which to calculate the minimum.
            
            Returns:
            - min: The minimum value(s).
            """
            return self.data.min(dim=dim)

        def max(self, dim=None):
            """
            Calculate the maximum of the data.
            
            Parameters:
            - dim: The dimension(s) along which to calculate the maximum.
            
            Returns:
            - max: The maximum value(s).
            """
            return self.data.max(dim=dim)

        def sum(self, dim=None):
            """
            Calculate the sum of the data.
            
            Parameters:
            - dim: The dimension(s) along which to calculate the sum.
            
            Returns:
            - sum: The sum value(s).
            """
            return self.data.sum(dim=dim)

        def std(self, dim=None):
            """
            Calculate the standard deviation of the data.
            
            Parameters:
            - dim: The dimension(s) along which to calculate the standard deviation.
            
            Returns:
            - std: The standard deviation value(s).
            """
            return self.data.std(dim=dim)

        def var(self, dim=None):
            """
            Calculate the variance of the data.
            
            Parameters:
            - dim: The dimension(s) along which to calculate the variance.
            
            Returns:
            - var: The variance value(s).
            """
            return self.data.var(dim=dim)

        def median(self, dim=None):
            """
            Calculate the median of the data.
            
            Parameters:
            - dim: The dimension(s) along which to calculate the median.
            
            Returns:
            - median: The median value(s).
            """
            return self.data.median(dim=dim)

        def plot(self, **kwargs):
            """
            Plot the data using xarray's built-in plotting capabilities.
            
            Parameters:
            - kwargs: Additional keyword arguments to pass to the plot method.
            """
            self.data.plot(**kwargs)
    `
    await pyodide.runPythonAsync(pythonCode);
    console.log("Processing library loaded");
}
