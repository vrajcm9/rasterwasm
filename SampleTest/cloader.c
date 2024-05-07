#include "gdal_priv.h"
#include "cpl_conv.h" // for CPLMalloc()
#include <ogrsf_frmts.h>

using namespace std;


int main() {
    GDALAllRegister();
    //...
    printf("test");
    return 0;
}