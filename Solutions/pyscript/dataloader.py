import xarray as xr
import requests
from zarr.storage import BaseStore, KVStore
from js import document, fetch
import io
import base64
import matplotlib.pyplot as plt
import numpy as np



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

time = np.array(['2024-01-01', '2024-01-02', '2024-01-03'], dtype='datetime64[ns]')
latitude = np.array([-47, -46, -45])
longitude = np.array([144, 145, 146])
data = np.random.rand(len(time), len(latitude), len(longitude))

coords = {
    'time': time,
    'latitude': latitude,
    'longitude': longitude
}

document.getElementById('rasterdata').innerText = f"test4"
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
