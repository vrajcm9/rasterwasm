async function test(chunkSize) {
    try {
        // const z = await zarr.openArray({
        //     store: "https://mur-sst.s3.us-west-2.amazonaws.com",
        //     path: "zarr-v1/sea_ice_fraction",
        //     mode: "r"
        // });

        const z = await zarr.openArray({
            store: "http://localhost:9000",
            path: "testbucket/output.zarr/v10",
            mode: "r"
        });
        
        const shape = z.shape;
        console.log("MShape: ",shape);
        const totalRows = 3;
        const columns = shape[1];
        
        // Process the array in chunks along the first dimension
        for (let i = 0; i < totalRows; i += chunkSize) {
            
            const end = Math.min(i + chunkSize, totalRows);
            console.log(i);
            const chunk = await z.get([zarr.slice(i, end), zarr.slice(null, columns)]);
            
            // await processChunk(chunk.data.buffer);
            console.log("Chunk: ", chunk);
            // console.log("Chunk data buffer: ", chunk.data.buffer);
        }
    } 
        
        catch (error) {
            console.error('Error fetching data from S3:', error);
    }
  }
    test(1); 