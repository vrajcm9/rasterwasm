import fsspec
import xarray as xr
from matplotlib import pyplot as plt
from rasterlib import RasterProcessor
import numpy as np
import time

# Start timing the execution
start_time = time.time()

# Load the dataset
file_location = 'http://localhost:9000/testbucket/output.zarr/'
ikey = fsspec.get_mapper(file_location)
ds_sst = xr.open_zarr(ikey, consolidated=True)

# Display the dataset information
print(ds_sst)

# Plot configuration
plt.rcParams['figure.figsize'] = 12, 6

# Select and load data for a specific time, latitude, and longitude range
lsm_timeseries = ds_sst['t2m'].sel(time=slice('2024-01-01', '2024-01-03'),
                                   latitude=-47,
                                   longitude=145).load()

# Create a plot
fig, ax = plt.subplots()
lsm_timeseries.plot(ax=ax, label='LSM Timeseries')
plt.legend()
plt.show()

# Generate some random raster data for further processing
time_arr = np.array(['2024-01-01', '2024-01-02', '2024-01-03'], dtype='datetime64[ns]')
latitude = np.array([-47, -46, -45])
longitude = np.array([144, 145, 146])
data = np.random.rand(len(time_arr), len(latitude), len(longitude))

coords = {
    'time': time_arr,
    'latitude': latitude,
    'longitude': longitude
}

# Process the raster data using the RasterProcessor class
processor = RasterProcessor(data, coords)

# Print various statistics of the data
print("Mean:\n", processor.mean())
print("Min:\n", processor.min())
print("Max:\n", processor.max())
print("Sum:\n", processor.sum())
print("Standard Deviation:\n", processor.std())
print("Variance:\n", processor.var())
print("Median:\n", processor.median())



# End timing the execution
end_time = time.time()
execution_time = end_time - start_time

# Print the execution time
print(f"Total execution time: {execution_time:.2f} seconds")

# Plot the processed data
#processor.plot()
