# Raster Data Processing Loader with WebAssembly and Pyodide

## Project Overview
This project demonstrates the implementation of raster data loading and slicing directly in a web browser using modern technologies such as **WebAssembly (Wasm)** and **Pyodide**. By leveraging Python compiled to WebAssembly, it allows for large-scale climate dataset analysis without leaving the browser. 

## Features
- **Client-Side Raster Data Loading**: Perform slicing on climate datasets using browser-based Python runtime.
- **WebAssembly (Wasm)**: Use Pyodide to run Python code, enabling high-performance computing in browsers.
- **Integration with MinIO**: Load datasets stored in Zarr format from a cloud bucket via MinIO.
- **Interactive Visualization**: Plot and analyze climate data directly within the browser.

## Requirements
- **MinIO**: Host the dataset using MinIO (or a compatible cloud bucket solution).
- **Python 3.x**
- **Pyodide**: Required for running Python in the browser.
- **JavaScript**: JS used for browser integration.
- **Zarr**: Dataset format used for efficient chunked storage.
- **Xarray**: For handling multidimensional arrays and performing data analysis.


## Folder Structure

- **Tests**: Contains experiments run in various environments.
- **Solutions**: Code progression from a basic JavaScript solution to the final implementation.
- **Docs**: Contains detailed documentations regarding project.
- **Root Files**:
  - `index.html`: Main HTML file for the user interface.
  - `packages.js`: JavaScript dependencies, package handling, data loader and visualization.
  - `styles.css`: Styling for the user interface.
  - `raster_library.js`: Core library for raster data processing.

## Installation & Setup

### Running Locally
1. Clone this repository:
    ```bash
    git clone https://github.com/vrajcm9/rasterwasm.git
    ```
2. Download raster data from Climate Data Store(CDS) using the python script provided:
    ```bash
    python Data/loadEra5.ppy
    ```

3. Set up MinIO and upload Zarr dataset:
    - Host your raster data in MinIO or a similar object storage system.
    - Use the `zarr`-formatted climate datasets obtained from step 2.

4. Start a local server to access the Pyodide and JS code.
    ```bash
    python -m http.server 8000
    ```

### Running in Browser
1. Access the project via the browser using Pyodide:
    ```bash
    http://localhost:8000
    ```

2. Load and visualize the climate dataset


