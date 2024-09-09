async function raster_library() {

    let pythonCode = `
    import numpy as np
  
    class RasterProcessor:
        def __init__(self, data_array, coords=None):
            """
            Initialize the RasterProcessor with a data array and optional coordinates.
            
            Parameters:
            - data_array: A numpy array or xarray.DataArray containing the raster data.
            - coords: A dictionary containing coordinates for the data array if it's a numpy array.
            """
            if isinstance(data_array, np.ndarray):
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
    `;
    await pyodide.runPythonAsync(pythonCode);
    console.log("Raster Library Loaded");
}