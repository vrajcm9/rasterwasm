import cdsapi
import xarray as xr
import pathlib
import sys
import argparse
import math
import dask
import glob

from datetime import date
from dateutil.relativedelta import relativedelta
from pathlib import PurePath

scalefactors = {'sf1'       : {'spatial_resolution': 2.5,  'temporal_resolution': 0.5,  'altitude_resolution': 2},
                'sf10'      : {'spatial_resolution': 1.0,  'temporal_resolution': 0.75, 'altitude_resolution': 2},
                'sf100'     : {'spatial_resolution': 0.5,  'temporal_resolution': 1.25, 'altitude_resolution': 3},
                'sf1000'    : {'spatial_resolution': 0.25, 'temporal_resolution': 2,    'altitude_resolution': 5},
                'sf10000'   : {'spatial_resolution': 0.1,  'temporal_resolution': 3,    'altitude_resolution': 5},
                'sf100000'  : {'spatial_resolution': 0.05, 'temporal_resolution': 6,    'altitude_resolution': 6}
                }

initial_date = date(2024, 1, 1)
default_spatial_resolution = 0.25
remove_nc_files = False
combine_zarr_files = True
downsample_zarr_file = True
DELIMITER_LENGTH = 120
DELIMITER_CHAR = '#'

def printDelimiterLine():
    print("\n" + DELIMITER_CHAR * DELIMITER_LENGTH)

def download_file(path, date):
    c = cdsapi.Client()
    c.retrieve(
        'reanalysis-era5-single-levels',
        {
            'product_type': 'reanalysis',
            'format': 'netcdf',
            'year': [str(date.year)],
            'month': [str(date.month)],
            'day': [str(date.day)],
            'time': ["%02.d:00" % i for i in range(0, 24)],
            'variable': ['10m_u_component_of_wind', '10m_v_component_of_wind',
                         '100m_u_component_of_wind', '100m_v_component_of_wind',
                         '2m_temperature', 'land_sea_mask']
        }, path)

def downloadAndProcess(prefix, date):
    data_filename = prefix + str(date.year) + "_" + str(date.month) + "_" + str(date.day) + ".nc"
    # download single-day file
    if not (data_dir / data_filename).exists():
        print("Downloading '{}' to directory: '{}'".format(str(data_filename),str(data_dir)))
        download_file(data_dir / data_filename, date)
    # remove temporary nc file (if enabled)
    if (remove_nc_files and (data_dir / data_filename).exists()):
       (data_dir / data_filename).unlink()
    return data_filename

def generateOutputFilename(inputFilePath, config):
    spatial_resolution = str(config['spatial_resolution'])
    temporal_resolution = str(config['temporal_resolution'])
    out = str(inputFilePath.stem) + "_lon=" + spatial_resolution + "_lat=" + spatial_resolution + "_time=" + temporal_resolution + str(inputFilePath.suffix)
    return out

def consolidateSingleNetCDFFiles(outFile):
    printDelimiterLine()
    print("> Consolidating single nc files from '{}' and writing them out to zarr file '{}'".format(str(data_dir / "*.nc"), str(outFile)))
    if (outFile).exists():
        print("> Nothing to do!")
        return
    ds_c = xr.open_mfdataset(str(data_dir / "*.nc")).chunk({'time': 21})
    print(ds_c.info)
    ds_c.to_zarr(outFile, safe_chunks=False)
    printDelimiterLine()

def downloadNetCDF(dates):
    # parallel downloading of netcdf files
    prefix = "era5_full_day_"
    processedFiles = []
    for x in dates:
        fname = dask.delayed(downloadAndProcess)(prefix, x)
        processedFiles.append(fname)
    dask.compute(*processedFiles)

if __name__ == "__main__":

    data_dir = pathlib.Path(__file__, "..","data").resolve()
    if not(data_dir.exists()):
        print("Data directory '{}' does not exist...".format(str(data_dir)))
        data_dir.mkdir(parents=True, exist_ok=True)
    parser = argparse.ArgumentParser(description='Generate raster data based on ERA5.')
    parser.add_argument('scale_factor', metavar='scale_factor', default=1, type=int, help='the scale factor of the data set')
    args = parser.parse_args()
    sf = "sf" + str(args.scale_factor)

    # load config
    sf_config = {}
    if (sf in scalefactors):
        sf_config = scalefactors[sf]
        print(sf_config)
    else:
        print(f"Unknown scale factor, available are: {', '.join(key for key in scalefactors.keys())}")
        sys.exit()

    # generate the days
    daysPerYear = 5
    if (initial_date.year % 4 == 0):
        daysPerYear += 1
    days = math.ceil(daysPerYear * sf_config["temporal_resolution"])
    dates = [initial_date + relativedelta(days=x) for x in range(days)]

    # download netcdf files
    downloadNetCDF(dates)

    # combine the files
    combined_zarr_file_raw = "output.zarr"
    outFile_combined = data_dir / combined_zarr_file_raw
    if (combine_zarr_files):
        consolidateSingleNetCDFFiles(outFile_combined)

    # coarsen the zarr file (depending on the config)
    if (downsample_zarr_file):
        printDelimiterLine()
        windowSize = int(sf_config['spatial_resolution'] / default_spatial_resolution)
        outFileFinal = data_dir / generateOutputFilename(outFile_combined, sf_config)
        print("> Coarsening the zarr file '{}' using target window size: {}, output file: '{}'".format(str(outFile_combined),windowSize,str(outFileFinal)))
        if not((outFileFinal).exists()):
            ds = xr.open_zarr(outFile_combined)
            ds_c = ds.coarsen(latitude=windowSize, longitude=windowSize, boundary='pad').mean()
            ds_c.to_zarr(outFileFinal, safe_chunks=False)
        else:
            print("> Nothing to do!")
        printDelimiterLine()