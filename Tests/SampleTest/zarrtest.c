#include "tensorstore/context.h"
#include "tensorstore/open.h"

int
main(int argc, char ** argv)
{
  tensorstore::Context context = tensorstore::Context::Default();

  std::string path = "C:/Dev/ITKIOOMEZarrNGFF/v0.4/cyx.ome.zarr/s0";

  auto openFuture =
    tensorstore::Open({ { "driver", "zarr" }, { "kvstore", { { "driver", "file" }, { "path", path } } } },
                      context,
                      tensorstore::OpenMode::open,
                      tensorstore::RecheckCached{ false },
                      tensorstore::ReadWriteMode::read);

  auto result = openFuture.result();
  if (result.ok())
  {
    std::cout << "status OK";
    auto store = result.value();
    std::cout << store.domain().shape();
  }
  else
  {
    std::cout << "status BAD\n" << result.status();
    return EXIT_FAILURE;
  }

  return EXIT_SUCCESS;
}