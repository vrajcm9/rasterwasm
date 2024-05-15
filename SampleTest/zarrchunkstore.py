import numpy as np
import zarr
import json


def get_offsets(zstore):
    offsets = {}
    # Traverse the file directory and compute the offsets and chunks
    for i in zstore.zf.infolist():
        # File contents in zip file start 30 + n bytes after the file
        # header offset, where n is the number of bytes of the filename.
        name_bytes = len(i.filename.encode("utf-8"))
        meta = dict(offset=i.header_offset + 30 + name_bytes, size=i.compress_size,)
        offsets[i.filename] = meta
    return offsets


if __name__ == "__main__":
    from zarr.storage import ZipStore
    from skimage import data

    outfile = "logo.zip"
    # Create zarr array
    cat = data.logo()
    store = ZipStore(outfile)
    z = zarr.open(store, shape=cat.shape, dtype=cat.dtype)
    z[:] = cat

    # Write offsets within store
    offsets = get_offsets(store)
    with open(outfile + ".zchunkstore", "w") as f:
        json.dump(offsets, f, indent=2)