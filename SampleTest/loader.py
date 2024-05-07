from osgeo import gdal
gdal.DontUseExceptions()

filename = "Dataset/NE1_LR_LC/NE1_LR_LC.tif"
dataset = gdal.Open(filename, gdal.GA_ReadOnly)
if not dataset:
    print("Error")


print("Driver: {}/{}".format(dataset.GetDriver().ShortName,
                            dataset.GetDriver().LongName))
print("Size is {} x {} x {}".format(dataset.RasterXSize,
                                    dataset.RasterYSize,
                                    dataset.RasterCount))
print("Projection is {}".format(dataset.GetProjection()))
geotransform = dataset.GetGeoTransform()
if geotransform:
    print("Origin = ({}, {})".format(geotransform[0], geotransform[3]))
    print("Pixel Size = ({}, {})".format(geotransform[1], geotransform[5]))